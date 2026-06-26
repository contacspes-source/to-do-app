/**
 * services/tracking.ts — seguimiento físico de MealPrep:
 * peso, mediciones, fotos, hidratación, cumplimiento del plan y rachas.
 * Reutiliza el estado central (DB) y el patrón de racha de Constancia.
 */
import { DB, save } from "../database/store";
import type { WeightEntry, Measurement } from "../types";

export function isoDay(d = new Date()): string { return d.toISOString().slice(0, 10); }

/* ---------- registros ---------- */
export function logWeight(kg: number) {
  const day = isoDay();
  DB.weightLog = (DB.weightLog || []).filter((w) => w.date !== day);
  DB.weightLog.push({ date: day, kg });
  DB.weightLog.sort((a, b) => a.date.localeCompare(b.date));
  save();
}
export function todayWeight(): WeightEntry | undefined { return (DB.weightLog || []).find((w) => w.date === isoDay()); }
export function latestWeight(): number { const l = DB.weightLog || []; return l.length ? l[l.length - 1].kg : (DB.foodProfile?.weight || 0); }
export function logWater(liters: number) { DB.waterLog = DB.waterLog || {}; DB.waterLog[isoDay()] = liters; save(); }
export function setPlanFollowed(on: boolean) { DB.planLog = DB.planLog || {}; DB.planLog[isoDay()] = on; save(); }
export function setMealsLogged(on: boolean) { DB.mealsLog = DB.mealsLog || {}; DB.mealsLog[isoDay()] = on; save(); }
export function addMeasurement(m: Measurement) { DB.measurements = DB.measurements || []; DB.measurements.push(m); DB.measurements.sort((a, b) => a.date.localeCompare(b.date)); save(); }
export function addPhoto(img: string) { DB.bodyPhotos = DB.bodyPhotos || []; DB.bodyPhotos.push({ date: isoDay(), img }); save(); }
export function removePhoto(i: number) { (DB.bodyPhotos || []).splice(i, 1); save(); }

/* ---------- métricas ---------- */
export function imc(weight = latestWeight(), height = DB.foodProfile?.height || 178): number {
  return +(weight / Math.pow(height / 100, 2)).toFixed(1);
}

/** Racha de días consecutivos (termina hoy o ayer) que cumplen el predicado. */
function streakOf(pred: (day: string) => boolean): number {
  let n = 0; const d = new Date();
  if (!pred(isoDay(d))) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) { if (pred(isoDay(d))) { n++; d.setDate(d.getDate() - 1); } else break; }
  return n;
}
export function streaks() {
  const W = DB.weightLog || [], wa = DB.waterLog || {}, pl = DB.planLog || {}, ml = DB.mealsLog || {};
  const target = DB.foodProfile?.waterTargetL || 3;
  return {
    plan: streakOf((d) => pl[d] === true),
    comidas: streakOf((d) => ml[d] === true),
    peso: streakOf((d) => W.some((w) => w.date === d)),
    agua: streakOf((d) => (wa[d] || 0) >= target),
  };
}

export function progressToGoal() {
  const L = DB.weightLog || [];
  const start = L.length ? L[0].kg : (DB.foodProfile?.weight || 0);
  const current = latestWeight();
  const target = DB.foodProfile?.targetWeight || current;
  const totalGap = Math.abs(target - start) || 1;
  const doneGap = Math.abs(current - start);
  const pct = Math.max(0, Math.min(100, Math.round((doneGap / totalGap) * 100)));
  return { start, current, target, pct };
}

/** % de los últimos N días con el predicado cumplido. */
function complianceOf(pred: (day: string) => boolean, days = 30): number {
  let ok = 0; const d = new Date();
  for (let i = 0; i < days; i++) { if (pred(isoDay(d))) ok++; d.setDate(d.getDate() - 1); }
  return Math.round((ok / days) * 100);
}
export function planCompliance(days = 30) { const pl = DB.planLog || {}; return complianceOf((d) => pl[d] === true, days); }
function countOf(pred: (d: string) => boolean, days = 30): number { let n = 0; const d = new Date(); for (let i = 0; i < days; i++) { if (pred(isoDay(d))) n++; d.setDate(d.getDate() - 1); } return n; }
export function metrics(days = 30) {
  const W = DB.weightLog || [], wa = DB.waterLog || {}, pl = DB.planLog || {}, ml = DB.mealsLog || {}, t = DB.foodProfile?.waterTargetL || 3;
  return {
    days,
    comidas: countOf((d) => ml[d] === true, days),
    plan: countOf((d) => pl[d] === true, days),
    peso: countOf((d) => W.some((w) => w.date === d), days),
    agua: countOf((d) => (wa[d] || 0) >= t, days),
  };
}
export function pendingToday(): string[] {
  const d = isoDay(), wa = DB.waterLog || {}, pl = DB.planLog || {}, ml = DB.mealsLog || {}, t = DB.foodProfile?.waterTargetL || 3;
  const out: string[] = [];
  if (!ml[d]) out.push("Registrar tus comidas");
  if (!pl[d]) out.push("Marcar que seguiste el plan");
  if (!todayWeight()) out.push("Registrar tu peso");
  if ((wa[d] || 0) < t) out.push("Cumplir tu hidratación (" + t + " L)");
  return out;
}
export function waterCompliance(days = 30) { const wa = DB.waterLog || {}, t = DB.foodProfile?.waterTargetL || 3; return complianceOf((d) => (wa[d] || 0) >= t, days); }

/** Serie de peso agrupada por semana o por mes (promedio). */
export function weightSeries(group: "week" | "month" = "week"): { label: string; value: number }[] {
  const L = DB.weightLog || []; if (!L.length) return [];
  const buckets: Record<string, { sum: number; n: number }> = {};
  L.forEach((w) => {
    const d = new Date(w.date);
    let key: string;
    if (group === "month") key = w.date.slice(0, 7);
    else { const onejan = new Date(d.getFullYear(), 0, 1); const wk = Math.ceil((((+d - +onejan) / 864e5) + onejan.getDay() + 1) / 7); key = d.getFullYear() + "-S" + String(wk).padStart(2, "0"); }
    const b = buckets[key] || (buckets[key] = { sum: 0, n: 0 }); b.sum += w.kg; b.n++;
  });
  return Object.keys(buckets).sort().map((k) => ({ label: k, value: +(buckets[k].sum / buckets[k].n).toFixed(1) }));
}
