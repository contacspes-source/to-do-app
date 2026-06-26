/**
 * database/recipes.ts — banco de recetas de MealPrep.
 *
 * Inspirado en el plan de la Nutrióloga Michelle Guadarrama (Ced. 11034944):
 * mantiene su filosofía (alta proteína, alto volumen de verdura, porciones medidas,
 * desayunos tipo overnight oats / smoothies) pero con MAYOR VARIEDAD y adaptado a
 * las preferencias de Jorge:
 *   • Evita el jitomate como ingrediente principal (se ofrecen alternativas).
 *   • Favorece: brócoli, zanahoria, pepino, lechuga, pasta boloñesa, smoothies y overnight oats.
 * Las recetas son fáciles, económicas y aptas para preparar por lotes (meal prep).
 */

export type MealSlot = "desayuno" | "colacion" | "comida" | "cena";
export type GroceryCat = "Frutas" | "Verduras" | "Proteínas" | "Lácteos" | "Cereales y granos" | "Despensa" | "Bebidas";

export interface Ingredient { item: string; qty: string; cat: GroceryCat; }
export interface Recipe {
  id: string;
  meal: MealSlot;
  name: string;
  protein: string;       // referencia de proteína/porción
  ingredients: Ingredient[];
  prep: string;          // pasos breves
  tags?: string[];       // p.ej. "overnight", "smoothie", "fijo", "boloñesa"
  avoidsTomato?: boolean;
}

export const RECIPES: Recipe[] = [
  // ---------------- DESAYUNOS ----------------
  { id: "d-oats-clasico", meal: "desayuno", name: "Overnight oats clásico", protein: "~30 g",
    ingredients: [
      { item: "Avena cruda", qty: "½ taza", cat: "Cereales y granos" },
      { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" },
      { item: "Leche light", qty: "½ taza", cat: "Lácteos" },
      { item: "Chía", qty: "1 cda", cat: "Despensa" },
      { item: "Linaza", qty: "1 cda", cat: "Despensa" },
      { item: "Manzana", qty: "1 pza", cat: "Frutas" },
    ],
    prep: "La noche anterior mezcla avena, yogurt, leche, chía y linaza en un frasco. Refrigera. En la mañana decora con manzana picada.",
    tags: ["overnight", "fijo"], avoidsTomato: true },
  { id: "d-oats-cacao", meal: "desayuno", name: "Overnight oats de cacao y plátano", protein: "~28 g",
    ingredients: [
      { item: "Avena cruda", qty: "½ taza", cat: "Cereales y granos" },
      { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" },
      { item: "Leche light", qty: "½ taza", cat: "Lácteos" },
      { item: "Cacao en polvo", qty: "1 cda", cat: "Despensa" },
      { item: "Crema de cacahuate", qty: "1 cda", cat: "Despensa" },
      { item: "Plátano", qty: "1 pza", cat: "Frutas" },
    ],
    prep: "Mezcla todo en frasco la noche anterior excepto el plátano; agrégalo en rodajas al servir.",
    tags: ["overnight"], avoidsTomato: true },
  { id: "d-smoothie-mango", meal: "desayuno", name: "Smoothie de mango", protein: "~25 g",
    ingredients: [
      { item: "Mango congelado", qty: "½ taza", cat: "Frutas" },
      { item: "Leche light", qty: "1 taza", cat: "Lácteos" },
      { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" },
      { item: "Avena cruda", qty: "1 cda", cat: "Cereales y granos" },
      { item: "Linaza", qty: "1 cda", cat: "Despensa" },
    ],
    prep: "Licúa todo con hielo hasta que quede cremoso. Decora con almendras.",
    tags: ["smoothie"], avoidsTomato: true },
  { id: "d-smoothie-verde", meal: "desayuno", name: "Smoothie tropical", protein: "~25 g",
    ingredients: [
      { item: "Plátano", qty: "1 pza", cat: "Frutas" },
      { item: "Piña", qty: "½ taza", cat: "Frutas" },
      { item: "Leche light", qty: "1 taza", cat: "Lácteos" },
      { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" },
      { item: "Avena cruda", qty: "2 cda", cat: "Cereales y granos" },
    ],
    prep: "Licúa todo con hielo. Rápido y portátil para días de prisa.",
    tags: ["smoothie"], avoidsTomato: true },
  { id: "d-huevo-frijol", meal: "desayuno", name: "Huevo con frijol y tortilla", protein: "~28 g",
    ingredients: [
      { item: "Huevo", qty: "3 pzas", cat: "Proteínas" },
      { item: "Frijol cocido", qty: "½ taza", cat: "Cereales y granos" },
      { item: "Tortilla de maíz", qty: "2 pzas", cat: "Cereales y granos" },
      { item: "Manzana", qty: "1 pza", cat: "Frutas" },
    ],
    prep: "Revuelve los huevos, calienta el frijol y arma tacos. Acompaña con fruta.",
    avoidsTomato: true },
  { id: "d-bionico", meal: "desayuno", name: "Bionico de yogurt", protein: "~22 g",
    ingredients: [
      { item: "Yogurt griego doble cero", qty: "1 taza", cat: "Lácteos" },
      { item: "Manzana", qty: "1 pza", cat: "Frutas" },
      { item: "Plátano", qty: "1 pza", cat: "Frutas" },
      { item: "Avena cruda", qty: "2 cda", cat: "Cereales y granos" },
      { item: "Almendras", qty: "5 pzas", cat: "Despensa" },
    ],
    prep: "Pica la fruta, mézclala con el yogurt y la avena. Corona con almendras.",
    avoidsTomato: true },

  // ---------------- COLACIONES ----------------
  { id: "c-manzana", meal: "colacion", name: "Manzana", protein: "—",
    ingredients: [{ item: "Manzana", qty: "1 pza", cat: "Frutas" }], prep: "Lava y come.", avoidsTomato: true },
  { id: "c-pepino", meal: "colacion", name: "Pepino en rodajas con limón", protein: "—",
    ingredients: [{ item: "Pepino", qty: "1 pza", cat: "Verduras" }, { item: "Limón", qty: "1 pza", cat: "Frutas" }],
    prep: "Rebana el pepino y exprime limón. Fresco y bajo en calorías.", avoidsTomato: true },
  { id: "c-zanahoria", meal: "colacion", name: "Bastones de zanahoria", protein: "—",
    ingredients: [{ item: "Zanahoria", qty: "1 pza", cat: "Verduras" }], prep: "Pela y corta en bastones. Llévalos listos.", avoidsTomato: true },
  { id: "c-uvas", meal: "colacion", name: "Uvas", protein: "—",
    ingredients: [{ item: "Uvas", qty: "20 pzas", cat: "Frutas" }], prep: "Lava y porciona.", avoidsTomato: true },
  { id: "c-pera", meal: "colacion", name: "Pera con cáscara", protein: "—",
    ingredients: [{ item: "Pera", qty: "1 pza", cat: "Frutas" }], prep: "Lava y come con cáscara.", avoidsTomato: true },
  { id: "c-yogurt-almendra", meal: "colacion", name: "Yogurt con almendras", protein: "~15 g",
    ingredients: [{ item: "Yogurt griego doble cero", qty: "¾ taza", cat: "Lácteos" }, { item: "Almendras", qty: "10 pzas", cat: "Despensa" }],
    prep: "Mezcla y listo. Buena proteína entre comidas.", avoidsTomato: true },

  // ---------------- COMIDAS ----------------
  { id: "m-pechuga-arroz", meal: "comida", name: "Pechuga + arroz + brócoli", protein: "~45 g",
    ingredients: [
      { item: "Pechuga de pollo", qty: "200 g", cat: "Proteínas" },
      { item: "Arroz", qty: "1 taza", cat: "Cereales y granos" },
      { item: "Brócoli", qty: "1 taza", cat: "Verduras" },
      { item: "Pepino", qty: "1 pza", cat: "Verduras" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
      { item: "Crema light", qty: "2 cda", cat: "Lácteos" },
    ],
    prep: "Asa o desmenuza la pechuga (sale del batch). Cuece arroz y brócoli al vapor. Arma con lechuga y pepino.",
    avoidsTomato: true },
  { id: "m-pasta-bolonesa", meal: "comida", name: "Pasta boloñesa de res", protein: "~40 g",
    ingredients: [
      { item: "Pasta", qty: "1 taza cocida", cat: "Cereales y granos" },
      { item: "Carne molida de res", qty: "140 g", cat: "Proteínas" },
      { item: "Zanahoria", qty: "1 pza", cat: "Verduras" },
      { item: "Cebolla", qty: "¼ pza", cat: "Verduras" },
      { item: "Salsa de tomate natural (opcional)", qty: "al gusto", cat: "Despensa" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
    ],
    prep: "Sofríe carne con cebolla y zanahoria rallada. Mezcla con la pasta. (Sin jitomate fresco; si quieres color usa un poco de salsa natural, opcional.) Acompaña con ensalada.",
    tags: ["boloñesa"], avoidsTomato: true },
  { id: "m-atun-ensalada", meal: "comida", name: "Ensalada de atún con tostadas", protein: "~38 g",
    ingredients: [
      { item: "Atún en agua", qty: "2 latas", cat: "Proteínas" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
      { item: "Pepino", qty: "1 pza", cat: "Verduras" },
      { item: "Zanahoria", qty: "1 pza", cat: "Verduras" },
      { item: "Cebolla", qty: "¼ pza", cat: "Verduras" },
      { item: "Limón", qty: "1 pza", cat: "Frutas" },
      { item: "Tostadas horneadas", qty: "5 pzas", cat: "Cereales y granos" },
    ],
    prep: "Escurre y enjuaga el atún. Mezcla con verdura picada, limón y cilantro. Sirve sobre tostadas.",
    avoidsTomato: true },
  { id: "m-volcanes-res", meal: "comida", name: "Volcanes de res con panela", protein: "~42 g",
    ingredients: [
      { item: "Carne de res asada", qty: "140 g", cat: "Proteínas" },
      { item: "Queso panela", qty: "60 g", cat: "Lácteos" },
      { item: "Tostadas horneadas", qty: "4 pzas", cat: "Cereales y granos" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
      { item: "Zanahoria", qty: "1 pza", cat: "Verduras" },
    ],
    prep: "Gratina panela sobre las tostadas, agrega la res asada y acompaña con ensalada. Salsa verde al gusto.",
    avoidsTomato: true },
  { id: "m-pollo-brocoli-pasta", meal: "comida", name: "Pollo al curry suave con pasta y brócoli", protein: "~44 g",
    ingredients: [
      { item: "Pechuga de pollo", qty: "180 g", cat: "Proteínas" },
      { item: "Pasta", qty: "1 taza cocida", cat: "Cereales y granos" },
      { item: "Brócoli", qty: "1 taza", cat: "Verduras" },
      { item: "Zanahoria", qty: "1 pza", cat: "Verduras" },
      { item: "Leche light", qty: "½ taza", cat: "Lácteos" },
    ],
    prep: "Saltea pollo en cubos, agrega verdura y un toque de curry con leche light. Mezcla con la pasta.",
    avoidsTomato: true },

  // ---------------- CENAS ----------------
  { id: "n-sandwich-frijol", meal: "cena", name: "Sándwich de frijoles", protein: "~30 g",
    ingredients: [
      { item: "Pan integral doble cero", qty: "2 reb", cat: "Cereales y granos" },
      { item: "Frijol cocido", qty: "½ taza", cat: "Cereales y granos" },
      { item: "Queso panela", qty: "120 g", cat: "Lácteos" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
      { item: "Pepino", qty: "1 pza", cat: "Verduras" },
    ],
    prep: "Unta frijol, agrega panela asada, lechuga y pepino. Salsa al gusto.",
    avoidsTomato: true },
  { id: "n-sincronizadas", meal: "cena", name: "Sincronizadas de pollo y panela", protein: "~35 g",
    ingredients: [
      { item: "Tortilla de maíz", qty: "3 pzas", cat: "Cereales y granos" },
      { item: "Pechuga de pollo", qty: "100 g", cat: "Proteínas" },
      { item: "Queso panela", qty: "70 g", cat: "Lácteos" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
      { item: "Pepino", qty: "1 pza", cat: "Verduras" },
    ],
    prep: "Arma sincronizadas con pollo y panela; dora en comal. Ensalada al lado.",
    avoidsTomato: true },
  { id: "n-burritos-frijol", meal: "cena", name: "Burritos de frijol con requesón", protein: "~28 g",
    ingredients: [
      { item: "Tortilla de harina integral", qty: "4 pzas", cat: "Cereales y granos" },
      { item: "Requesón", qty: "140 g", cat: "Lácteos" },
      { item: "Frijol molido", qty: "½ taza", cat: "Cereales y granos" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
    ],
    prep: "Rellena las tortillas con frijol y requesón. Dora ligero. Salsa al gusto.",
    avoidsTomato: true },
  { id: "n-quesadillas-panela", meal: "cena", name: "Quesadillas de panela", protein: "~30 g",
    ingredients: [
      { item: "Tortilla de maíz", qty: "4 pzas", cat: "Cereales y granos" },
      { item: "Queso panela", qty: "100 g", cat: "Lácteos" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
      { item: "Pepino", qty: "1 pza", cat: "Verduras" },
      { item: "Zanahoria", qty: "1 pza", cat: "Verduras" },
    ],
    prep: "Rellena tortillas con panela y asa. Acompaña con ensalada rallada.",
    avoidsTomato: true },
  { id: "n-wrap-atun", meal: "cena", name: "Wrap de atún y verduras", protein: "~32 g",
    ingredients: [
      { item: "Tortilla de harina integral", qty: "2 pzas", cat: "Cereales y granos" },
      { item: "Atún en agua", qty: "1 lata", cat: "Proteínas" },
      { item: "Lechuga", qty: "1 taza", cat: "Verduras" },
      { item: "Pepino", qty: "1 pza", cat: "Verduras" },
      { item: "Zanahoria", qty: "1 pza", cat: "Verduras" },
    ],
    prep: "Mezcla atún con limón, rellena la tortilla con verdura y enrolla.",
    avoidsTomato: true },
];

/** "Alimentos libres" del plan (consumo flexible). */
export const FREE_FOODS = [
  "Zanahoria, pepino y betabel rallado", "Jícama", "Brócoli", "Manzana",
  "Gelatina sin azúcar", "Café o té sin azúcar",
];

/** Orden de categorías para la lista del súper. */
export const GROCERY_ORDER: GroceryCat[] = ["Frutas", "Verduras", "Proteínas", "Lácteos", "Cereales y granos", "Despensa", "Bebidas"];

export const MEAL_LABELS: Record<MealSlot, string> = {
  desayuno: "Desayuno", colacion: "Colación", comida: "Comida", cena: "Cena",
};

export function recipesByMeal(meal: MealSlot): Recipe[] { return RECIPES.filter((r) => r.meal === meal); }
export function recipeById(id: string): Recipe | undefined { return RECIPES.find((r) => r.id === id); }

/* ---------- Macros por receta (estimaciones para meal prep) ---------- */
export interface Macros { kcal: number; p: number; c: number; f: number; }
export const MACROS: Record<string, Macros> = {
  // Desayunos
  "d-oats-clasico": { kcal: 380, p: 30, c: 45, f: 10 },
  "d-oats-cacao": { kcal: 420, p: 28, c: 50, f: 14 },
  "d-smoothie-mango": { kcal: 300, p: 25, c: 40, f: 5 },
  "d-smoothie-verde": { kcal: 320, p: 25, c: 42, f: 6 },
  "d-huevo-frijol": { kcal: 400, p: 28, c: 35, f: 16 },
  "d-bionico": { kcal: 330, p: 22, c: 45, f: 8 },
  // Colaciones
  "c-manzana": { kcal: 95, p: 0, c: 25, f: 0 },
  "c-pepino": { kcal: 30, p: 1, c: 6, f: 0 },
  "c-zanahoria": { kcal: 50, p: 1, c: 12, f: 0 },
  "c-uvas": { kcal: 110, p: 1, c: 28, f: 0 },
  "c-pera": { kcal: 100, p: 1, c: 27, f: 0 },
  "c-yogurt-almendra": { kcal: 200, p: 16, c: 12, f: 9 },
  // Comidas
  "m-pechuga-arroz": { kcal: 520, p: 45, c: 55, f: 12 },
  "m-pasta-bolonesa": { kcal: 560, p: 40, c: 60, f: 16 },
  "m-atun-ensalada": { kcal: 430, p: 38, c: 40, f: 12 },
  "m-volcanes-res": { kcal: 520, p: 42, c: 38, f: 22 },
  "m-pollo-brocoli-pasta": { kcal: 540, p: 44, c: 55, f: 15 },
  // Cenas
  "n-sandwich-frijol": { kcal: 420, p: 30, c: 45, f: 12 },
  "n-sincronizadas": { kcal: 450, p: 35, c: 40, f: 16 },
  "n-burritos-frijol": { kcal: 400, p: 28, c: 45, f: 12 },
  "n-quesadillas-panela": { kcal: 430, p: 30, c: 40, f: 16 },
  "n-wrap-atun": { kcal: 380, p: 32, c: 38, f: 10 },
};
export function recipeMacros(id: string): Macros { return MACROS[id] || { kcal: 0, p: 0, c: 0, f: 0 }; }

/* ============================================================
   Recetas adicionales (variedad: desayunos, smoothies, overnight oats,
   pastas, pollo, carne, atún, ensaladas, rápidas y económicas).
   ============================================================ */
const EXTRA: Recipe[] = [
  // --- Desayunos / smoothies / overnight oats ---
  { id: "e-oats-fresa", meal: "desayuno", name: "Overnight oats de fresa", protein: "~26 g", ingredients: [{ item: "Avena cruda", qty: "½ taza", cat: "Cereales y granos" }, { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" }, { item: "Leche light", qty: "½ taza", cat: "Lácteos" }, { item: "Fresa", qty: "½ taza", cat: "Frutas" }, { item: "Chía", qty: "1 cda", cat: "Despensa" }], prep: "Mezcla todo en frasco la noche anterior y refrigera.", tags: ["overnight"], avoidsTomato: true },
  { id: "e-oats-manzana", meal: "desayuno", name: "Overnight oats manzana-canela", protein: "~25 g", ingredients: [{ item: "Avena cruda", qty: "½ taza", cat: "Cereales y granos" }, { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" }, { item: "Manzana", qty: "1 pza", cat: "Frutas" }, { item: "Canela", qty: "1 cdita", cat: "Despensa" }, { item: "Nuez", qty: "5 pzas", cat: "Despensa" }], prep: "Ralla la manzana, mezcla con avena, yogurt y canela. Refrigera.", tags: ["overnight"], avoidsTomato: true },
  { id: "e-smoothie-fresa", meal: "desayuno", name: "Smoothie fresa-plátano", protein: "~24 g", ingredients: [{ item: "Fresa", qty: "1 taza", cat: "Frutas" }, { item: "Plátano", qty: "1 pza", cat: "Frutas" }, { item: "Leche light", qty: "1 taza", cat: "Lácteos" }, { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" }], prep: "Licúa con hielo.", tags: ["smoothie"], avoidsTomato: true },
  { id: "e-smoothie-cacao", meal: "desayuno", name: "Smoothie cacao-cacahuate", protein: "~28 g", ingredients: [{ item: "Plátano", qty: "1 pza", cat: "Frutas" }, { item: "Cacao en polvo", qty: "1 cda", cat: "Despensa" }, { item: "Crema de cacahuate", qty: "1 cda", cat: "Despensa" }, { item: "Leche light", qty: "1 taza", cat: "Lácteos" }, { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" }], prep: "Licúa con hielo hasta cremoso.", tags: ["smoothie"], avoidsTomato: true },
  { id: "e-smoothie-pina", meal: "desayuno", name: "Smoothie de piña", protein: "~22 g", ingredients: [{ item: "Piña", qty: "1 taza", cat: "Frutas" }, { item: "Leche light", qty: "1 taza", cat: "Lácteos" }, { item: "Yogurt griego doble cero", qty: "½ taza", cat: "Lácteos" }, { item: "Avena cruda", qty: "1 cda", cat: "Cereales y granos" }], prep: "Licúa con hielo.", tags: ["smoothie"], avoidsTomato: true },
  { id: "e-omelette-espinaca", meal: "desayuno", name: "Omelette de pimiento y queso", protein: "~30 g", ingredients: [{ item: "Huevo", qty: "3 pzas", cat: "Proteínas" }, { item: "Pimiento", qty: "1 pza", cat: "Verduras" }, { item: "Queso panela", qty: "40 g", cat: "Lácteos" }, { item: "Tortilla de maíz", qty: "1 pza", cat: "Cereales y granos" }], prep: "Bate los huevos, agrega pimiento picado y queso, cuaja en sartén.", avoidsTomato: true },
  { id: "e-hotcakes-avena", meal: "desayuno", name: "Hotcakes de avena y plátano", protein: "~24 g", ingredients: [{ item: "Avena cruda", qty: "½ taza", cat: "Cereales y granos" }, { item: "Plátano", qty: "1 pza", cat: "Frutas" }, { item: "Huevo", qty: "2 pzas", cat: "Proteínas" }, { item: "Canela", qty: "1 cdita", cat: "Despensa" }], prep: "Licúa todo y cocina como hotcakes en sartén antiadherente.", avoidsTomato: true },
  { id: "e-yogurt-granola", meal: "desayuno", name: "Yogurt con granola y fruta", protein: "~20 g", ingredients: [{ item: "Yogurt griego doble cero", qty: "1 taza", cat: "Lácteos" }, { item: "Granola", qty: "¼ taza", cat: "Cereales y granos" }, { item: "Fresa", qty: "½ taza", cat: "Frutas" }], prep: "Sirve en capas. Rápido y portátil.", tags: ["rapida"], avoidsTomato: true },
  // --- Comidas ---
  { id: "e-pasta-atun", meal: "comida", name: "Pasta con atún y verduras", protein: "~36 g", ingredients: [{ item: "Pasta", qty: "1 taza cocida", cat: "Cereales y granos" }, { item: "Atún en agua", qty: "1 lata", cat: "Proteínas" }, { item: "Brócoli", qty: "1 taza", cat: "Verduras" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }, { item: "Aceite de oliva", qty: "1 cda", cat: "Despensa" }], prep: "Saltea verdura, mezcla con la pasta y el atún escurrido.", tags: ["economica"], avoidsTomato: true },
  { id: "e-pasta-pollo-pesto", meal: "comida", name: "Pasta con pollo al pesto", protein: "~42 g", ingredients: [{ item: "Pasta", qty: "1 taza cocida", cat: "Cereales y granos" }, { item: "Pechuga de pollo", qty: "150 g", cat: "Proteínas" }, { item: "Pesto", qty: "1 cda", cat: "Despensa" }, { item: "Brócoli", qty: "1 taza", cat: "Verduras" }], prep: "Saltea el pollo, mezcla con pasta, pesto y brócoli al vapor.", avoidsTomato: true },
  { id: "e-pollo-camote", meal: "comida", name: "Pollo asado con camote y brócoli", protein: "~46 g", ingredients: [{ item: "Pechuga de pollo", qty: "180 g", cat: "Proteínas" }, { item: "Camote", qty: "1 pza", cat: "Verduras" }, { item: "Brócoli", qty: "1 taza", cat: "Verduras" }, { item: "Aceite de oliva", qty: "1 cda", cat: "Despensa" }], prep: "Hornea camote y brócoli con el pollo (air fryer 200°C).", avoidsTomato: true },
  { id: "e-pollo-salteado", meal: "comida", name: "Salteado de pollo y verduras", protein: "~44 g", ingredients: [{ item: "Pechuga de pollo", qty: "180 g", cat: "Proteínas" }, { item: "Pimiento", qty: "1 pza", cat: "Verduras" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }, { item: "Arroz", qty: "1 taza", cat: "Cereales y granos" }, { item: "Salsa de soya", qty: "1 cda", cat: "Despensa" }], prep: "Saltea pollo y verdura con soya; sirve sobre arroz.", avoidsTomato: true },
  { id: "e-carne-arroz", meal: "comida", name: "Salteado de res con verduras", protein: "~42 g", ingredients: [{ item: "Res en tiras", qty: "150 g", cat: "Proteínas" }, { item: "Brócoli", qty: "1 taza", cat: "Verduras" }, { item: "Pimiento", qty: "1 pza", cat: "Verduras" }, { item: "Arroz", qty: "1 taza", cat: "Cereales y granos" }, { item: "Salsa de soya", qty: "1 cda", cat: "Despensa" }], prep: "Saltea la res a fuego alto, agrega verdura y soya; sirve con arroz.", avoidsTomato: true },
  { id: "e-albondigas", meal: "comida", name: "Albóndigas de res con zanahoria", protein: "~40 g", ingredients: [{ item: "Carne molida de res", qty: "150 g", cat: "Proteínas" }, { item: "Zanahoria", qty: "1 taza", cat: "Verduras" }, { item: "Arroz", qty: "1 taza", cat: "Cereales y granos" }, { item: "Cebolla", qty: "¼ pza", cat: "Verduras" }], prep: "Forma albóndigas, cuécelas con zanahoria en caldo ligero; sirve con arroz.", avoidsTomato: true },
  { id: "e-fajitas-pollo", meal: "comida", name: "Fajitas de pollo con pimiento", protein: "~44 g", ingredients: [{ item: "Pechuga de pollo", qty: "180 g", cat: "Proteínas" }, { item: "Pimiento", qty: "1 pza", cat: "Verduras" }, { item: "Cebolla", qty: "½ pza", cat: "Verduras" }, { item: "Tortilla de maíz", qty: "3 pzas", cat: "Cereales y granos" }], prep: "Saltea pollo con pimiento y cebolla; arma tacos.", avoidsTomato: true },
  { id: "e-ensalada-pollo-garbanzo", meal: "comida", name: "Ensalada de pollo y garbanzo", protein: "~40 g", ingredients: [{ item: "Pechuga de pollo", qty: "120 g", cat: "Proteínas" }, { item: "Garbanzo cocido", qty: "½ taza", cat: "Cereales y granos" }, { item: "Lechuga", qty: "2 tazas", cat: "Verduras" }, { item: "Pepino", qty: "1 pza", cat: "Verduras" }, { item: "Aceite de oliva", qty: "1 cda", cat: "Despensa" }], prep: "Mezcla todo con limón y aceite. Lista para meal prep.", tags: ["ensalada"], avoidsTomato: true },
  { id: "e-atun-papa", meal: "comida", name: "Papa rellena de atún", protein: "~34 g", ingredients: [{ item: "Papa", qty: "1 grande", cat: "Verduras" }, { item: "Atún en agua", qty: "1 lata", cat: "Proteínas" }, { item: "Elote", qty: "¼ taza", cat: "Verduras" }, { item: "Yogurt griego doble cero", qty: "2 cda", cat: "Lácteos" }], prep: "Hornea la papa, rellena con atún mezclado con yogurt y elote.", tags: ["economica"], avoidsTomato: true },
  { id: "e-bowl-arroz-huevo", meal: "comida", name: "Bowl de arroz, huevo y verduras", protein: "~26 g", ingredients: [{ item: "Arroz", qty: "1 taza", cat: "Cereales y granos" }, { item: "Huevo", qty: "2 pzas", cat: "Proteínas" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }, { item: "Chícharo", qty: "¼ taza", cat: "Verduras" }, { item: "Salsa de soya", qty: "1 cda", cat: "Despensa" }], prep: "Saltea arroz con verdura y soya; agrega huevo estrellado.", tags: ["economica", "rapida"], avoidsTomato: true },
  // --- Cenas ---
  { id: "e-quesadilla-champinon", meal: "cena", name: "Quesadillas de pimiento y panela", protein: "~26 g", ingredients: [{ item: "Tortilla de maíz", qty: "3 pzas", cat: "Cereales y granos" }, { item: "Pimiento", qty: "1 taza", cat: "Verduras" }, { item: "Queso panela", qty: "80 g", cat: "Lácteos" }], prep: "Saltea el pimiento, arma quesadillas con panela y dora en comal.", avoidsTomato: true },
  { id: "e-tostadas-frijol-aguacate", meal: "cena", name: "Tostadas de frijol y aguacate", protein: "~22 g", ingredients: [{ item: "Tostadas horneadas", qty: "3 pzas", cat: "Cereales y granos" }, { item: "Frijol molido", qty: "½ taza", cat: "Cereales y granos" }, { item: "Aguacate", qty: "½ pza", cat: "Frutas" }, { item: "Lechuga", qty: "1 taza", cat: "Verduras" }], prep: "Unta frijol, agrega lechuga y aguacate.", tags: ["rapida", "economica"], avoidsTomato: true },
  { id: "e-wrap-pollo", meal: "cena", name: "Wrap de pollo y verduras", protein: "~34 g", ingredients: [{ item: "Tortilla de harina integral", qty: "2 pzas", cat: "Cereales y granos" }, { item: "Pechuga de pollo", qty: "120 g", cat: "Proteínas" }, { item: "Lechuga", qty: "1 taza", cat: "Verduras" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }], prep: "Rellena la tortilla con pollo y verdura, enrolla.", avoidsTomato: true },
  { id: "e-omelette-claras", meal: "cena", name: "Omelette de claras y verduras", protein: "~28 g", ingredients: [{ item: "Clara de huevo", qty: "5 pzas", cat: "Proteínas" }, { item: "Pimiento", qty: "1 taza", cat: "Verduras" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }, { item: "Queso panela", qty: "40 g", cat: "Lácteos" }], prep: "Cuaja las claras con la verdura y el queso.", tags: ["rapida"], avoidsTomato: true },
  { id: "e-ensalada-atun-cena", meal: "cena", name: "Ensalada de atún ligera", protein: "~30 g", ingredients: [{ item: "Atún en agua", qty: "1 lata", cat: "Proteínas" }, { item: "Lechuga", qty: "2 tazas", cat: "Verduras" }, { item: "Pepino", qty: "1 pza", cat: "Verduras" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }, { item: "Limón", qty: "1 pza", cat: "Frutas" }], prep: "Mezcla y aliña con limón.", tags: ["ensalada", "rapida"], avoidsTomato: true },
  { id: "e-sopa-pollo-verduras", meal: "cena", name: "Sopa de pollo y verduras", protein: "~32 g", ingredients: [{ item: "Pechuga de pollo", qty: "120 g", cat: "Proteínas" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }, { item: "Brócoli", qty: "1 taza", cat: "Verduras" }, { item: "Arroz", qty: "¼ taza", cat: "Cereales y granos" }], prep: "Cuece pollo y verdura en caldo; agrega arroz.", avoidsTomato: true },
  { id: "e-molletes-frijol", meal: "cena", name: "Molletes de frijol y panela", protein: "~28 g", ingredients: [{ item: "Pan integral doble cero", qty: "2 reb", cat: "Cereales y granos" }, { item: "Frijol molido", qty: "½ taza", cat: "Cereales y granos" }, { item: "Queso panela", qty: "80 g", cat: "Lácteos" }], prep: "Unta frijol, agrega panela y gratina.", tags: ["rapida"], avoidsTomato: true },
  { id: "e-tacos-pollo-lechuga", meal: "cena", name: "Tacos de pollo en hoja de lechuga", protein: "~32 g", ingredients: [{ item: "Pechuga de pollo", qty: "130 g", cat: "Proteínas" }, { item: "Lechuga", qty: "4 hojas", cat: "Verduras" }, { item: "Zanahoria", qty: "1 pza", cat: "Verduras" }, { item: "Aguacate", qty: "¼ pza", cat: "Frutas" }], prep: "Rellena hojas de lechuga con pollo desmenuzado y verdura. Bajo en carbohidratos.", avoidsTomato: true },
  // --- Colaciones / rápidas ---
  { id: "e-cottage-fruta", meal: "colacion", name: "Cottage con fruta", protein: "~14 g", ingredients: [{ item: "Queso cottage", qty: "½ taza", cat: "Lácteos" }, { item: "Piña", qty: "½ taza", cat: "Frutas" }], prep: "Mezcla y listo.", tags: ["rapida"], avoidsTomato: true },
  { id: "e-huevo-pan", meal: "colacion", name: "Huevo cocido con pan", protein: "~14 g", ingredients: [{ item: "Huevo", qty: "2 pzas", cat: "Proteínas" }, { item: "Pan integral doble cero", qty: "1 reb", cat: "Cereales y granos" }], prep: "Hierve los huevos; acompaña con pan.", tags: ["rapida", "economica"], avoidsTomato: true },
  { id: "e-edamames", meal: "colacion", name: "Jícama con limón y chile", protein: "~2 g", ingredients: [{ item: "Jícama", qty: "1 taza", cat: "Verduras" }, { item: "Limón", qty: "1 pza", cat: "Frutas" }], prep: "Pela y corta la jícama en bastones; exprime limón y un toque de chile.", tags: ["rapida"], avoidsTomato: true },
  { id: "e-galleta-arroz-mani", meal: "colacion", name: "Galletas de arroz con cacahuate", protein: "~9 g", ingredients: [{ item: "Galleta de arroz", qty: "2 pzas", cat: "Cereales y granos" }, { item: "Crema de cacahuate", qty: "1 cda", cat: "Despensa" }, { item: "Plátano", qty: "½ pza", cat: "Frutas" }], prep: "Unta cacahuate y agrega plátano en rodajas.", tags: ["rapida"], avoidsTomato: true },
];
RECIPES.push(...EXTRA);

Object.assign(MACROS, {
  "e-oats-fresa": { kcal: 360, p: 26, c: 48, f: 8 }, "e-oats-manzana": { kcal: 380, p: 25, c: 50, f: 11 },
  "e-smoothie-fresa": { kcal: 290, p: 24, c: 40, f: 4 }, "e-smoothie-cacao": { kcal: 410, p: 28, c: 44, f: 14 },
  "e-smoothie-pina": { kcal: 280, p: 22, c: 42, f: 4 }, "e-omelette-espinaca": { kcal: 360, p: 30, c: 14, f: 20 },
  "e-hotcakes-avena": { kcal: 380, p: 24, c: 48, f: 10 }, "e-yogurt-granola": { kcal: 300, p: 20, c: 40, f: 7 },
  "e-pasta-atun": { kcal: 480, p: 36, c: 55, f: 12 }, "e-pasta-pollo-pesto": { kcal: 560, p: 42, c: 52, f: 18 },
  "e-pollo-camote": { kcal: 520, p: 46, c: 45, f: 14 }, "e-pollo-salteado": { kcal: 540, p: 44, c: 55, f: 14 },
  "e-carne-arroz": { kcal: 560, p: 42, c: 55, f: 18 }, "e-albondigas": { kcal: 500, p: 40, c: 50, f: 16 },
  "e-fajitas-pollo": { kcal: 500, p: 44, c: 45, f: 14 }, "e-ensalada-pollo-garbanzo": { kcal: 460, p: 40, c: 35, f: 16 },
  "e-atun-papa": { kcal: 420, p: 34, c: 50, f: 8 }, "e-bowl-arroz-huevo": { kcal: 480, p: 26, c: 60, f: 14 },
  "e-quesadilla-champinon": { kcal: 430, p: 26, c: 40, f: 18 }, "e-tostadas-frijol-aguacate": { kcal: 400, p: 22, c: 45, f: 16 },
  "e-wrap-pollo": { kcal: 420, p: 34, c: 40, f: 12 }, "e-omelette-claras": { kcal: 300, p: 28, c: 10, f: 14 },
  "e-ensalada-atun-cena": { kcal: 320, p: 30, c: 18, f: 12 }, "e-sopa-pollo-verduras": { kcal: 340, p: 32, c: 28, f: 8 },
  "e-molletes-frijol": { kcal: 420, p: 28, c: 45, f: 14 }, "e-tacos-pollo-lechuga": { kcal: 340, p: 32, c: 14, f: 16 },
  "e-cottage-fruta": { kcal: 160, p: 14, c: 16, f: 4 }, "e-huevo-pan": { kcal: 220, p: 14, c: 18, f: 10 },
  "e-edamames": { kcal: 60, p: 2, c: 14, f: 0 }, "e-galleta-arroz-mani": { kcal: 220, p: 9, c: 28, f: 9 },
});


/* ---------- Info de preparación (tiempo y conservación) para el modal de receta ---------- */
export function recipeInfo(r: Recipe): { time: string; keep: string } {
  const t = r.tags || [];
  let time = "15–25 min";
  if (t.includes("overnight")) time = "5 min (la noche anterior)";
  else if (t.includes("smoothie")) time = "5 min";
  else if (t.includes("rapida")) time = "5–10 min";
  else if (r.meal === "colacion") time = "5 min";
  let keep = "Se conserva 3–4 días en refrigerador, en recipiente hermético.";
  if (t.includes("smoothie")) keep = "Mejor recién hecho; deja la base lista la noche anterior.";
  else if (t.includes("overnight")) keep = "Dura 2–3 días en refrigerador en frasco cerrado.";
  else if (r.meal === "colacion") keep = "Pórtalo en un tóper; consúmelo el mismo día.";
  return { time, keep };
}
