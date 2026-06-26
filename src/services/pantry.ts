/**
 * services/pantry.ts — inventario del refrigerador/despensa.
 * Registra lo que hay en casa, avisa lo próximo a vencer y sugiere recetas
 * que puedes preparar con lo que ya tienes. Reutiliza el banco de recetas.
 */
import { DB, save } from "../database/store";
import type { PantryItem } from "../types";
import { RECIPES, GROCERY_ORDER, type Recipe, type GroceryCat } from "../database/recipes";
import { groceryList } from "./mealplan";

export function addPantry(item: string, cat: string, expires?: string) {
  if (!item.trim()) return;
  DB.pantry = DB.pantry || [];
  DB.pantry.push({ id: DB.pantrySeq!++, item: item.trim(), cat, expires: expires || undefined });
  save();
}
export function removePantry(id: number) { DB.pantry = (DB.pantry || []).filter((p) => p.id !== id); save(); }

export function daysToExpire(p: PantryItem): number | null {
  if (!p.expires) return null;
  return Math.round((+new Date(p.expires) - +new Date(new Date().toDateString())) / 864e5);
}
export function expiringSoon(days = 3): PantryItem[] { return (DB.pantry || []).filter((p) => { const d = daysToExpire(p); return d != null && d >= 0 && d <= days; }); }
export function expired(): PantryItem[] { return (DB.pantry || []).filter((p) => { const d = daysToExpire(p); return d != null && d < 0; }); }

export function byCategory(): { cat: GroceryCat; items: PantryItem[] }[] {
  return GROCERY_ORDER.map((cat) => ({ cat, items: (DB.pantry || []).filter((p) => p.cat === cat) })).filter((g) => g.items.length);
}

/** Agrega a la despensa los productos de la lista del súper que no estén ya. */
export function importFromGrocery(): number {
  const have = new Set((DB.pantry || []).map((p) => p.item.toLowerCase()));
  let added = 0;
  groceryList().forEach((g) => g.items.forEach((it) => { if (!have.has(it.item.toLowerCase())) { addPantry(it.item, g.cat); have.add(it.item.toLowerCase()); added++; } }));
  return added;
}

function pantryHas(ingredientItem: string): boolean {
  const ing = ingredientItem.toLowerCase();
  return (DB.pantry || []).some((p) => { const pi = p.item.toLowerCase(); return ing.includes(pi) || pi.includes(ing.split(" ")[0]); });
}

/** Recetas ordenadas por cobertura de ingredientes disponibles en casa. */
export function suggestions(): { recipe: Recipe; coverage: number; missing: string[] }[] {
  if (!(DB.pantry || []).length) return [];
  return RECIPES.map((r) => {
    const missing: string[] = []; let have = 0;
    r.ingredients.forEach((ing) => { if (pantryHas(ing.item)) have++; else missing.push(ing.item); });
    return { recipe: r, coverage: Math.round((have / r.ingredients.length) * 100), missing };
  }).filter((x) => x.coverage > 0).sort((a, b) => b.coverage - a.coverage);
}
