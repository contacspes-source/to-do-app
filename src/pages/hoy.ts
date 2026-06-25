/**
 * pages/hoy.ts — pantalla "Hoy" (pendientes del día y todas las listas).
 */
import { DB, save, dk } from "../database/store";
import { $, qsa } from "../utils/dom";
import { esc, cap, greeting, CHK } from "../utils/format";
import type { Task } from "../types";
import { openDetail } from "./tarea-detalle";
import { useSegment } from "../hooks/useSegment";

let hoyMode = "hoy";

export function addSect(p: HTMLElement, txt: string) {
  const s = document.createElement("div"); s.className = "sect"; s.textContent = txt; p.appendChild(s);
}

function taskEl(t: Task): HTMLElement {
  const el = document.createElement("div");
  el.className = "task" + (t.done ? " done" : "") + (t.featured && hoyMode === "hoy" ? " featured" : "");
  el.innerHTML = '<button class="check" aria-label="Completar">' + CHK + '</button><div class="body"><span class="ttl">' + esc(t.title) + '</span><div class="meta">' + (t.prio ? '<span class="badge ' + t.prio + '">' + cap(t.prio) + '</span>' : '') + (t.time ? '<span class="time">' + t.time + '</span>' : '') + '<span class="fpill">' + t.list + '</span></div></div>';
  el.querySelector(".check")!.addEventListener("click", (e) => { e.stopPropagation(); toggleDone(t); });
  el.onclick = () => openDetail(t.id);
  return el;
}
function toggleDone(t: Task) {
  t.done = !t.done;
  if (t.done) DB.history[dk(new Date())] = true;
  save(); setTimeout(() => renderHoy(), t.done ? 260 : 0);
}

export function renderHoy() {
  $("hello").innerHTML = hoyMode === "todos" ? '<span style="font-size:24px">Pendientes</span>' : greeting() + ", <em>" + esc(DB.name || "Jorge") + "</em>";
  $("date").textContent = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const top = $("hoyTop"); top.innerHTML = "";
  const list = $("todayList"); list.innerHTML = "";
  const ts = DB.tasks, total = ts.length, done = ts.filter((t) => t.done).length;
  if (hoyMode === "hoy") {
    const pend = total - done, pct = total ? Math.round(done / total * 100) : 0;
    top.innerHTML = '<div class="lede">' + (pend === 0 ? "Nada pendiente — disfruta tu día." : "Tienes " + pend + (pend === 1 ? " cosa" : " cosas") + " para hoy.") + '</div><div class="progress"><i style="width:' + pct + '%"></i></div><div class="progress-meta"><span>' + pct + '%</span><span>' + done + ' de ' + total + '</span></div>';
    if (total === 0) { list.innerHTML = '<div class="empty"><div class="big">Todo despejado</div>Agrega una tarea con +</div>'; return; }
    const feat = ts.filter((t) => t.featured && !t.done), rest = ts.filter((t) => !(t.featured && !t.done));
    if (feat.length) { addSect(list, "Lo importante de hoy"); feat.forEach((t) => list.appendChild(taskEl(t))); }
    addSect(list, "Todo lo demás");
    rest.sort((a, b) => (+a.done - +b.done) || ((a.time || "~").localeCompare(b.time || "~")));
    rest.forEach((t) => list.appendChild(taskEl(t)));
  } else {
    ["Personal", "Trabajo", "Casa"].forEach((name) => {
      const g = ts.filter((t) => t.list === name); if (!g.length) return;
      const gd = g.filter((t) => t.done).length;
      addSect(list, name + " · " + gd + "/" + g.length);
      g.sort((a, b) => +a.done - +b.done);
      g.forEach((t) => list.appendChild(taskEl(t)));
    });
  }
}

export function initHoy() {
  useSegment("hoyseg", "hoy", (v) => { hoyMode = v; renderHoy(); });
}
export function setHoyMode(m: string) { hoyMode = m; }
