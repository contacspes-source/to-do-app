/**
 * services/mealplan.ts — generador de plan semanal y lista de súper inteligente.
 *
 * - Crea variedad rotando el banco de recetas (no repite el mismo platillo).
 * - Las "avenas trasnochadas" pueden fijarse como desayuno frecuente.
 * - La lista del súper se agrupa por categorías automáticamente.
 * - nutritionTargets() deja la base lista para macros/calorías futuras
 *   y se adapta si cambia el peso o la actividad del perfil.
 */
import { DB, save } from "../database/store";
import type { FoodProfile } from "../types";
import { RECIPES, recipesByMeal, recipeById, recipeMacros, GROCERY_ORDER, type MealSlot, type GroceryCat, type Recipe } from "../database/recipes";

export interface SlotDef { slot: string; pool: MealSlot; label: string; }
/** 5 tiempos base; 6º (colación nocturna) si el objetivo es ganar músculo. */
export function planSlots(): SlotDef[] {
  const base: SlotDef[] = [
    { slot: "desayuno", pool: "desayuno", label: "Desayuno" },
    { slot: "colacion1", pool: "colacion", label: "Colación matutina" },
    { slot: "comida", pool: "comida", label: "Comida" },
    { slot: "colacion2", pool: "colacion", label: "Colación vespertina" },
    { slot: "cena", pool: "cena", label: "Cena" },
  ];
  if (DB.foodProfile?.goal === "muscle") base.push({ slot: "extra", pool: "colacion", label: "Colación nocturna" });
  return base;
}
export const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Identificador de la semana actual (año + número de semana ISO aproximado). */
export function weekKey(d = new Date()): string {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((+d - +onejan) / 864e5) + onejan.getDay() + 1) / 7);
  return d.getFullYear() + "-W" + week;
}

/** Devuelve el plan vigente; lo regenera si no existe o cambió la semana. */
export function getPlan(): Record<string, string> {
  const slots = planSlots();
  const structOk = DB.mealPlan && slots.every((d) => DB.mealPlan!["0-" + d.slot]);
  if (!DB.mealPlan || DB.mealPlanWeek !== weekKey() || Object.keys(DB.mealPlan).length === 0 || !structOk) {
    generatePlan();
  }
  return DB.mealPlan!;
}

function biasedPool(pool: Recipe[], type: string): Recipe[] {
  if (type === "proteina") return [...pool].sort((a, b) => recipeMacros(b.id).p - recipeMacros(a.id).p);
  if (type === "economica") { const eco = pool.filter((r) => r.tags?.some((t) => t === "economica" || t === "rapida")); return eco.length ? eco.concat(pool.filter((r) => !eco.includes(r))) : pool; }
  return pool;
}

/** Ajusta el orden del pool según el objetivo físico (déficit/músculo). */
function goalBias(pool: Recipe[]): Recipe[] {
  const goal = DB.foodProfile?.goal;
  if (goal === "deficit") return [...pool].sort((a, b) => recipeMacros(a.id).kcal - recipeMacros(b.id).kcal);
  if (goal === "muscle") return [...pool].sort((a, b) => recipeMacros(b.id).kcal - recipeMacros(a.id).kcal);
  return pool;
}

/**
 * Regeneración inteligente: combina tipo + objetivo, evita repetir las recetas
 * del plan anterior y reparte con variedad. Cada regeneración se siente distinta
 * pero coherente (no es 100% aleatoria).
 */
export function generatePlan(type?: string): void {
  type = type || DB.mealPlanType || "variado";
  DB.mealPlanType = type;
  const prev = new Set(Object.values(DB.mealPlan || {}));
  const plan: Record<string, string> = {};
  const slots = planSlots();
  const oats = RECIPES.filter((r) => r.tags?.includes("overnight"));
  const usedThisWeek: Record<string, Set<string>> = {};

  slots.forEach((def, si) => {
    // pool ordenado por tipo y objetivo
    let pool = goalBias(biasedPool(recipesByMeal(def.pool), type!));
    // preferimos recetas no usadas la semana pasada (variedad real)
    const fresh = pool.filter((r) => !prev.has(r.id));
    const ranked = fresh.length >= 5 ? fresh.concat(pool.filter((r) => prev.has(r.id))) : pool;
    usedThisWeek[def.slot] = new Set();
    const offset = Math.floor(Math.random() * ranked.length); // varía en cada regeneración
    for (let day = 0; day < 7; day++) {
      let idx = (offset + day) % ranked.length;
      let pick = ranked[idx];
      // evitar repetir el mismo platillo en días seguidos del mismo slot
      let guard = 0;
      while (usedThisWeek[def.slot].has(pick.id) && guard < ranked.length) { idx = (idx + 1) % ranked.length; pick = ranked[idx]; guard++; }
      if (def.pool === "desayuno" && [0, 2, 4].includes(day) && oats.length) pick = oats[day % oats.length];
      usedThisWeek[def.slot].add(pick.id);
      plan[day + "-" + def.slot] = pick.id;
    }
  });
  DB.mealPlan = plan;
  DB.mealPlanWeek = weekKey();
  // Mantener la lista del súper sincronizada: quitar marcados que ya no aplican
  const valid = new Set<string>();
  groceryList().forEach((g) => g.items.forEach((it) => valid.add(g.cat + ":" + it.item)));
  DB.comidaCheck = DB.comidaCheck || {};
  Object.keys(DB.comidaCheck).forEach((k) => { if (!valid.has(k)) delete DB.comidaCheck![k]; });
  save();
}

/** Cambia una receta puntual del plan (selección manual del usuario). */
export function setPlanSlot(day: number, slot: string, recipeId: string) {
  DB.mealPlan = DB.mealPlan || {};
  DB.mealPlan[day + "-" + slot] = recipeId;
  save();
}

export function recipesForDay(day: number): { slot: string; label: string; pool: MealSlot; recipe: Recipe | undefined }[] {
  const plan = getPlan();
  return planSlots().map((d) => ({ slot: d.slot, label: d.label, pool: d.pool, recipe: recipeById(plan[day + "-" + d.slot]) }));
}

/** Lista de súper agrupada por categoría a partir del plan vigente. */
export function groceryList(): { cat: GroceryCat; items: { item: string; count: number; qty: string }[] }[] {
  const plan = getPlan();
  const bucket: Record<string, { item: string; count: number; qty: string; cat: GroceryCat }> = {};
  Object.values(plan).forEach((id) => {
    const r = recipeById(id); if (!r) return;
    r.ingredients.forEach((ing) => {
      const key = ing.cat + "|" + ing.item;
      if (!bucket[key]) bucket[key] = { item: ing.item, count: 0, qty: ing.qty, cat: ing.cat };
      bucket[key].count++;
    });
  });
  return GROCERY_ORDER.map((cat) => ({
    cat,
    items: Object.values(bucket).filter((b) => b.cat === cat)
      .sort((a, b) => a.item.localeCompare(b.item))
      .map((b) => ({ item: b.item, count: b.count, qty: b.qty })),
  })).filter((g) => g.items.length);
}

/**
 * Metas nutricionales base (Mifflin-St Jeor). Deja lista la arquitectura
 * para mostrar calorías/macros y se recalcula si cambian peso o actividad.
 */
export function nutritionTargets(p: FoodProfile = DB.foodProfile!) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * 25 + 5; // hombre, ~25 años
  const factor = { none: 1.2, light: 1.375, moderate: 1.55, high: 1.725 }[p.activity] || 1.2;
  let kcal = bmr * factor;
  if (p.goal === "deficit") kcal -= 300;
  if (p.goal === "muscle") kcal += 200;
  const protein = Math.round(p.weight * 1.8); // g/día
  const imc = +(p.weight / Math.pow(p.height / 100, 2)).toFixed(1);
  return { kcal: Math.round(kcal), protein, waterL: p.waterTargetL, imc };
}
