/**
 * pages/progreso.ts — PROGRESO: responde "¿cómo voy avanzando?".
 * Fusiona la antigua Constancia (automática) con el antiguo Perfil de MealPrep
 * (cuerpo, evolución, rachas, estadísticas) en una sola pantalla con bloques.
 * No duplica lógica: usa services/constancia, services/tracking y components/charts.
 */
import { DB, save } from "../database/store";
import { $, qsa, pillGroup } from "../utils/dom";
import { esc, CHK } from "../utils/format";
import { lineChart, progressBar } from "../components/charts";
import * as C from "../services/constancia";
import * as T from "../services/tracking";
import { nutritionTargets } from "../services/mealplan";

let seg = (() => { try { return localStorage.getItem("misem_progreso") || "resumen"; } catch { return "resumen"; } })();
let progGroup: "week" | "month" = "week";

function downscalePhoto(file: File, cb: (d: string) => void) {
  const r = new FileReader();
  r.onload = (e) => { const im = new Image(); im.onload = () => { const max = 360, sc = Math.min(1, max / im.width), cw = Math.round(im.width * sc), ch = Math.round(im.height * sc); const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch; cv.getContext("2d")!.drawImage(im, 0, 0, cw, ch); try { cb(cv.toDataURL("image/jpeg", 0.6)); } catch { cb(e.target!.result as string); } }; im.src = e.target!.result as string; };
  r.readAsDataURL(file);
}

export function renderProgreso(s = seg) {
  seg = s;
  qsa<HTMLElement>("#progresoseg button").forEach((b) => b.classList.toggle("on", b.dataset.v === seg));
  const b = $("progresoBody"); if (!b) return;
  if (seg === "resumen") blockResumen(b);
  else if (seg === "cuerpo") blockCuerpo(b);
  else if (seg === "rachas") blockRachas(b);
  else blockStats(b);
}

/* ===== Resumen: constancia + foto física rápida ===== */
function blockResumen(b: HTMLElement) {
  const st = C.streak(); const sem = C.avgPct(7), mes = C.avgPct(30); const comp = C.completedDays(30);
  const dots = C.weekDots(); const today = C.todayHabits();
  const p = DB.foodProfile!; const cur = T.latestWeight(); const t = nutritionTargets(p);

  let h = '<div class="block"><div class="streak-hero" style="padding:4px 0"><div class="streak-num">' + st + '</div><div class="streak-sub">días seguidos</div></div>';
  h += '<div class="week">' + dots.map((x) => '<div class="wd"><div class="dot' + (x.complete ? " on" : "") + '">' + (x.complete ? "✓" : (x.pct > 0 ? x.pct : "")) + '</div><div class="dl">' + x.label + '</div></div>').join("") + '</div></div>';

  h += '<div class="block"><div class="block-h">Cumplimiento</div>';
  h += '<div class="arow" style="margin:0"><div class="top"><span>Esta semana</span><span class="v">' + sem + '%</span></div>' + progressBar(sem) + '</div>';
  h += '<div class="arow"><div class="top"><span>Este mes</span><span class="v">' + mes + '%</span></div>' + progressBar(mes) + '</div>';
  h += '<div class="note">Días completados este mes: <b>' + comp + '</b> / 30.</div></div>';

  h += '<div class="block"><div class="block-h">Tu cuerpo</div>';
  h += '<div class="stat-row"><div class="stat"><div class="n">' + cur + '</div><div class="l">Peso (kg)</div></div><div class="stat"><div class="n">' + T.imc(cur) + '</div><div class="l">IMC</div></div><div class="stat"><div class="n">' + (p.targetWeight || cur) + '</div><div class="l">Objetivo</div></div></div>';
  h += '<div class="stat-row" style="margin-top:10px"><div class="stat"><div class="n">' + t.kcal + '</div><div class="l">kcal/día</div></div><div class="stat"><div class="n">' + t.protein + 'g</div><div class="l">Proteína</div></div><div class="stat"><div class="n">' + p.waterTargetL + 'L</div><div class="l">Agua/día</div></div></div></div>';

  h += '<div class="block"><div class="block-h">Hoy</div>';
  today.forEach((x) => { h += '<div class="task' + (x.done ? " done" : "") + '"><button class="check" style="cursor:default">' + CHK + '</button><div class="body"><span class="ttl">' + esc(x.label) + '</span></div></div>'; });
  h += '<div class="note">Se marca solo cuando completas la acción (desde HOY o su módulo).</div></div>';
  b.innerHTML = h;
}

/* ===== Cuerpo: evolución, objetivo, medidas, fotos, datos físicos ===== */
function blockCuerpo(b: HTMLElement) {
  const series = T.weightSeries(progGroup); const pg = T.progressToGoal();
  const p = DB.foodProfile!; const cur = T.latestWeight(); const tw = T.todayWeight();

  let h = '<div class="seg" id="proggrp"><button class="' + (progGroup === "week" ? "on" : "") + '" data-v="week">Por semana</button><button class="' + (progGroup === "month" ? "on" : "") + '" data-v="month">Por mes</button></div>';
  h += '<div class="sect">Evolución del peso</div><div class="card-pad">' + lineChart(series, { unit: "kg" }) + '</div>';
  h += '<div class="sect">Progreso hacia el objetivo</div>';
  h += '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><b style="font-weight:500">' + pg.start + ' kg → ' + pg.target + ' kg</b><span class="v">' + pg.pct + '%</span></div>' + progressBar(pg.pct) + '<div class="note">Actual: ' + pg.current + ' kg.</div></div></div>';

  // registro diario rápido
  h += '<div class="block"><div class="block-h">Registro de hoy</div>';
  h += '<div class="field row2" style="margin-bottom:10px"><div><span class="label">Peso (kg)</span><input class="input mono" id="tk-weight" type="number" step="0.1" value="' + (tw ? tw.kg : "") + '" placeholder="' + cur + '"></div><div><span class="label">Agua (L)</span><input class="input mono" id="tk-water" type="number" step="0.25" value="' + (DB.waterLog?.[T.isoDay()] ?? "") + '"></div></div>';
  h += '<button class="btn btn-ghost" id="tk-save-day">Guardar registro</button>';
  h += '<div style="height:10px"></div><div class="pills"><button class="pill' + (DB.planLog?.[T.isoDay()] ? " sel" : "") + '" id="tk-plan">Seguí el plan</button><button class="pill' + (DB.mealsLog?.[T.isoDay()] ? " sel" : "") + '" id="tk-meals">Registré comidas</button></div></div>';

  const hist = (DB.weightLog || []).slice(-8).reverse();
  h += '<div class="sect">Historial de mediciones</div>';
  if (!hist.length) h += '<div class="note">Aún no registras peso.</div>';
  hist.forEach((wk) => (h += '<div class="lrow"><span class="ld">' + wk.date + '</span><span class="money">' + wk.kg + ' kg</span></div>'));

  h += '<div class="sect">Medidas (cm)</div>';
  h += '<div style="display:flex;gap:10px;flex-wrap:wrap"><input class="input mono" id="ms-waist" type="number" placeholder="Cintura" style="flex:1;min-width:90px"><input class="input mono" id="ms-chest" type="number" placeholder="Pecho" style="flex:1;min-width:90px"><input class="input mono" id="ms-arm" type="number" placeholder="Brazo" style="flex:1;min-width:90px"></div>';
  h += '<div style="height:8px"></div><button class="btn btn-ghost" id="ms-add">Guardar medición</button>';
  const ms = (DB.measurements || []).slice(-4).reverse();
  ms.forEach((m) => (h += '<div class="lrow"><span class="ld">' + m.date + '</span><span class="money">' + [m.waist && "C" + m.waist, m.chest && "P" + m.chest, m.arm && "B" + m.arm].filter(Boolean).join(" · ") + '</span></div>'));

  h += '<div class="sect">Fotos de progreso</div>';
  h += '<input type="file" id="ph-file" accept="image/*" style="display:none"><button class="btn btn-ghost" id="ph-add">Agregar foto de hoy</button>';
  const photos = DB.bodyPhotos || [];
  if (photos.length) { h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">'; photos.forEach((ph, i) => (h += '<div style="position:relative"><img src="' + ph.img + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px"><button class="hx" data-ph="' + i + '" style="position:absolute;top:2px;right:4px;background:rgba(0,0,0,.5);color:#fff;border:0;border-radius:6px;cursor:pointer;font-size:14px;padding:0 6px">×</button><div class="note" style="margin:2px 0 0;text-align:center">' + ph.date.slice(5) + '</div></div>')); h += '</div>'; }

  // datos físicos
  h += '<div class="block"><div class="block-h">Datos físicos</div>';
  h += '<div class="field row2"><div><span class="label">Estatura (cm)</span><input class="input mono" id="fp-h" type="number" value="' + p.height + '"></div><div><span class="label">Peso objetivo (kg)</span><input class="input mono" id="fp-tw" type="number" value="' + (p.targetWeight || "") + '"></div></div>';
  h += '<div class="field"><span class="label">Objetivo</span><div class="pills" id="fp-goal">' + [["recomp", "Recomposición"], ["muscle", "Músculo"], ["deficit", "Déficit"], ["maintain", "Mantener"]].map(([v, l]) => '<button class="pill' + (p.goal === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
  h += '<div class="field"><span class="label">Nivel de actividad</span><div class="pills" id="fp-act">' + [["none", "Ninguna"], ["light", "Ligera"], ["moderate", "Moderada"], ["high", "Alta"]].map(([v, l]) => '<button class="pill' + (p.activity === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
  h += '<div class="field"><span class="label">Meta de agua (L/día)</span><input class="input mono" id="fp-water" type="number" step="0.5" value="' + p.waterTargetL + '"></div>';
  h += '<button class="btn btn-primary" id="fp-save">Guardar datos físicos</button></div>';
  b.innerHTML = h;

  qsa<HTMLElement>("#proggrp button", b).forEach((bt) => (bt.onclick = () => { progGroup = bt.dataset.v as any; renderProgreso("cuerpo"); }));
  $("tk-save-day").onclick = () => { const kg = +$<HTMLInputElement>("tk-weight").value; if (kg > 0) T.logWeight(kg); if ($<HTMLInputElement>("tk-water").value !== "") T.logWater(+$<HTMLInputElement>("tk-water").value); renderProgreso("cuerpo"); };
  $("tk-plan").onclick = () => { T.setPlanFollowed(!(DB.planLog?.[T.isoDay()])); renderProgreso("cuerpo"); };
  $("tk-meals").onclick = () => { T.setMealsLogged(!(DB.mealsLog?.[T.isoDay()])); renderProgreso("cuerpo"); };
  $("ms-add").onclick = () => { const waist = +$<HTMLInputElement>("ms-waist").value || undefined, chest = +$<HTMLInputElement>("ms-chest").value || undefined, arm = +$<HTMLInputElement>("ms-arm").value || undefined; if (!waist && !chest && !arm) return; T.addMeasurement({ date: T.isoDay(), waist, chest, arm }); renderProgreso("cuerpo"); };
  $("ph-add").onclick = () => $("ph-file").click();
  $<HTMLInputElement>("ph-file").onchange = (e: any) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; downscalePhoto(f, (d) => { T.addPhoto(d); renderProgreso("cuerpo"); }); };
  qsa<HTMLElement>("[data-ph]", b).forEach((bt) => (bt.onclick = () => { if (confirm("¿Eliminar esta foto?")) { T.removePhoto(+bt.dataset.ph!); renderProgreso("cuerpo"); } }));
  pillGroup($("fp-goal"), (v) => (DB.foodProfile!.goal = v as any));
  pillGroup($("fp-act"), (v) => (DB.foodProfile!.activity = v as any));
  $("fp-save").onclick = () => { const pf = DB.foodProfile!; pf.height = +$<HTMLInputElement>("fp-h").value || pf.height; pf.targetWeight = +$<HTMLInputElement>("fp-tw").value || pf.targetWeight; pf.waterTargetL = +$<HTMLInputElement>("fp-water").value || pf.waterTargetL; save(); renderProgreso("cuerpo"); };
}

/* ===== Rachas ===== */
function blockRachas(b: HTMLElement) {
  const st = T.streaks(); const pend = T.pendingToday();
  let h = '<div class="block"><div class="block-h">Rachas</div><div class="stat-row"><div class="stat"><div class="n">' + st.plan + '</div><div class="l">Plan</div></div><div class="stat"><div class="n">' + st.comidas + '</div><div class="l">Comidas</div></div><div class="stat"><div class="n">' + st.peso + '</div><div class="l">Peso</div></div><div class="stat"><div class="n">' + st.agua + '</div><div class="l">Hidratación</div></div></div>';
  h += '<div class="note" style="margin-bottom:0">Días consecutivos. Si dejas un día sin registrar, esa racha se reinicia.</div></div>';
  h += '<div class="block"><div class="block-h">Pendiente hoy</div>';
  if (!pend.length) h += '<div style="font-size:14px;color:var(--ink-1)">¡Todo registrado hoy! 4/4 rachas activas.</div>';
  else pend.forEach((x) => (h += '<div class="lrow"><span>' + esc(x) + '</span><span class="ld">pendiente</span></div>'));
  h += '</div>';
  b.innerHTML = h;
}

/* ===== Estadísticas ===== */
function blockStats(b: HTMLElement) {
  const m7 = T.metrics(7), m30 = T.metrics(30); const pc = T.planCompliance(30), wc = T.waterCompliance(30);
  const c7 = C.habitCompliance(7);
  let h = '<div class="sect">Cumplimiento semanal (últimos 7 días)</div>';
  h += '<div class="stat-row"><div class="stat"><div class="n">' + m7.comidas + '/7</div><div class="l">Comidas</div></div><div class="stat"><div class="n">' + m7.plan + '/7</div><div class="l">Plan</div></div><div class="stat"><div class="n">' + m7.peso + '/7</div><div class="l">Peso</div></div><div class="stat"><div class="n">' + m7.agua + '/7</div><div class="l">Agua</div></div></div>';
  h += '<div class="sect">Cumplimiento mensual (últimos 30 días)</div>';
  h += '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><span>Comidas registradas</span><span class="v">' + m30.comidas + '/30</span></div>' + progressBar(Math.round(m30.comidas / 30 * 100)) + '</div>';
  h += '<div class="arow"><div class="top"><span>Cumplí el plan</span><span class="v">' + pc + '%</span></div>' + progressBar(pc) + '</div>';
  h += '<div class="arow"><div class="top"><span>Hidratación</span><span class="v">' + wc + '%</span></div>' + progressBar(wc) + '</div>';
  h += '<div class="arow"><div class="top"><span>Registro de peso</span><span class="v">' + m30.peso + '/30</span></div>' + progressBar(Math.round(m30.peso / 30 * 100)) + '</div></div>';
  const tendencia = (() => { const s = T.weightSeries("week"); if (s.length < 2) return "Necesitas más registros para ver tendencia."; const d = s[s.length - 1].value - s[0].value; return d < 0 ? "Tendencia: bajando " + Math.abs(+d.toFixed(1)) + " kg." : d > 0 ? "Tendencia: subiendo " + (+d.toFixed(1)) + " kg." : "Tendencia: estable."; })();
  h += '<div class="sect">Tendencia</div><div class="card-pad"><div style="font-size:14px;color:var(--ink-2)">' + tendencia + '</div></div>';
  const bien = c7.filter((x) => x.pct >= 70), mal = c7.filter((x) => x.pct < 40);
  if (bien.length) { h += '<div class="sect">Vas bien</div>'; bien.forEach((x) => (h += '<div class="lrow"><span>' + x.label + '</span><span class="money">' + x.pct + '%</span></div>')); }
  if (mal.length) { h += '<div class="sect">A mejorar</div>'; mal.forEach((x) => (h += '<div class="lrow"><span>' + x.label + '</span><span class="money" style="color:var(--warn)">' + x.pct + '%</span></div>')); }
  b.innerHTML = h;
}

export function initProgreso() {
  qsa<HTMLElement>("#progresoseg button").forEach((b) => (b.onclick = () => { seg = b.dataset.v!; try { localStorage.setItem("misem_progreso", seg); } catch {} renderProgreso(seg); }));
}
