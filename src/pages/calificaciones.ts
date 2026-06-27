/**
 * pages/calificaciones.ts — módulo académico de calificaciones.
 * Materias con evaluaciones ponderadas, calificación en vivo, promedio del
 * semestre y "¿qué necesito sacar?". Reutiliza bloques, store y charts.
 */
import { DB, save } from "../database/store";
import { $, qsa, openModal, closeModal } from "../utils/dom";
import { esc } from "../utils/format";
import { progressBar } from "../components/charts";
import * as G from "../academics/grades";
import type { Course } from "../types";

let courseEdit: number | null = null;

export function renderCalif(w: HTMLElement) {
  const prom = G.semesterAverage();
  let h = '<div class="block"><div class="block-h">Promedio del semestre</div>';
  h += '<div class="big-money" style="text-align:center;font-size:40px;color:' + (prom == null ? "var(--ink-3)" : prom >= G.PASS ? "var(--ink-1)" : "var(--warn)") + '">' + (prom == null ? "—" : prom) + '</div>';
  h += '<div class="note" style="text-align:center;margin:2px 0 0">' + (DB.courses || []).length + ' materias · ponderado por créditos</div></div>';

  (DB.courses || []).forEach((c) => {
    const cg = G.currentGrade(c); const tw = G.totalWeight(c); const rem = G.remainingWeight(c);
    const needPass = G.neededFor(c, G.PASS); const needTarget = G.neededFor(c, c.target || 90);
    h += '<div class="block"><div class="block-h" style="display:flex;justify-content:space-between;align-items:center"><span>' + esc(c.name) + '</span><span class="calif-g" style="color:' + (cg == null ? "var(--ink-3)" : cg >= G.PASS ? "var(--ink-1)" : "var(--warn)") + '">' + (cg == null ? "—" : cg) + '</span></div>';
    h += progressBar(cg || 0);
    if (tw !== 100) h += '<div class="note" style="color:var(--warn);margin-top:8px">Los pesos suman ' + tw + '% (deberían sumar 100%).</div>';
    // evaluaciones
    c.evals.forEach((e) => {
      h += '<div class="ev-row"><span class="ev-name">' + esc(e.name) + ' <span class="ld">' + (e.weight || 0) + '%</span></span>' +
        '<span class="ev-right"><input class="input mono ev-grade" data-c="' + c.id + '" data-e="' + e.id + '" type="number" inputmode="decimal" step="0.1" placeholder="—" value="' + (e.grade != null ? e.grade : "") + '"><button class="hx" data-delev="' + c.id + ':' + e.id + '" aria-label="Quitar">×</button></span></div>';
    });
    // agregar evaluación
    h += '<div class="ev-add"><input class="input" data-cc="' + c.id + '" data-k="name" placeholder="Evaluación (ej. Parcial 1)"><input class="input mono" data-cc="' + c.id + '" data-k="weight" type="number" inputmode="numeric" placeholder="% peso" style="max-width:96px"><button class="btn btn-ghost ev-addbtn" data-addev="' + c.id + '">Agregar</button></div>';
    // qué necesito
    if (rem > 0) {
      h += '<div class="note" style="margin-top:10px">';
      h += needPass.secured ? "Ya tienes asegurado pasar. " : (needPass.possible ? "Para <b>pasar</b> (" + G.PASS + ") necesitas <b>" + needPass.need + "</b> en el " + rem + "% restante. " : "Difícil pasar solo con lo que falta. ");
      h += needTarget.secured ? "Meta " + (c.target || 90) + " lograda." : (needTarget.possible ? "Para tu <b>meta " + (c.target || 90) + "</b> necesitas <b>" + needTarget.need + "</b>." : "La meta " + (c.target || 90) + " ya no es alcanzable este periodo.");
      h += '</div>';
    } else if (cg != null) {
      h += '<div class="note" style="margin-top:10px">Materia evaluada al 100%. Calificación final: <b>' + cg + '</b>.</div>';
    }
    h += '<div class="ccact" style="margin-top:12px"><button data-editc="' + c.id + '">Editar materia</button><button data-delc="' + c.id + '">Eliminar</button></div>';
    h += '</div>';
  });
  if (!(DB.courses || []).length) h += '<div class="note">Agrega tus materias para llevar tu promedio.</div>';
  h += '<button class="btn btn-primary" id="addCourse">+ Agregar materia</button>';
  h += '<div class="note">Asigna a cada evaluación su peso (deben sumar 100%) y captura la calificación cuando la tengas.</div>';
  w.innerHTML = h;

  $("addCourse").onclick = () => openCourse();
  qsa<HTMLElement>("[data-editc]", w).forEach((b) => (b.onclick = () => openCourse(+b.dataset.editc!)));
  qsa<HTMLElement>("[data-delc]", w).forEach((b) => (b.onclick = () => { if (confirm("¿Eliminar esta materia?")) { DB.courses = (DB.courses || []).filter((x) => x.id != (b.dataset.delc as any)); save(); renderCalif(w); } }));
  qsa<HTMLInputElement>(".ev-grade", w).forEach((inp) => (inp.onchange = () => {
    const c = (DB.courses || []).find((x) => x.id == (inp.dataset.c as any)); if (!c) return;
    const e = c.evals.find((x) => x.id == (inp.dataset.e as any)); if (!e) return;
    e.grade = inp.value === "" ? null : +inp.value; save(); renderCalif(w);
  }));
  qsa<HTMLElement>("[data-delev]", w).forEach((b) => (b.onclick = () => {
    const [cid, eid] = b.dataset.delev!.split(":"); const c = (DB.courses || []).find((x) => x.id == (cid as any)); if (!c) return;
    c.evals = c.evals.filter((x) => x.id != (eid as any)); save(); renderCalif(w);
  }));
  qsa<HTMLElement>("[data-addev]", w).forEach((b) => (b.onclick = () => {
    const cid = b.dataset.addev!; const c = (DB.courses || []).find((x) => x.id == (cid as any)); if (!c) return;
    const nameI = w.querySelector('input[data-cc="' + cid + '"][data-k="name"]') as HTMLInputElement;
    const wI = w.querySelector('input[data-cc="' + cid + '"][data-k="weight"]') as HTMLInputElement;
    const nm = (nameI.value || "").trim(); const wt = +wI.value || 0; if (!nm) { nameI.focus(); return; }
    c.evals.push({ id: DB.evalSeq!++, name: nm, weight: wt, grade: null }); save(); renderCalif(w);
  }));
}

function openCourse(id?: number) {
  const c = id ? (DB.courses || []).find((x) => x.id === id) : null; courseEdit = c ? c.id : null;
  $("cs-title").textContent = c ? "Editar materia" : "Nueva materia";
  $<HTMLInputElement>("cs-name").value = c ? c.name : "";
  $<HTMLInputElement>("cs-target").value = c && c.target ? String(c.target) : "90";
  $<HTMLInputElement>("cs-credits").value = c && c.credits ? String(c.credits) : "8";
  openModal("courseModal");
}

export function initCalif() {
  $("cs-cancel").onclick = () => closeModal("courseModal");
  $("cs-save").onclick = () => {
    const nm = $<HTMLInputElement>("cs-name").value.trim(); if (!nm) { $("cs-name").focus(); return; }
    const obj: Course = { id: courseEdit || DB.courseSeq!++, name: nm, target: +$<HTMLInputElement>("cs-target").value || 90, credits: +$<HTMLInputElement>("cs-credits").value || 8, evals: [] };
    if (courseEdit) { const c = (DB.courses || []).find((x) => x.id === courseEdit)!; c.name = obj.name; c.target = obj.target; c.credits = obj.credits; }
    else (DB.courses = DB.courses || []).push(obj);
    save(); closeModal("courseModal");
    const body = $("planBody"); if (body) renderCalif(body);
  };
  const m = $("courseModal"); if (m) m.onclick = (e: any) => { if (e.target === m) closeModal("courseModal"); };
}
