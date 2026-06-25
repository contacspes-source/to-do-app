/**
 * pages/tarea-nueva.ts — formulario de nueva tarea.
 */
import { DB, save } from "../database/store";
import { $, pillGroup, resetPills } from "../utils/dom";
import { go } from "../router";
import { renderHoy, setHoyMode } from "./hoy";

let addPrio = "media", addList = "Personal";

export function openAdd() {
  $<HTMLInputElement>("f-title").value = ""; $<HTMLInputElement>("f-notes").value = "";
  $<HTMLInputElement>("f-time").value = ""; $<HTMLInputElement>("f-date").valueAsDate = new Date();
  addPrio = "media"; addList = "Personal"; resetPills("f-prio", "media"); resetPills("f-list", "Personal");
  go("add"); setTimeout(() => $("f-title").focus(), 250);
}

export function initAdd() {
  pillGroup($("f-prio"), (v) => (addPrio = v));
  pillGroup($("f-list"), (v) => (addList = v));
  $("cancelTask").onclick = () => go("hoy");
  $("saveTask").onclick = () => {
    const ttl = $<HTMLInputElement>("f-title").value.trim();
    if (!ttl) { $("f-title").focus(); return; }
    DB.tasks.push({ id: DB.seq++, title: ttl, list: addList, prio: addPrio as any, time: $<HTMLInputElement>("f-time").value, notes: $<HTMLInputElement>("f-notes").value.trim(), done: false, featured: false, rem: false, subs: [] });
    save(); setHoyMode("hoy"); go("hoy"); renderHoy();
  };
}
