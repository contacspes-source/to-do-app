/**
 * pages/plan.ts — plan de carrera: avance, materias, horario y ruta.
 */
import { DB, save } from "../database/store";
import { $, qsa, openModal, closeModal } from "../utils/dom";
import { esc } from "../utils/format";
import { SEM_START } from "../config/app";
import { MATS, AREAS, SCEN } from "../database/academic-data";
import { addSect } from "./hoy";
import { useSegment } from "../hooks/useSegment";

let curSeg = "avance", curScen = "normal", curDay = 0;
let editId: { k: string; id: string } | null = null;

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
    let h = '<div class="princ" id="princ"></div>';
    h += '<div class="seg" id="scenseg"><button class="on" data-s="normal">Normal</button><button data-s="superv">Difícil</button><button data-s="examen">Exámenes</button></div>';
    h += '<div class="daysel" id="daysel"></div><div id="sched"></div><div class="note">Toca un bloque para editar su hora o actividad.</div>';
    w.innerHTML = h; buildDaysel("normal"); renderSched("normal", 0);
    qsa<HTMLElement>("#scenseg button").forEach((b) => { b.onclick = () => { qsa("#scenseg button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); curScen = b.dataset.s!; buildDaysel(b.dataset.s!); renderSched(b.dataset.s!, 0); }; });
  } else if (seg === "ruta") {
    let h = '<div class="card-pad"><div style="color:var(--ink-2);font-size:14px;line-height:1.6">Dos materias clave son la raíz de tus áreas: Redes nace de Arquitectura; IA nace de Análisis de Algoritmos.</div></div>';
    h += '<div class="track-h">Ruta Redes / distribuidos</div>' + step("Arquitectura de Computadoras", "Inscribes 2026-B · base de redes", 1) + arrow() + step("Programación de Bajo Nivel", "2027-A, al pasar Arquitectura", 0) + arrow() + step("Módulo: Redes", "Admin. de redes, interconexión", 0);
    h += '<div class="track-h">Ruta Sistemas Inteligentes</div>' + step("Análisis de Algoritmos", "Inscribes 2026-B · base de IA", 1) + arrow() + step("Algoritmos metaheurísticos", "Redes neuronales, deep learning", 0) + arrow() + step("Módulo: Sistemas Inteligentes", "Aprendizaje máquina", 0);
    h += '<div class="sect">Tronco común (también ahora)</div>' + step("Ingeniería de Software", "Abre los Laboratorios Abiertos", 0) + step("Innovación Tecnológica", "Enfoque proyecto / inversión", 0);
    w.innerHTML = h;
  }
}

export function initPlan() {
  useSegment("planseg", "avance", (v) => renderPlan(v));
  $("m-cancel").onclick = () => closeModal("blkModal");
  $("m-save").onclick = () => { if (!editId) return; DB.schedEdit[editId.k] = DB.schedEdit[editId.k] || {}; DB.schedEdit[editId.k][editId.id] = { t: $<HTMLInputElement>("m-time").value.trim(), a: $<HTMLInputElement>("m-act").value.trim() }; save(); closeModal("blkModal"); renderSched(editId.k, curDay); };
}
