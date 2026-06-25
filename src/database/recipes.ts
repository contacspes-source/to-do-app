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
  { id: "d-smoothie-verde", meal: "desayuno", name: "Smoothie verde proteico", protein: "~25 g",
    ingredients: [
      { item: "Plátano", qty: "1 pza", cat: "Frutas" },
      { item: "Espinaca", qty: "1 puño", cat: "Verduras" },
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
