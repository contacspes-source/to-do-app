/**
 * pages/constancia.ts — Constancia automática (se llena sola con tus acciones).
 */
import { $ } from "../utils/dom";
import { CHK } from "../utils/format";
import { progressBar } from "../components/charts";
import * as C from "../services/constancia";

export function renderHabitos() {
  const w = $("habitosBody"); if (!w) return;
  const st = C.streak(); const sem = C.avgPct(7), mes = C.avgPct(30); const comp = C.completedDays(30);
  const dots = C.weekDots(); const today = C.todayHabits(); const c7 = C.habitCompliance(7);

  let h = '<div class="block"><div class="streak-hero" style="padding:4px 0"><div class="streak-num">' + st + '</div><div class="streak-sub">días seguidos</div></div>';
  h += '<div class="week">' + dots.map((x) => '<div class="wd"><div class="dot' + (x.complete ? " on" : "") + '">' + (x.complete ? "✓" : (x.pct > 0 ? x.pct : "")) + '</div><div class="dl">' + x.label + '</div></div>').join("") + '</div></div>';

  h += '<div class="block"><div class="block-h">Cumplimiento</div>';
  h += '<div class="arow" style="margin:0"><div class="top"><span>Esta semana</span><span class="v">' + sem + '%</span></div>' + progressBar(sem) + '</div>';
  h += '<div class="arow"><div class="top"><span>Este mes</span><span class="v">' + mes + '%</span></div>' + progressBar(mes) + '</div>';
  h += '<div class="note">Días completados este mes: <b>' + comp + '</b> / 30.</div></div>';

  h += '<div class="block"><div class="block-h">Hoy</div>';
  today.forEach((t) => { h += '<div class="task' + (t.done ? " done" : "") + '"><button class="check" style="cursor:default">' + CHK + '</button><div class="body"><span class="ttl">' + t.label + '</span></div></div>'; });
  h += '<div class="note">Se marca solo cuando completas la acción (desde HOY o su módulo).</div></div>';

  const bien = c7.filter((x) => x.pct >= 70), mal = c7.filter((x) => x.pct < 40);
  if (bien.length) { h += '<div class="block"><div class="block-h">Vas bien</div>'; bien.forEach((x) => (h += '<div class="lrow"><span>' + x.label + '</span><span class="money">' + x.pct + '%</span></div>')); h += '</div>'; }
  if (mal.length) { h += '<div class="block"><div class="block-h">A mejorar</div>'; mal.forEach((x) => (h += '<div class="lrow"><span>' + x.label + '</span><span class="money" style="color:var(--warn)">' + x.pct + '%</span></div>')); h += '</div>'; }

  w.innerHTML = h;
}

export function initConstancia() { /* automática: no requiere wiring */ }
