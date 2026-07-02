/**
 * pages/plan.ts — plan de carrera: avance, materias, horario y ruta.
 */
import { DB, save } from "../database/store";
import { $, qsa, openModal, closeModal, pillGroup, resetPills} from "../utils/dom";
import { esc } from "../utils/format";
import { SEM_START } from "../config/app";
import { MATS, AREAS, SCEN } from "../database/academic-data";
import { addSect } from "./hoy";
import { useSegment } from "../hooks/useSegment";
import { weekKey } from "../services/mealplan";
import { renderCalif } from "./calificaciones";

let curSeg = "avance", curScen = "normal", curDay = 0;
let cellR = 0, cellC = 0, cellCat = "clase", cellDone = 0;
let editId: { k: string; id: string } | null = null;

/* ---- Enfoque (Pomodoro anti-procrastinación / anti-hiperfoco) ---- */
const WORK = 25 * 60, BREAK = 5 * 60, LONG = 15 * 60;
let pomoMode: "work" | "break" | "long" = "work", pomoLeft = WORK, pomoRunning = false, pomoCycles = 0, pomoTimer: any = null;
function fmtT(s: number) { const m = Math.floor(s / 60), ss = s % 60; return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss; }
function pomoLabel() { return pomoMode === "work" ? "Enfoque" : pomoMode === "break" ? "Descanso" : "Descanso largo"; }
function notify(msg: string) { try { if ("Notification" in window && Notification.permission === "granted") new Notification("Mi semestre · Enfoque", { body: msg }); } catch {} }
function pomoSwitch() {
  if (pomoMode === "work") { pomoCycles++; if (pomoCycles % 4 === 0) { pomoMode = "long"; pomoLeft = LONG; notify("¡Buen trabajo! Toca un descanso largo (anti-hiperfoco)."); } else { pomoMode = "break"; pomoLeft = BREAK; notify("Pausa de 5 min. Levántate y respira."); } }
  else { pomoMode = "work"; pomoLeft = WORK; notify("De vuelta al enfoque: una sola tarea, 25 min."); }
}
function pomoTick() {
  if (!pomoRunning) return;
  pomoLeft--;
  if (pomoLeft <= 0) { pomoSwitch(); if (curSeg === "enfoque") renderPlan("enfoque"); return; }
  const el = document.getElementById("pomo-time"); if (el) el.textContent = fmtT(pomoLeft);
}

function semWeek() { const ms = Date.now() - SEM_START.getTime(); return Math.floor(ms / (7 * 864e5)) + 1; }
function step(t: string, s: string, root: number) { return '<div class="step' + (root ? " root" : "") + '"><div class="pt">' + t + '</div><div class="ps">' + s + '</div></div>'; }
function arrow() { return '<div class="arrowd">↓</div>'; }

function renderMatProg() {
  const w = $("matProgList"); if (!w) return; w.innerHTML = "";
  MATS.forEach((m, i) => {
    const v = DB.matProg[i] || 0; const el = document.createElement("div"); el.className = "matp";
    el.innerHTML = '<div class="mh"><span class="mn">' + m[0] + '</span><span class="mv">' + v + '%</span></div><div class="bar"><i class="acc" style="width:' + v + '%"></i></div><div class="stp"><button data-i="' + i + '" data-d="-5">−</button><button data-i="' + i + '" data-d="5">+</button></div>';
    w.appendChild(el);
  });
  qsa<HTMLElement>(".stp button", w).forEach((b) => { b.onclick = () => { const i = b.dataset.i!, d = parseInt(b.dataset.d!); DB.matProg[i] = Math.max(0, Math.min(100, (DB.matProg[i] || 0) + d)); save(); renderMatProg(); }; });
}

function buildDaysel(k: string) {
  const w = $("daysel"); w.innerHTML = "";
  SCEN[k].g.forEach((g, i) => { w.innerHTML += '<button class="' + (i === 0 ? "on" : "") + '" data-d="' + i + '">' + g.d + '</button>'; });
  qsa<HTMLElement>("button", w).forEach((b) => { b.onclick = () => { qsa("button", w).forEach((x) => x.classList.remove("on")); b.classList.add("on"); renderSched(curScen, parseInt(b.dataset.d!)); }; });
}
function renderSched(k: string, di: number) {
  curScen = k; curDay = di; $("princ").textContent = SCEN[k].p;
  const g = SCEN[k].g[di], c = $("sched"); c.innerHTML = "";
  g.b.forEach((r, bi) => {
    const id = di + "-" + bi; const ov = DB.schedEdit[k] && DB.schedEdit[k][id];
    const tm = ov ? ov.t : r[0], ac = ov ? ov.a : r[1];
    const el = document.createElement("div"); el.className = "blk";
    el.innerHTML = '<span class="bt">' + tm + '</span><span class="ba">' + esc(ac) + '</span><span class="pen">✎</span>';
    el.onclick = () => { editId = { k, id }; $<HTMLInputElement>("m-time").value = tm; $<HTMLInputElement>("m-act").value = ac; openModal("blkModal"); };
    c.appendChild(el);
  });
}

export function renderPlan(seg = curSeg) {
  curSeg = seg; const w = $("planBody"); w.innerHTML = "";
  if (seg === "avance") {
    const sw = semWeek(); const swtxt = sw < 1 ? "Por iniciar" : "Semana " + Math.min(sw, 16) + " de 16"; const swpct = sw < 1 ? 0 : Math.min(Math.round(sw / 16 * 100), 100);
    let h = '<div class="stat-row"><div class="stat"><div class="n">93.11</div><div class="l">Promedio</div></div><div class="stat"><div class="n">57%</div><div class="l">Carrera</div></div><div class="stat"><div class="n">28</div><div class="l">Materias OK</div></div></div>';
    h += '<div class="card-pad" style="margin-top:14px"><div class="arow" style="margin:0"><div class="top"><b style="font-weight:500">Semestre 2026-B</b><span class="v">' + swtxt + '</span></div><div class="bar"><i class="acc" style="width:' + swpct + '%"></i></div></div></div>';
    h += '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><b style="font-weight:500">Créditos de la carrera</b><span class="v">225 / 394</span></div><div class="bar"><i style="width:57%"></i></div></div><div class="note">Faltan 169; 117 son especializante + selectiva + optativa.</div></div>';
    h += '<div class="sect">Avance por materia (ajústalo a tu ritmo)</div><div id="matProgList"></div>';
    h += '<div class="sect">Avance por área</div>';
    AREAS.forEach((a) => { const p = Math.round(a[1] / a[2] * 100); h += '<div class="arow"><div class="top"><span>' + a[0] + '</span><span class="v">' + a[1] + '/' + a[2] + '</span></div><div class="bar"><i style="width:' + Math.max(p, 2) + '%"></i></div></div>'; });
    w.innerHTML = h; renderMatProg();
  } else if (seg === "materias") {
    const c = document.createElement("div"); addSect(c, "Inscribes en 2026-B · ~20h/sem");
    MATS.forEach((m, i) => { const el = document.createElement("div"); el.className = "task" + (DB.mat[i] ? " done" : ""); el.innerHTML = '<button class="check" aria-label="Inscrita"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 5"/></svg></button><div class="body"><span class="ttl">' + m[0] + '</span><div class="meta"><span class="time">' + m[1] + '</span><span class="fpill">' + m[2] + '</span></div></div>'; el.querySelector(".check")!.addEventListener("click", () => { DB.mat[i] = !DB.mat[i]; save(); renderPlan("materias"); }); c.appendChild(el); });
    addSect(c, "Se difieren a 2027-A");
    [["Interacción Humano-Computadora", "Proyecto pesado — sola"], ["Programación de Bajo Nivel", "Tras pasar Arquitectura"]].forEach((m) => { const el = document.createElement("div"); el.className = "task"; el.style.opacity = ".55"; el.innerHTML = '<div class="body"><span class="ttl">' + m[0] + '</span><div class="meta"><span class="time">' + m[1] + '</span></div></div>'; c.appendChild(el); });
    w.appendChild(c);
  } else if (seg === "horario") {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]; const tt = DB.timetable || [];
    let h = '<div class="note" style="margin-top:0">Tu semana. Toca una celda para asignar o editar una actividad; clic largo no, solo toca. Colores por categoría.</div>';
    h += '<div class="ttwrap"><table class="tt"><thead><tr><th>Hora</th>' + days.map((d) => '<th>' + d + '</th>').join("") + '<th></th></tr></thead><tbody>';
    tt.forEach((r, ri) => {
      h += '<tr><td class="tt-hcell"><input class="tt-time" data-r="' + ri + '" value="' + esc(r.time) + '"></td>';
      for (let c = 0; c < 7; c++) { const cell = r.cells[c]; h += '<td>' + (cell ? '<button class="tt-act cat-' + (cell.cat || "clase") + (cell.done ? " done" : "") + '" data-r="' + ri + '" data-c="' + c + '">' + esc(cell.text) + '</button>' : '<button class="tt-empty" data-r="' + ri + '" data-c="' + c + '">+</button>') + '</td>'; }
      h += '<td><button class="hx" data-delrow="' + ri + '" aria-label="Quitar hora">×</button></td></tr>';
    });
    h += '</tbody></table></div><button class="btn btn-ghost" id="ttAddRow">+ Agregar hora</button>';
    h += '<div class="ttlegend"><span class="cat-clase">Clase</span><span class="cat-estudio">Estudio</span><span class="cat-trabajo">Trabajo</span><span class="cat-personal">Personal</span><span class="cat-libre">Libre</span></div>';
    h += '<div class="note">Detecta huecos libres y planifica tareas en ellos.</div>';
    w.innerHTML = h;
    qsa<HTMLInputElement>(".tt-time", w).forEach((inp) => (inp.onchange = () => { DB.timetable![+inp.dataset.r!].time = inp.value; save(); }));
    qsa<HTMLElement>(".tt-act,.tt-empty", w).forEach((b) => (b.onclick = () => openCell(+b.dataset.r!, +b.dataset.c!)));
    $("ttAddRow").onclick = () => { DB.timetable!.push({ time: "", cells: [null, null, null, null, null, null, null] }); save(); renderPlan("horario"); };
    qsa<HTMLElement>("[data-delrow]", w).forEach((b) => (b.onclick = () => { DB.timetable!.splice(+b.dataset.delrow!, 1); save(); renderPlan("horario"); }));
  } else if (seg === "ruta") {  } else if (seg === "ruta") {
    let h = '<div class="card-pad"><div style="color:var(--ink-2);font-size:14px;line-height:1.6">Dos materias clave son la raíz de tus áreas: Redes nace de Arquitectura; IA nace de Análisis de Algoritmos.</div></div>';
    h += '<div class="track-h">Ruta Redes / distribuidos</div>' + step("Arquitectura de Computadoras", "Inscribes 2026-B · base de redes", 1) + arrow() + step("Programación de Bajo Nivel", "2027-A, al pasar Arquitectura", 0) + arrow() + step("Módulo: Redes", "Admin. de redes, interconexión", 0);
    h += '<div class="track-h">Ruta Sistemas Inteligentes</div>' + step("Análisis de Algoritmos", "Inscribes 2026-B · base de IA", 1) + arrow() + step("Algoritmos metaheurísticos", "Redes neuronales, deep learning", 0) + arrow() + step("Módulo: Sistemas Inteligentes", "Aprendizaje máquina", 0);
    h += '<div class="sect">Tronco común (también ahora)</div>' + step("Ingeniería de Software", "Abre los Laboratorios Abiertos", 0) + step("Innovación Tecnológica", "Enfoque proyecto / inversión", 0);
    w.innerHTML = h;
  } else if (seg === "calif") {
    renderCalif(w);
  } else if (seg === "enfoque") {
    renderEnfoque(w);
  } else if (seg === "revision") {
    renderRevision(w);
  }
}

function renderEnfoque(w: HTMLElement) {
  let h = '<div class="card-pad" style="text-align:center"><div class="l" id="pomo-mode" style="font-size:12px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;font-family:var(--font-mono)">' + pomoLabel() + '</div>';
  h += '<div class="streak-num" id="pomo-time" style="font-size:64px;margin:8px 0">' + fmtT(pomoLeft) + '</div>';
  h += '<div class="note" style="margin:0">Ciclos completados hoy: ' + pomoCycles + '</div></div>';
  h += '<div class="row2" style="display:flex;gap:10px"><button class="btn btn-primary" id="pomo-toggle" style="flex:1">' + (pomoRunning ? "Pausar" : "Iniciar") + '</button><button class="btn btn-ghost" id="pomo-reset" style="flex:1">Reiniciar</button></div>';
  h += '<div class="sect">Cómo usarlo (TDAH)</div>';
  h += '<div class="card-pad"><div style="font-size:14px;color:var(--ink-2);line-height:1.7">· <b>Una sola tarea</b> por bloque de 25 min. Escríbela antes de iniciar.<br>· Cuando suene, <b>descansa de verdad</b> (5 min). Cada 4 ciclos, descanso largo: evita el hiperfoco que agota.<br>· Si te distraes, anota el pensamiento en una hoja y vuelve. No lo persigas.<br>· ¿Te cuesta arrancar? Empieza por <b>2 minutos</b>; casi siempre sigues.</div></div>';
  h += '<button class="btn btn-ghost" id="pomo-notif">Activar avisos del navegador</button>';
  w.innerHTML = h;
  document.getElementById("pomo-toggle")!.onclick = () => { pomoRunning = !pomoRunning; renderPlan("enfoque"); };
  document.getElementById("pomo-reset")!.onclick = () => { pomoRunning = false; pomoMode = "work"; pomoLeft = WORK; renderPlan("enfoque"); };
  document.getElementById("pomo-notif")!.onclick = () => { if ("Notification" in window) Notification.requestPermission(); };
}

const REVIEW_ITEMS = [
  "Revisar pendientes de la semana y cerrar lo hecho",
  "Mover lo no terminado a la próxima semana",
  "Revisar avance de materias y entregas próximas",
  "Planear los bloques de estudio/proyecto de la semana",
  "Revisar finanzas: pagos y gastos de la semana",
  "Preparar el meal prep del domingo",
  "Definir las 3 prioridades de la semana",
];
function renderRevision(w: HTMLElement) {
  const wk = weekKey(); const done = REVIEW_ITEMS.filter((_, i) => DB.review![wk + "::" + i]).length;
  const pct = Math.round((done / REVIEW_ITEMS.length) * 100);
  let h = '<div class="note" style="margin-top:0">Una revisión corta cada domingo mantiene el semestre bajo control. Se reinicia sola cada semana.</div>';
  h += '<div class="card-pad" style="margin-top:10px"><div class="arow" style="margin:0"><div class="top"><b style="font-weight:500">Revisión de esta semana</b><span class="v">' + done + '/' + REVIEW_ITEMS.length + '</span></div><div class="bar"><i class="acc" style="width:' + pct + '%"></i></div></div></div>';
  REVIEW_ITEMS.forEach((it, i) => { const on = DB.review![wk + "::" + i]; h += '<div class="task' + (on ? " done" : "") + '"><button class="check" data-rev="' + i + '" aria-label="Hecho"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 5"/></svg></button><div class="body"><span class="ttl">' + esc(it) + '</span></div></div>'; });
  w.innerHTML = h;
  qsa<HTMLElement>("[data-rev]", w).forEach((b) => (b.onclick = () => { const k = wk + "::" + b.dataset.rev; DB.review![k] = !DB.review![k]; save(); renderPlan("revision"); }));
}

const DAYNAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
function openCell(r: number, c: number) {
  cellR = r; cellC = c; const cell = DB.timetable![r].cells[c];
  $("ce-title").textContent = (DB.timetable![r].time || "Hora") + " · " + DAYNAMES[c];
  $<HTMLInputElement>("ce-text").value = cell ? cell.text : "";
  cellCat = cell && cell.cat ? cell.cat : "clase"; resetPills("ce-cat", cellCat);
  cellDone = cell && cell.done ? 1 : 0; resetPills("ce-done", String(cellDone));
  // Materias compartidas (mismas de Calificaciones): elegir sin re-escribir
  const mw = $("ce-materias");
  if (mw) {
    const cs = DB.courses || [];
    mw.innerHTML = cs.length ? cs.map((c) => '<button class="chip" data-mat="' + esc(c.name) + '">' + esc(c.name) + '</button>').join("") : '<span class="note" style="margin:0">Agrega materias en Plan › Calificaciones.</span>';
    qsa<HTMLElement>("[data-mat]", mw).forEach((b) => (b.onclick = () => { $<HTMLInputElement>("ce-text").value = b.dataset.mat!; cellCat = "clase"; resetPills("ce-cat", "clase"); }));
  }
  openModal("cellModal"); setTimeout(() => $("ce-text").focus(), 250);
}

export function initPlan() {
  pillGroup($("ce-cat"), (v) => (cellCat = v));
  pillGroup($("ce-done"), (v) => (cellDone = +v));
  $("ce-cancel").onclick = () => closeModal("cellModal");
  $("ce-del").onclick = () => { DB.timetable![cellR].cells[cellC] = null; save(); closeModal("cellModal"); renderPlan("horario"); };
  $("ce-save").onclick = () => { const t = $<HTMLInputElement>("ce-text").value.trim(); DB.timetable![cellR].cells[cellC] = t ? { text: t, cat: cellCat, done: cellDone === 1 } : null; save(); closeModal("cellModal"); renderPlan("horario"); };
  useSegment("planseg", "avance", (v) => renderPlan(v));
  if (!pomoTimer) pomoTimer = setInterval(pomoTick, 1000);
  $("m-cancel").onclick = () => closeModal("blkModal");
  $("m-save").onclick = () => { if (!editId) return; DB.schedEdit[editId.k] = DB.schedEdit[editId.k] || {}; DB.schedEdit[editId.k][editId.id] = { t: $<HTMLInputElement>("m-time").value.trim(), a: $<HTMLInputElement>("m-act").value.trim() }; save(); closeModal("blkModal"); renderSched(editId.k, curDay); };
}
