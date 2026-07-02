/**
 * services/constancia.ts — constancia AUTOMÁTICA.
 * Se calcula sola a partir de tus acciones diarias (agua, peso, comidas, plan,
 * suplementos, actividad, tareas). No hay que registrar nada extra.
 */
import { DB } from "../database/store";
import { isoDay } from "./tracking";

export interface Habit { key: string; label: string; done: (d: Date) => boolean; }

export function habits(): Habit[] {
  const wt = DB.foodProfile?.waterTargetL || 3;
  const list: Habit[] = [
    { key: "agua", label: "Hidratación", done: (d) => (DB.waterLog?.[isoDay(d)] || 0) >= wt },
    { key: "peso", label: "Registrar peso", done: (d) => (DB.weightLog || []).some((w) => w.date === isoDay(d)) },
    { key: "comidas", label: "Comidas", done: (d) => !!DB.mealsLog?.[isoDay(d)] },
    { key: "plan", label: "Seguir el plan", done: (d) => !!DB.planLog?.[isoDay(d)] },
    { key: "actividad", label: "Actividad física", done: (d) => !!DB.activityLog?.[isoDay(d)] },
    { key: "tareas", label: "Tareas", done: (d) => !!DB.history?.[isoDay(d)] },
  ];
  const supps = (DB.supplements || []).filter((s) => s.reminder);
  if (supps.length) list.push({ key: "suplementos", label: "Suplementos", done: (d) => supps.every((s) => !!(DB.supplementLog || {})[isoDay(d) + "-" + s.id]) });
  return list;
}

export function dayPct(d: Date) { const h = habits(); const done = h.filter((x) => x.done(d)).length; return { done, total: h.length, pct: Math.round((done / h.length) * 100) }; }
export function dayComplete(d: Date) { return dayPct(d).pct >= 60; }

export function streak(): number {
  let n = 0; const d = new Date();
  if (!dayComplete(d)) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) { if (dayComplete(d)) { n++; d.setDate(d.getDate() - 1); } else break; }
  return n;
}
export function avgPct(days: number): number { let s = 0; const d = new Date(); for (let i = 0; i < days; i++) { s += dayPct(d).pct; d.setDate(d.getDate() - 1); } return Math.round(s / days); }
export function completedDays(days: number): number { let n = 0; const d = new Date(); for (let i = 0; i < days; i++) { if (dayComplete(d)) n++; d.setDate(d.getDate() - 1); } return n; }
export function habitCompliance(days: number): { label: string; pct: number }[] {
  return habits().map((x) => { let ok = 0; const d = new Date(); for (let i = 0; i < days; i++) { if (x.done(d)) ok++; d.setDate(d.getDate() - 1); } return { label: x.label, pct: Math.round((ok / days) * 100) }; });
}
export function todayHabits(): { label: string; done: boolean }[] { const d = new Date(); return habits().map((x) => ({ label: x.label, done: x.done(d) })); }
/** Últimos 7 días: completado o no (para los puntos de la semana). */
export function weekDots(): { label: string; pct: number; complete: boolean }[] {
  const DAYL = ["D", "L", "M", "M", "J", "V", "S"]; const out: { label: string; pct: number; complete: boolean }[] = [];
  const d = new Date(); d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) { const p = dayPct(d); out.push({ label: DAYL[d.getDay()], pct: p.pct, complete: dayComplete(d) }); d.setDate(d.getDate() + 1); }
  return out;
}
