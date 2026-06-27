/**
 * pages/hoy.ts — HOY: centro de mando del Sistema Operativo Personal.
 * Una sola pantalla que reúne lo importante del día (finanzas, comida,
 * suplementos, salud, hábitos, universidad), con prioridad automática,
 * Momentum y tarjetas resumen. Lo demás vive como módulos secundarios.
 */
import { DB, save, dk } from "../database/store";
import { $, qsa } from "../utils/dom";
import { esc, cap, greeting, CHK } from "../utils/format";
import type { Task } from "../types";
import { openDetail } from "./tarea-detalle";
import { go } from "../router";
import { buildToday, momentum, financeToday, type TodayItem } from "../services/today";
import { money } from "../utils/format";
import * as T from "../services/tracking";
import { recipesForDay } from "../services/mealplan";

let hoyMode = "hoy";

export function addSect(p: HTMLElement, txt: string) {
  const s = document.createElement("div"); s.className = "sect"; s.textContent = txt; p.appendChild(s);
}

/* ---------- anillo de Momentum (SVG) ---------- */
function momentumRing(pct: number): string {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return '<svg viewBox="0 0 120 120" width="120" height="120" style="display:block">' +
    '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--hair)" stroke-width="9"/>' +
    '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
    '<text x="60" y="58" text-anchor="middle" font-size="26" font-weight="700" fill="var(--ink-1)" font-family="ui-monospace,monospace">' + pct + '%</text>' +
    '<text x="60" y="76" text-anchor="middle" font-size="10" fill="var(--ink-3)">Momentum</text>' +
    '</svg>';
}

const GROUP_LABEL: Record<string, string> = { urgente: "Urgente", salud: "Salud", plan: "Plan", tareas: "Universidad" };

export function renderHoy() {
  $("hello").innerHTML = hoyMode === "todos" ? '<span style="font-size:24px">Pendientes</span>' : greeting() + ", <em>" + esc(DB.name || "Jorge") + "</em>";
  $("date").textContent = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const top = $("hoyTop"); top.innerHTML = "";
  const list = $("todayList"); list.innerHTML = "";

  if (hoyMode === "todos") { renderTodos(top, list); return; }

  // ----- Centro de mando -----
  const items = buildToday(); const m = momentum();
  const pend = items.filter((i) => !i.done);
  top.innerHTML = '<div class="momentum"><div class="mo-ring">' + momentumRing(m.pct) + '</div><div class="mo-txt"><div class="mo-h">' + (m.pct >= 80 ? "Tu día va muy bien" : m.pct >= 40 ? "Buen avance" : "Empieza por lo de arriba") + '</div><div class="note" style="margin:4px 0 0">' + m.done + ' de ' + m.total + ' completados hoy.</div></div></div>';

  // lista priorizada
  addSect(list, pend.length ? "Haz esto primero" : "Todo listo por hoy");
  if (!pend.length) list.innerHTML += '<div class="note">No queda nada pendiente. Disfruta tu día.</div>';
  items.forEach((it, idx) => list.appendChild(todayRow(it, idx)));

  // tarjetas resumen
  renderSummary(list);
}

function todayRow(it: TodayItem, idx: number): HTMLElement {
  const el = document.createElement("div");
  el.className = "task" + (it.done ? " done" : "");
  const tag = '<span class="badge ' + (it.group === "urgente" ? "alta" : it.group === "salud" ? "media" : "baja") + '">' + GROUP_LABEL[it.group] + '</span>';
  el.innerHTML = '<button class="check" aria-label="Completar">' + CHK + '</button><div class="body"><span class="ttl">' + esc(it.label) + '</span><div class="meta">' + tag + (it.meta ? '<span class="time">' + esc(it.meta) + '</span>' : '') + (it.goto && !it.done ? '<span class="fpill">abrir →</span>' : '') + '</div></div>';
  const act = () => { if (it.toggle) { it.toggle(); renderHoy(); } else if (it.goto) { go(it.goto.screen); } };
  el.querySelector(".check")!.addEventListener("click", (e) => { e.stopPropagation(); act(); });
  el.onclick = act;
  void idx;
  return el;
}

function renderSummary(list: HTMLElement) {
  const fin = financeToday(); const st = T.streaks(); const peso = T.latestWeight();
  const di = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const comida = recipesForDay(di).find((x) => x.slot === "comida")?.recipe;

  addSect(list, "Resumen");
  const grid = document.createElement("div"); grid.className = "today-cards";
  // Finanzas
  grid.innerHTML += '<button class="tcard" data-go2="dinero"><div class="tc-h">Finanzas</div><div class="tc-big">' + money(fin.cash) + '</div><div class="tc-sub">disponible</div>' + (fin.next ? '<div class="tc-line">Próximo: ' + esc((fin.next as any).name) + ' · ' + ((fin.next as any).days <= 0 ? "hoy" : (fin.next as any).days + "d") + '</div>' : '<div class="tc-line">Sin pagos próximos</div>') + '</button>';
  // MealPrep
  grid.innerHTML += '<button class="tcard" data-go2="comida"><div class="tc-h">Comida de hoy</div><div class="tc-big2">' + (comida ? esc(comida.name) : "—") + '</div><div class="tc-line">' + (comida ? "Toca para ver la receta" : "Genera tu plan") + '</div></button>';
  // Progreso
  grid.innerHTML += '<button class="tcard" data-go2="comida"><div class="tc-h">Progreso</div><div class="tc-big">' + st.plan + ' días</div><div class="tc-sub">racha de plan</div><div class="tc-line">Peso: ' + peso + ' kg</div></button>';
  list.appendChild(grid);
  qsa<HTMLElement>("[data-go2]", grid).forEach((b) => (b.onclick = () => go(b.dataset.go2!)));
}

/* ---------- vista "Todos los pendientes" (lista completa de tareas) ---------- */
function taskEl(t: Task): HTMLElement {
  const el = document.createElement("div");
  el.className = "task" + (t.done ? " done" : "");
  el.innerHTML = '<button class="check" aria-label="Completar">' + CHK + '</button><div class="body"><span class="ttl">' + esc(t.title) + '</span><div class="meta">' + (t.prio ? '<span class="badge ' + t.prio + '">' + cap(t.prio) + '</span>' : '') + (t.time ? '<span class="time">' + t.time + '</span>' : '') + '<span class="fpill">' + t.list + '</span></div></div>';
  el.querySelector(".check")!.addEventListener("click", (e) => { e.stopPropagation(); t.done = !t.done; if (t.done) DB.history[dk(new Date())] = true; save(); renderHoy(); });
  el.onclick = () => openDetail(t.id);
  return el;
}
function renderTodos(top: HTMLElement, list: HTMLElement) {
  const ts = DB.tasks;
  ["Personal", "Trabajo", "Casa"].forEach((name) => {
    const g = ts.filter((t) => t.list === name); if (!g.length) return;
    const gd = g.filter((t) => t.done).length;
    addSect(list, name + " · " + gd + "/" + g.length);
    g.sort((a, b) => +a.done - +b.done);
    g.forEach((t) => list.appendChild(taskEl(t)));
  });
  if (!ts.length) list.innerHTML = '<div class="empty"><div class="big">Todo despejado</div>Agrega una tarea con +</div>';
  void top;
}

export function initHoy() {
  qsa<HTMLElement>("#hoyseg button").forEach((b) => { b.onclick = () => { qsa("#hoyseg button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); hoyMode = b.dataset.v!; renderHoy(); }; });
}
export function setHoyMode(m: string) { hoyMode = m; }
