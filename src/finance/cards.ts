/**
 * finance/cards.ts — lógica de tarjetas de crédito: fondo, tipo de pago,
 * simulador de amortización y paletas de personalización.
 */
import type { Card } from "../types";
import { DB } from "../database/store";

export const CARDCOLORS = ["#2563eb", "#7c3aed", "#db2777", "#16a34a", "#ea580c", "#0891b2", "#4b5563", "#111111"];
export const CARDGRADS = [
  "linear-gradient(135deg,#2563eb,#7c3aed)", "linear-gradient(135deg,#db2777,#f59e0b)",
  "linear-gradient(135deg,#059669,#0ea5e9)", "linear-gradient(135deg,#111827,#374151)",
  "linear-gradient(135deg,#f43f5e,#7c3aed)", "linear-gradient(135deg,#0891b2,#155e75)",
];
export const CARDTPL = [
  { n: "Aqua", bg: "linear-gradient(135deg,#0ea5e9,#2563eb)" },
  { n: "Violeta", bg: "linear-gradient(135deg,#7c3aed,#db2777)" },
  { n: "Bosque", bg: "linear-gradient(135deg,#059669,#065f46)" },
  { n: "Atardecer", bg: "linear-gradient(135deg,#f59e0b,#db2777)" },
  { n: "Noche", bg: "linear-gradient(135deg,#1f2937,#111827)" },
  { n: "Acero", bg: "linear-gradient(135deg,#64748b,#334155)" },
];

export function cardBg(c: Card): string {
  const m = c.bg || "color";
  if (m === "image" && c.img) return "#222 url(" + c.img + ") center/cover";
  if (m === "gradient" && c.grad) return c.grad;
  if (m === "template" && CARDTPL[c.tpl || 0]) return CARDTPL[c.tpl || 0].bg;
  return c.color || "#4b5563";
}

/** Pago considerado para el periodo: mínimo o personalizado según elección. */
export function cardPayType(c: Card): "min" | "custom" {
  return c.payType === "custom" ? "custom" : (c.payType === "min" ? "min" : ((+(c.planned || 0)) > 0 ? "custom" : "min"));
}
export function cardPay(c: Card): number {
  return cardPayType(c) === "custom" ? +(c.planned || 0) : +(c.min || 0);
}

export function cardById(id: any): Card | undefined { return DB.cards.find((c) => c.id == id); }

export interface SimResult { m: number; interes: number; total: number; ok: boolean; }
export function paySim(bal: number, apr: number, pay: number): SimResult {
  bal = +bal || 0; pay = +pay || 0;
  const r = (+apr || 0) / 100 / 12;
  if (bal <= 0) return { m: 0, interes: 0, total: 0, ok: true };
  if (pay <= 0 || (r > 0 && pay <= bal * r)) return { m: Infinity, interes: Infinity, total: Infinity, ok: false };
  let b = bal, paid = 0, m = 0;
  while (b > 0.005 && m < 1200) { b += b * r; const p = Math.min(pay, b); b -= p; paid += p; m++; }
  return { m, interes: paid - bal, total: paid, ok: true };
}


/** Inicio del ciclo actual de la tarjeta según su día de corte. */
export function cycleStart(cut: number): Date {
  const now = new Date(); let m = now.getMonth(), y = now.getFullYear();
  if (now.getDate() < cut) { m -= 1; if (m < 0) { m = 11; y -= 1; } }
  return new Date(y, m, cut);
}
/** ¿Ya registraste un pago en el ciclo vigente? */
export function paidThisCycle(c: Card): boolean {
  if (!c.lastPayDate) return false;
  const start = c.cut ? cycleStart(+c.cut) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return new Date(c.lastPayDate) >= start;
}
