/**
 * finance/calc.ts — agregados financieros: totales, promedios, proyección y alertas.
 */
import { DB } from "../database/store";
import { cardPay, cardPayType } from "./cards";
import { money } from "../utils/format";

export function sum(a: number[]): number { return a.reduce((s, x) => s + x, 0); }
export function acctById(id: any) { return DB.accounts.find((a) => a.id == id); }
export function totalDebt(): number { return sum(DB.cards.map((c) => c.balance || 0)); }
export function totalDebito(): number { return sum(DB.accounts.map((a) => a.balance || 0)); }

export function monthTx() {
  const now = new Date();
  return DB.tx.filter((t) => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
}
export function applyTx(t: any, sign: number) {
  const amt = (t.amount || 0) * sign;
  if (t.method === "credito") { const c = DB.cards.find((x) => x.id == t.cardId); if (c) c.balance = (c.balance || 0) + (t.type === "gasto" ? amt : -amt); }
  else { const a = acctById(t.acctId); if (a) a.balance = (a.balance || 0) + (t.type === "gasto" ? -amt : amt); }
}

export function nextDateForDay(day: number): Date {
  const n = new Date(); let y = n.getFullYear(), m = n.getMonth();
  if (day < n.getDate()) m += 1; return new Date(y, m, day);
}
export function monthsSpanAll(arr: any[]): number {
  if (!arr.length) return 1; let mn = arr[0].date, mx = arr[0].date;
  arr.forEach((t) => { if (t.date < mn) mn = t.date; if (t.date > mx) mx = t.date; });
  return Math.max(1, (+new Date(mx) - +new Date(mn)) / 2592e6 + 1);
}
export function monthlyIncome(): number {
  const inc: Record<string, { s: number; min: string; max: string }> = {};
  DB.tx.filter((t) => t.type === "ingreso").forEach((t) => {
    const o = inc[t.cat] || (inc[t.cat] = { s: 0, min: t.date, max: t.date });
    o.s += t.amount; if (t.date < o.min) o.min = t.date; if (t.date > o.max) o.max = t.date;
  });
  let tot = 0;
  Object.keys(inc).forEach((k) => { const o = inc[k]; const months = Math.max(1, (+new Date(o.max) - +new Date(o.min)) / 2592e6 + 1); tot += o.s / months; });
  return tot;
}
export function monthlyGasto(): number {
  const g = DB.tx.filter((t) => t.type === "gasto"); if (!g.length) return 0;
  return sum(g.map((t) => t.amount)) / monthsSpanAll(g);
}
export function monthlySubs(): number {
  return sum((DB.subs || []).filter((s) => s.active !== false).map((s) => s.amount || 0));
}

export function computeAlerts(): string[] {
  const A: string[] = [], today = new Date();
  DB.cards.forEach((c) => { if (c.active === false) return; const u = c.limit ? (c.balance || 0) / c.limit : 0; if (u > 0.7) A.push("⚠ " + c.name + " supera 70% de uso (" + Math.round(u * 100) + "%)"); });
  DB.cards.forEach((c) => { if (c.active === false) return; const mn = +(c.min || 0); if (cardPayType(c) === "custom" && mn > 0 && cardPay(c) < mn) A.push("⚠ Pago de " + c.name + " (" + money(cardPay(c)) + ") es menor al mínimo (" + money(mn) + ")"); });
  DB.cards.forEach((c) => { if (c.active === false || !((c.balance || 0) > 0) || !c.pay) return; const d = nextDateForDay(+c.pay), days = Math.round((+d - +today) / 864e5); if (days >= 0 && days <= 3) A.push("⚠ Pago de " + c.name + " " + (days === 0 ? "hoy" : "en " + days + " día" + (days > 1 ? "s" : ""))); });
  (DB.subs || []).forEach((s) => { if (s.active === false || !s.day) return; const d = nextDateForDay(+s.day), days = Math.round((+d - +today) / 864e5); if (days >= 0 && days <= 3) A.push("⚠ Cobro de " + s.name + " " + (days === 0 ? "hoy" : "en " + days + " día" + (days > 1 ? "s" : ""))); });
  const cm = today.getMonth(), cy = today.getFullYear(), curCat: Record<string, number> = {}, prevCat: Record<string, Record<string, number>> = {};
  DB.tx.filter((t) => t.type === "gasto").forEach((t) => {
    const d = new Date(t.date);
    if (d.getMonth() === cm && d.getFullYear() === cy) curCat[t.cat] = (curCat[t.cat] || 0) + t.amount;
    else { const key = d.getFullYear() + "-" + d.getMonth(); prevCat[t.cat] = prevCat[t.cat] || {}; prevCat[t.cat][key] = (prevCat[t.cat][key] || 0) + t.amount; }
  });
  Object.keys(curCat).forEach((cat) => { const hist = prevCat[cat]; if (!hist) return; const ks = Object.keys(hist); if (!ks.length) return; const avg = sum(ks.map((k) => hist[k])) / ks.length; if (avg > 0 && curCat[cat] > avg * 1.3) A.push("⚠ Gastaste más en " + cat + " este mes (" + money(curCat[cat]) + " vs prom. " + money(avg) + ")"); });
  const cash = totalDebito(); let due = 0;
  DB.cards.forEach((c) => { if (c.active !== false && (c.balance || 0) > 0 && c.pay) { const d = nextDateForDay(+c.pay); if ((+d - +today) / 864e5 <= 14) due += c.balance || 0; } });
  (DB.subs || []).forEach((s) => { if (s.active !== false && s.day) { const d = nextDateForDay(+(s.day as number)); if ((+d - +today) / 864e5 <= 14) due += s.amount || 0; } });
  if (due > cash && due > 0) A.push("⚠ Tus pagos de los próximos 14 días (" + money(due) + ") superan tu efectivo (" + money(cash) + ")");
  return A;
}
