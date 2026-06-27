/**
 * services/today.ts — el "cerebro" del Sistema Operativo Personal.
 * Reúne en un solo lugar lo relevante de HOY desde todos los módulos
 * (finanzas, alimentación, suplementos, hábitos, salud, universidad/tareas),
 * calcula la PRIORIDAD automática y el MOMENTUM del día.
 * No duplica datos: lee y actúa sobre el estado existente.
 */
import { DB, save } from "../database/store";
import * as T from "../services/tracking";
import { totalDebito, nextDateForDay } from "../finance/calc";
import { remainingThisCycle } from "../finance/cards";
import { money } from "../utils/format";

export interface TodayItem {
  id: string;
  label: string;
  meta?: string;
  group: "urgente" | "salud" | "plan" | "tareas";
  done: boolean;
  prio: number;                 // menor = más prioritario
  track: boolean;               // cuenta para el Momentum
  toggle?: () => void;          // acción instantánea
  goto?: { screen: string };    // o navegar al módulo
}

function dnext(day: number) { return Math.round((+nextDateForDay(day) - +new Date()) / 864e5); }

/** Lista unificada de HOY, ya ordenada por prioridad. */
export function buildToday(): TodayItem[] {
  const items: TodayItem[] = [];
  const day = T.isoDay();
  const wt = DB.foodProfile?.waterTargetL || 3;

  // 1) Finanzas: pagos próximos (urgente, no cuenta para momentum)
  (DB.cards || []).forEach((c) => {
    if (c.active === false || !c.pay) return;
    const rem = remainingThisCycle(c); if (rem <= 0) return;
    const d = dnext(+c.pay);
    if (d >= 0 && d <= 5) items.push({ id: "pay-" + c.id, label: "Pagar " + c.name, meta: "restan " + money(rem) + " · " + (d === 0 ? "vence hoy" : "vence en " + d + "d"), group: "urgente", done: false, prio: d, track: false, goto: { screen: "dinero" } });
  });

  // 2) Salud (cuentan para momentum)
  const taken = (k: number) => (DB.supplementLog || {})[day + "-" + k];
  items.push({ id: "agua", label: "Tomar " + wt + " L de agua", group: "salud", done: (DB.waterLog?.[day] || 0) >= wt, prio: 10, track: true, toggle: () => T.logWater(wt) });
  items.push({ id: "peso", label: "Registrar tu peso", group: "salud", done: !!T.todayWeight(), prio: 11, track: true, goto: { screen: "comida" } });
  items.push({ id: "comidas", label: "Registrar tus comidas", group: "salud", done: !!DB.mealsLog?.[day], prio: 13, track: true, toggle: () => T.setMealsLogged(!DB.mealsLog?.[day]) });
  (DB.supplements || []).forEach((s) => { if (s.reminder) items.push({ id: "sup-" + s.id, label: "Tomar " + s.name, meta: s.dose, group: "salud", done: !!taken(s.id), prio: 12, track: true, toggle: () => toggleSupp(s.id) }); });

  // 3) Plan / hábito del día
  items.push({ id: "plan", label: "Seguir el plan de hoy", group: "plan", done: !!DB.planLog?.[day], prio: 20, track: true, toggle: () => T.setPlanFollowed(!DB.planLog?.[day]) });

  // 4) Universidad / tareas de hoy (cuentan para momentum)
  (DB.tasks || []).forEach((t) => {
    if (t.done) { items.push({ id: "task-" + t.id, label: t.title, meta: t.time || "", group: "tareas", done: true, prio: 30, track: true, toggle: () => toggleTask(t.id) }); return; }
    const isToday = t.featured || t.time;
    items.push({ id: "task-" + t.id, label: t.title, meta: t.time || (t.featured ? "importante" : ""), group: "tareas", done: false, prio: t.featured ? 25 : 31, track: true, toggle: () => toggleTask(t.id) });
    void isToday;
  });

  // orden por prioridad: pendientes primero, luego por prio
  return items.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || a.prio - b.prio);
}

function toggleSupp(id: number) {
  const day = T.isoDay(), k = day + "-" + id; DB.supplementLog = DB.supplementLog || {};
  const sp = (DB.supplements || []).find((x) => x.id === id);
  if (!DB.supplementLog[k]) { DB.supplementLog[k] = true; if (sp && (sp.stock || 0) > 0) sp.stock = (sp.stock || 0) - 1; }
  else { delete DB.supplementLog[k]; if (sp) sp.stock = (sp.stock || 0) + 1; }
  save();
}
function toggleTask(id: number) {
  const t = (DB.tasks || []).find((x) => x.id === id); if (!t) return;
  t.done = !t.done; if (t.done) DB.history[T.isoDay()] = true; save();
}

/** Momentum del día: % de lo "trackeable" ya completado. */
export function momentum(): { pct: number; done: number; total: number } {
  const tr = buildToday().filter((i) => i.track);
  const done = tr.filter((i) => i.done).length;
  const total = tr.length || 1;
  return { pct: Math.round((done / total) * 100), done, total };
}

/** Resumen financiero para la tarjeta de HOY. */
export function financeToday() {
  const cash = totalDebito();
  let next: { name: string; days: number; amt: number } | null = null;
  (DB.cards || []).forEach((c) => { if (c.active !== false && (c.balance || 0) > 0 && c.pay) { const d = dnext(+c.pay); if (!next || d < next.days) next = { name: c.name, days: d, amt: c.balance || 0 }; } });
  return { cash, next };
}
