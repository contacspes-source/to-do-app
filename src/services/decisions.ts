/**
 * services/decisions.ts — el "motor de decisiones".
 * Convierte el estado en RECOMENDACIONES priorizadas (no solo información):
 *   - Finanzas: evitar intereses y vencimientos próximos.
 *   - Cerrar el día: lo que falta de salud (agua, comidas, suplementos, actividad).
 *   - Tiempo: huecos libres entre clases para avanzar tareas/estudio.
 *   - Académico: tareas importantes que sí caben hoy.
 * Es la capa que hace que HOY "decida contigo", no solo te liste pendientes.
 */
import { DB } from "../database/store";
import * as T from "./tracking";
import { nextDateForDay } from "../finance/calc";
import { remainingThisCycle } from "../finance/cards";
import { money } from "../utils/format";

export interface Decision {
  text: string;
  urgent: boolean;
  icon: string;                 // clave de icono
  kind: string;                 // pay | salud | tiempo | tarea | ok
  refId?: any;                  // id de tarjeta para acción directa
  goto?: string;                // pantalla a abrir si no hay acción directa
}

function dnext(day: number) { return Math.round((+nextDateForDay(day) - +new Date()) / 864e5); }

/** Mayor hueco libre ENTRE clases hoy (no cuenta el tiempo posterior a la última). */
export function freeBlockToday(): { from: string; to: string } | null {
  const col = (new Date().getDay() + 6) % 7;                 // Lun=0 … Dom=6
  const tt = DB.timetable || []; if (!tt.length) return null;
  const busy = (i: number) => { const c = tt[i].cells[col]; return !!(c && c.text && c.cat !== "libre"); };
  let best: { s: number; e: number } | null = null, runS = -1, seen = false;
  for (let i = 0; i < tt.length; i++) {
    if (busy(i)) { if (runS >= 0) { const r = { s: runS, e: i - 1 }; if (!best || (r.e - r.s) > (best.e - best.s)) best = r; runS = -1; } seen = true; }
    else if (seen) { if (runS < 0) runS = i; }
  }
  if (!best || !tt[best.e + 1]) return null;
  return { from: tt[best.s].time, to: tt[best.e + 1].time };
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

  // 3) Tiempo libre entre clases
  const pend = (DB.tasks || []).filter((t) => !t.done);
  const fb = freeBlockToday();
  if (fb) {
    const t = pend[0];
    out.push({ text: "Tienes libre de " + fb.from + " a " + fb.to + (t ? ": ideal para avanzar “" + t.title + "”." : ": ideal para adelantar tareas o estudiar."), urgent: false, icon: "plan", kind: "tiempo", goto: t ? "hoy" : "plan" });
  }

  // 4) Académico — tareas clave que caben hoy
  const feat = pend.filter((t) => t.featured || t.time);
  if (feat.length) {
    const names = feat.slice(0, 3).map((t) => t.title).join(", ");
    out.push({ text: feat.length <= 3 ? "Hoy alcanzas a terminar: " + names + "." : feat.length + " pendientes clave hoy. Empieza por: " + names + ".", urgent: false, icon: "plan", kind: "tarea", goto: "hoy" });
  }

  if (!out.length) out.push({ text: "Vas al día. Mantén el ritmo: agua, comida y una tarea a la vez.", urgent: false, icon: "constancia", kind: "ok", goto: "hoy" });

  return out.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}

export function topDecisions(n = 3): Decision[] { return decisions().slice(0, n); }
