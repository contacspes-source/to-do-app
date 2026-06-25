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
import { RECIPES, recipesByMeal, recipeById, GROCERY_ORDER, type MealSlot, type GroceryCat, type Recipe } from "../database/recipes";

const SLOTS: MealSlot[] = ["desayuno", "colacion", "comida", "cena"];
export const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Identificador de la semana actual (año + número de semana ISO aproximado). */
export function weekKey(d = new Date()): string {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((+d - +onejan) / 864e5) + onejan.getDay() + 1) / 7);
  return d.getFullYear() + "-W" + week;
}

/** Devuelve el plan vigente; lo regenera si no existe o cambió la semana. */
export function getPlan(): Record<string, string> {
  if (!DB.mealPlan || DB.mealPlanWeek !== weekKey() || Object.keys(DB.mealPlan).length === 0) {
    generatePlan();
  }
  return DB.mealPlan!;
}

/** Genera un plan variado para los 7 días. fixedOats fija overnight oats algunos días. */
export function generatePlan(fixedOats = true): void {
  const plan: Record<string, string> = {};
  const pools: Record<MealSlot, Recipe[]> = {
    desayuno: recipesByMeal("desayuno"), colacion: recipesByMeal("colacion"),
    comida: recipesByMeal("comida"), cena: recipesByMeal("cena"),
  };
  const oats = RECIPES.filter((r) => r.tags?.includes("overnight"));
  for (let day = 0; day < 7; day++) {
    SLOTS.forEach((slot, si) => {
      const pool = pools[slot];
      // rotación con desfase por slot para máxima variedad
      let pick = pool[(day + si * 2) % pool.length];
      // Lun/Mié/Vie: overnight oats como desayuno frecuente fijo
      if (fixedOats && slot === "desayuno" && [0, 2, 4].includes(day) && oats.length) {
        pick = oats[day % oats.length];
      }
      plan[day + "-" + slot] = pick.id;
    });
  }
  DB.mealPlan = plan;
  DB.mealPlanWeek = weekKey();
  save();
}

/** Cambia una receta puntual del plan (selección manual del usuario). */
export function setPlanSlot(day: number, slot: MealSlot, recipeId: string) {
  DB.mealPlan = DB.mealPlan || {};
  DB.mealPlan[day + "-" + slot] = recipeId;
  save();
}

export function recipesForDay(day: number): { slot: MealSlot; recipe: Recipe | undefined }[] {
  const plan = getPlan();
  return SLOTS.map((slot) => ({ slot, recipe: recipeById(plan[day + "-" + slot]) }));
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
