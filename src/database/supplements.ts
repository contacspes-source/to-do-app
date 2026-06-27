/**
 * database/supplements.ts — sugerencias de suplementos basadas en evidencia.
 * Información orientativa; NO es indicación médica ni tratamiento de ninguna
 * condición. Se distingue la evidencia y se marca lo "potencialmente útil en TDAH"
 * sin presentarlo como tratamiento.
 */
export interface SuppSuggestion { name: string; why: string; evidence: "sólida" | "moderada" | "limitada"; tdah?: boolean; }

export const SUPP_SUGGESTIONS: SuppSuggestion[] = [
  { name: "Creatina monohidratada", why: "Fuerza y rendimiento en entrenamiento; evidencia emergente en cognición/fatiga mental.", evidence: "sólida" },
  { name: "Proteína de suero (Whey)", why: "Ayuda a llegar a tu meta de proteína diaria de forma práctica.", evidence: "sólida" },
  { name: "Omega-3 (EPA/DHA)", why: "Salud cardiovascular y cerebral. Algunos estudios sugieren un beneficio pequeño en síntomas de atención; potencialmente útil, evidencia limitada/mixta.", evidence: "limitada", tdah: true },
  { name: "Vitamina D3", why: "Útil si hay déficit (común). Apoya estado de ánimo y salud ósea.", evidence: "moderada" },
  { name: "Magnesio", why: "Puede apoyar el sueño y la relajación, sobre todo si tu ingesta es baja.", evidence: "limitada", tdah: true },
  { name: "Cafeína (con moderación)", why: "Mejora el alerta y el rendimiento puntual; no usar tarde para no afectar el sueño.", evidence: "moderada" },
];
