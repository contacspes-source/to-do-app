/**
 * academics/grades.ts — cálculo de calificaciones (ponderadas), promedio del
 * semestre y "qué necesito sacar". Reutiliza el estado central (DB).
 */
import { DB } from "../database/store";
import type { Course } from "../types";

export const PASS = 60; // calificación mínima aprobatoria

export function totalWeight(c: Course): number { return c.evals.reduce((s, e) => s + (+e.weight || 0), 0); }
export function gradedWeight(c: Course): number { return c.evals.filter((e) => e.grade != null && e.grade !== ("" as any)).reduce((s, e) => s + (+e.weight || 0), 0); }
/** Puntos acumulados (escala 0-100, asumiendo pesos que suman 100). */
export function earned(c: Course): number { return c.evals.filter((e) => e.grade != null).reduce((s, e) => s + (+(e.grade as number) || 0) * (+e.weight || 0) / 100, 0); }
/** Calificación con lo evaluado hasta ahora (promedio ponderado de lo calificado). */
export function currentGrade(c: Course): number | null { const gw = gradedWeight(c); if (!gw) return null; return +(earned(c) / (gw / 100)).toFixed(1); }
export function remainingWeight(c: Course): number { return Math.max(0, 100 - gradedWeight(c)); }

/** Calificación necesaria en lo que falta para alcanzar 'target' (escala final). */
export function neededFor(c: Course, target: number): { possible: boolean; secured: boolean; need: number } {
  const rem = remainingWeight(c); const e = earned(c);
  if (rem <= 0) return { possible: e >= target, secured: e >= target, need: 0 };
  const need = (target - e) * 100 / rem;
  if (need <= 0) return { possible: true, secured: true, need: 0 };
  return { possible: need <= 100, secured: false, need: +need.toFixed(1) };
}

/** Promedio del semestre: promedio (ponderado por créditos) de la calif. actual de cada materia. */
export function semesterAverage(): number | null {
  const cs = (DB.courses || []).map((c) => ({ g: currentGrade(c), cr: c.credits || 1 })).filter((x) => x.g != null) as { g: number; cr: number }[];
  if (!cs.length) return null;
  const num = cs.reduce((s, x) => s + x.g * x.cr, 0), den = cs.reduce((s, x) => s + x.cr, 0);
  return +(num / den).toFixed(2);
}
