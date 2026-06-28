/**
 * services/decisions.ts — el "motor de decisiones".
 * Convierte el estado en RECOMENDACIONES priorizadas (no solo información):
 *   - Finanzas: evitar intereses, vencimientos y "cuánto puedes gastar hoy".
 *   - Cerrar el día: lo que falta de salud (agua, comidas, suplementos, actividad).
 *   - Tiempo: huecos libres AHORA o más tarde para avanzar tareas/estudio.
 *   - Académico: tareas importantes que sí caben hoy.
 * Es la capa que hace que HOY "decida contigo", no solo te liste pendientes.
 */
import { DB } from "../database/store";
import * as T from "./tracking";
import { nextDateForDay, totalDebito, monthlySubs } from "../finance/calc";
import { remainingThisCycle } from "../finance/cards";
import { money } from "../utils/format";

export interface Decision {
  text: string;
  urgent: boolean;
  icon: string;                 // clave de icono
  kind: string;                 // pay | salud | tiempo | tarea | gasto | ok
  refId?: any;                  // id de tarjeta para acción directa
  goto?: string;                // pantalla a abrir si no hay acción directa
}

function dnext(day: number) { return Math.round((+nextDateForDay(day) - +new Date()) / 864e5); }
function hm(t: string) { const p = (t || "0:0").split(":"); return (+p[0]) * 60 + (+(p[1] || 0)); }
function fmtH(min: number) { const h = Math.floor(min / 60), m = min % 60; return h + ":" + String(m).padStart(2, "0"); }

/** Hueco libre de hoy relevante: el que ocurre AHORA o el próximo del día. */
export function freeBlockToday(): { from: string; to: string; now: boolean } | null {
  const col = (new Date().getDay() + 6) % 7;                 // Lun=0 … Dom=6
  const tt = DB.timetable || []; if (!tt.length) return null;
  const busy = (i: number) => { const c = tt[i].cells[col]; return !!(c && c.text && c.cat !== "libre"); };
  // construir bloques libres ENTRE clases (debe haber clase antes)
  const blocks: { s: number; e: number }[] = []; let runS = -1, seen = false;
  for (let i = 0; i < tt.length; i++) {
    if (busy(i)) { if (runS >= 0) { blocks.push({ s: runS, e: i - 1 }); runS = -1; } seen = true; }
    else if (seen) { if (runS < 0) runS = i; }
  }
  if (!blocks.length) return null;
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const mapped = blocks.filter((b) => tt[b.e + 1]).map((b) => ({ from: hm(tt[b.s].time), to: hm(tt[b.e + 1].time) }));
  const cur = mapped.find((b) => nowMin >= b.from && nowMin < b.to);
  if (cur) return { from: fmtH(nowMin), to: fmtH(cur.to), now: true };
  const next = mapped.filter((b) => b.from > nowMin).sort((a, b) => a.from - b.from)[0];
  if (next) return { from: fmtH(next.from), to: fmtH(next.to), now: false };
  return null;
}

/** Cuánto puedes gastar hoy sin comprometer tus pagos próximos (safe-to-spend). */
export function safeToSpendToday(): { perDay: number; deficit: number } {
  const cash = totalDebito(); const today = new Date();
  let due = 0;
  (DB.cards || []).forEach((c) => { if (c.active !== false && c.pay) { const r = remainingThisCycle(c); if (r > 0) { const d = nextDateForDay(+c.pay); if ((+d - +today) / 864e5 <= 14) due += r; } } });
  (DB.subs || []).forEach((s) => { if (s.active !== false && s.day) { const d = nextDateForDay(+(s.day as number)); if ((+d - +today) / 864e5 <= 14) due += s.amount || 0; } });
  const safe = cash - due;
  if (safe < 0) return { perDay: 0, deficit: -safe };
  const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, dim - today.getDate() + 1);
  return { perDay: safe / daysLeft, deficit: 0 };
}

/** Recomendaciones del día, ya ordenadas (urgentes primero). */
export function decisions(): Decision[] {
  const out: Decision[] = [];
  const day = T.isoDay();

  // 1) Finanzas — evitar intereses / vencimientos próximos
  (DB.cards || []).forEach((c) => {
    if (c.active === false || !c.pay) return;
    const rem = remainingThisCycle(c); if (rem <= 0) return;
    const d = dnext(+c.pay); if (d < 0 || d > 7) return;
    const sinInt = (+(c.planned || 0)) > 0;
    const txt = sinInt
      ? "Paga " + money(rem) + " de " + c.name + (d === 0 ? " hoy" : " en " + d + "d") + " y evitas intereses."
      : "Paga " + c.name + ": restan " + money(rem) + (d === 0 ? ", vence hoy." : ", vence en " + d + "d.");
    out.push({ text: txt, urgent: d <= 2, icon: "dinero", kind: "pay", refId: c.id });
  });

  // 2) Cerrar el día — salud
  const wt = DB.foodProfile?.waterTargetL || 3;
  const miss: string[] = [];
  const agua = DB.waterLog?.[day] || 0;
  if (agua < wt) { const f = +(wt - agua).toFixed(1); miss.push(f + " L de agua"); }
  if (!DB.mealsLog?.[day]) miss.push("registrar comidas");
  const supPend = (DB.supplements || []).filter((s) => s.reminder && !(DB.supplementLog || {})[day + "-" + s.id]);
  if (supPend.length) miss.push(supPend.length === 1 ? "1 suplemento" : supPend.length + " suplementos");
  if (!DB.activityLog?.[day]) miss.push("actividad física");
  if (miss.length === 1) out.push({ text: "Solo te falta " + miss[0] + " para cerrar el día.", urgent: false, icon: "comida", kind: "salud", goto: "hoy" });
  else if (miss.length === 2) out.push({ text: "Para cerrar el día te falta: " + miss.join(" y ") + ".", urgent: false, icon: "comida", kind: "salud", goto: "hoy" });
  else if (miss.length) out.push({ text: "Te faltan " + miss.length + " hábitos para cerrar el día.", urgent: false, icon: "comida", kind: "salud", goto: "hoy" });

  // 3) Tiempo libre (sensible a la hora actual)
  const pend = (DB.tasks || []).filter((t) => !t.done);
  const fb = freeBlockToday();
  if (fb) {
    const t = pend[0];
    const cuando = fb.now ? "Ahora tienes libre hasta " + fb.to : "Más tarde, de " + fb.from + " a " + fb.to + ", tendrás libre";
    out.push({ text: cuando + (t ? ": aprovecha para “" + t.title + "”." : ": ideal para adelantar tareas o estudiar."), urgent: false, icon: "plan", kind: "tiempo", goto: t ? "hoy" : "plan" });
  }

  // 4) Académico — tareas clave que caben hoy
  const feat = pend.filter((t) => t.featured || t.time);
  if (feat.length) {
    const names = feat.slice(0, 3).map((t) => t.title).join(", ");
    out.push({ text: feat.length <= 3 ? "Hoy alcanzas a terminar: " + names + "." : feat.length + " pendientes clave hoy. Empieza por: " + names + ".", urgent: false, icon: "plan", kind: "tarea", goto: "hoy" });
  }

  // 5) Cuánto puedes gastar hoy
  const sts = safeToSpendToday();
  if (sts.deficit > 0) out.push({ text: "Cuidado: tus pagos próximos superan tu efectivo por " + money(sts.deficit) + ".", urgent: true, icon: "dinero", kind: "gasto", goto: "dinero" });
  else if (sts.perDay > 0) out.push({ text: "Hoy puedes gastar ~" + money(sts.perDay) + " sin comprometer tus pagos.", urgent: false, icon: "presupuesto", kind: "gasto", goto: "dinero" });

  if (!out.length) out.push({ text: "Vas al día. Mantén el ritmo: agua, comida y una tarea a la vez.", urgent: false, icon: "constancia", kind: "ok", goto: "hoy" });

  return out.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}

export function topDecisions(n = 3): Decision[] { return decisions().slice(0, n); }
