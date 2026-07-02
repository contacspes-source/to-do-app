/**
 * utils/format.ts — formato de dinero, texto y fechas.
 */
import { DB } from "../database/store";
import { CURRENCIES } from "../config/app";

export function money(n: number): string {
  const c = CURRENCIES[(DB && DB.cur) || "MXN"] || CURRENCIES.MXN;
  const r = Math.round((n || 0) * 100) / 100;
  const dec = Number.isInteger(r) ? 0 : 2;
  return c.s + r.toLocaleString(c.l, { minimumFractionDigits: dec, maximumFractionDigits: 2 });
}
export function esc(s: any): string {
  return String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as Record<string, string>)[ch]);
}
export function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
export function localYMD(d: Date): string { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), da = String(d.getDate()).padStart(2, "0"); return y + "-" + m + "-" + da; }
export function dk(d: Date): string { return localYMD(d); }
export function greeting(): string { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; }

/** Ícono de check reutilizable. */
export const CHK = '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 5"/></svg>';
