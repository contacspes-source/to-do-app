/**
 * pages/tarea-detalle.ts — detalle de una tarea (subtareas, recordatorio, notas).
 */
import { DB, save, dk } from "../database/store";
import { $ } from "../utils/dom";
import { esc, cap, CHK } from "../utils/format";
import { go } from "../router";
import type { Task } from "../types";

let curId: number | null = null;

function renderSubs(t: Task) {
  const w = $("d-subs"); w.innerHTML = "";
  if (!t.subs.length) w.innerHTML = '<div style="color:var(--ink-4);font-size:13.5px;padding:8px 0">Aún no hay subtareas.</div>';
  t.subs.forEach((s) => {
    const el = document.createElement("div"); el.className = "sub" + (s.d ? " done" : "");
    el.innerHTML = '<button class="check" aria-label="Completar">' + CHK + '</button><span class="st">' + esc(s.t) + '</span>';
    el.querySelector(".check")!.addEventListener("click", () => { s.d = !s.d; save(); renderSubs(t); });
    w.appendChild(el);
  });
}

export function openDetail(id: number) {
  curId = id; const t = DB.tasks.find((x) => x.id === id); if (!t) return;
  $("d-title").textContent = t.title;
  $("d-meta").innerHTML = '<span class="badge ' + t.prio + '">' + cap(t.prio) + '</span><span class="fpill">' + t.list + '</span>' + (t.time ? '<span class="time">' + t.time + '</span>' : '');
  $("d-notes").textContent = t.notes || "Sin notas.";
  $("d-rem").classList.toggle("on", !!t.rem);
  $("d-remtime").textContent = t.rem ? "Activo" + (t.time ? " · " + t.time : "") : "Sin recordatorio";
  $("d-complete").textContent = t.done ? "Marcar como pendiente" : "Marcar como hecha";
  renderSubs(t); go("detalle");
}

export function initDetalle() {
  $("d-subadd").onclick = () => {
    const inp = $<HTMLInputElement>("d-subinput"), v = inp.value.trim(); if (!v) return;
    const t = DB.tasks.find((x) => x.id === curId)!; t.subs.push({ t: v, d: false }); inp.value = ""; save(); renderSubs(t);
  };
  $("d-subinput").addEventListener("keydown", (e: any) => { if (e.key === "Enter") $("d-subadd").click(); });
  $("d-rem").onclick = function (this: HTMLElement) {
    const t = DB.tasks.find((x) => x.id === curId)!; t.rem = !t.rem; save();
    this.classList.toggle("on", t.rem);
    $("d-remtime").textContent = t.rem ? "Activo" + (t.time ? " · " + t.time : "") : "Sin recordatorio";
  };
  $("d-complete").onclick = () => { const t = DB.tasks.find((x) => x.id === curId)!; t.done = !t.done; if (t.done) DB.history[dk(new Date())] = true; save(); go("hoy"); };
  $("detBack").onclick = () => go("hoy");
}
