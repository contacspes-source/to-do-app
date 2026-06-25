/**
 * config/app.ts — constantes globales de la aplicación.
 */
export const STORAGE_KEY = "misem_v2"; // misma clave: conserva tus datos existentes
export const SEM_START = new Date(2026, 7, 17); // 17-ago-2026 (semestre 2026-B)

export const CURRENCIES: Record<string, { s: string; l: string }> = {
  MXN: { s: "$", l: "es-MX" },
  USD: { s: "US$", l: "en-US" },
  EUR: { s: "€", l: "es-ES" },
};

/** Categorías de movimientos. 'Supermercado' habilita la integración con MealPrep. */
export const CATEGORIES = {
  gasto: ["Comida", "Supermercado", "Gasolina", "Escuela", "Transporte", "Entretenimiento", "Salud", "Suscripciones", "Compras", "Hogar", "Otros"],
  ingreso: ["Sueldo", "Negocio", "Freelance", "Venta", "Comisión", "Beca", "Reembolso", "Otro"],
};
