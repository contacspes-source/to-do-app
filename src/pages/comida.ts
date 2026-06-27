/**
 * pages/comida.ts — MealPrep.
 * Pestañas: Plan (días en botones + vista dedicada por día, plan dinámico),
 * Recetas (con macros), Súper, Refri (inventario + sugerencias) y Perfil
 * (bloques: Físico, Progreso, Rachas, Estadísticas).
 */
import { DB, save } from "../database/store";
import { $, qsa, pillGroup, openModal, closeModal } from "../utils/dom";
import { esc } from "../utils/format";
import { RECIPES, recipesByMeal, MEAL_LABELS, recipeMacros, GROCERY_ORDER, type MealSlot } from "../database/recipes";
import { getPlan, generatePlan, setPlanSlot, recipesForDay, groceryList, nutritionTargets, WEEK_DAYS, weekKey } from "../services/mealplan";
import { openBuyGrocery, openRecipe, openSupp } from "../components/modals";
import { useSegment } from "../hooks/useSegment";
import * as T from "../services/tracking";
import * as P from "../services/pantry";
import { lineChart, progressBar } from "../components/charts";
import { SUPP_SUGGESTIONS } from "../database/supplements";

let comidaSeg = (() => { try { return localStorage.getItem("misem_comida") || "plan"; } catch { return "plan"; } })();
const SLOTS: MealSlot[] = ["desayuno", "colacion", "comida", "cena"];
const SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
let openDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
let perfilBlock = (() => { try { return localStorage.getItem("misem_perfil") || "fisico"; } catch { return "fisico"; } })();
let progGroup: "week" | "month" = "week";
let newPantryCat = GROCERY_ORDER[1];

function macroChips(id: string): string {
  const m = recipeMacros(id);
  return '<span class="mchip">' + m.kcal + ' kcal</span><span class="mchip">P ' + m.p + 'g</span><span class="mchip">C ' + m.c + 'g</span><span class="mchip">G ' + m.f + 'g</span>';
}
function downscalePhoto(file: File, cb: (d: string) => void) {
  const r = new FileReader();
  r.onload = (e) => { const im = new Image(); im.onload = () => { const max = 360, sc = Math.min(1, max / im.width), cw = Math.round(im.width * sc), ch = Math.round(im.height * sc); const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch; cv.getContext("2d")!.drawImage(im, 0, 0, cw, ch); try { cb(cv.toDataURL("image/jpeg", 0.6)); } catch { cb(e.target!.result as string); } }; im.src = e.target!.result as string; };
  r.readAsDataURL(file);
}

function dayView(day: number): string {
  const meals = recipesForDay(day);
  const tot = meals.reduce((a, { recipe }) => { if (recipe) { const m = recipeMacros(recipe.id); a.k += m.kcal; a.p += m.p; a.c += m.c; a.f += m.f; } return a; }, { k: 0, p: 0, c: 0, f: 0 });
  const tgt = nutritionTargets(); const wk = weekKey();
  let v = '<div class="dayview"><div class="dv-head">' + WEEK_DAYS[day] + '<span class="dv-k" id="dvtot">' + tot.k + ' kcal</span></div><div class="dv-body">';
  meals.forEach(({ slot, label, pool, recipe }) => {
    const mk = wk + "-" + day + "-" + slot; const st = (DB.mealState || {})[mk] || {};
    v += '<div class="dv-meal">';
    v += '<div class="dv-mhead"><span class="dv-slot">' + label + '</span><span class="dv-rname">' + (recipe ? esc(recipe.name) : "—") + '</span></div>';
    v += '<div class="mchips">' + (recipe ? macroChips(recipe.id) : "") + '</div>';
    v += '<div class="dv-acts">' +
      (recipe ? '<button data-recipe="' + recipe.id + '" data-rday="' + day + '" data-rslot="' + slot + '">Receta</button>' : "") +
      '<button data-change="' + slot + '" data-pool="' + pool + '" data-day="' + day + '">Cambiar</button>' +
      '<button class="tgl' + (st.prep ? " on" : "") + '" data-prep="' + mk + '">Preparada</button>' +
      '<button class="tgl' + (st.cons ? " on" : "") + '" data-cons="' + mk + '">Consumida</button>' +
      '</div></div>';
  });
  v += '</div></div>';
  v += '<div class="daytot">Total del día: <b>' + tot.k + ' kcal</b> · P ' + tot.p + 'g · C ' + tot.c + 'g · G ' + tot.f + 'g <span class="note" style="margin:0">(meta ~' + tgt.kcal + ' kcal · ' + tgt.protein + 'g prot.)</span></div>';
  return v;
}

function toggleMeal(mk: string, kind: "prep" | "cons") {
  DB.mealState = DB.mealState || {};
  const st = DB.mealState[mk] || (DB.mealState[mk] = {});
  st[kind] = !st[kind]; save();
}
function openChooser(day: number, slot: string, pool: MealSlot) {
  $("ch-title").textContent = "Elegir comida";
  $("ch-sub").textContent = "Toca una receta para reemplazar este tiempo.";
  const list = $("ch-list");
  list.innerHTML = recipesByMeal(pool).map((r) => '<button class="ch-item" data-pick="' + r.id + '"><span>' + esc(r.name) + '</span><span class="ld">' + recipeMacros(r.id).kcal + ' kcal</span></button>').join("");
  qsa<HTMLElement>("[data-pick]", list).forEach((b) => (b.onclick = () => { setPlanSlot(day, slot, b.dataset.pick!); closeModal("chooseModal"); renderComida("plan"); }));
  openModal("chooseModal");
}

export function renderComida(seg = comidaSeg) {
  comidaSeg = seg; const w = $("comidaBody"); if (!w) return; w.innerHTML = "";

  if (seg === "plan") {
    getPlan();
    const pt = DB.mealPlanType || "variado";
    let h = '<div class="note" style="margin-top:0">Plan semanal dinámico. Elige un tipo y toca un día para ver su menú.</div>';
    h += '<div class="seg" id="plantype">' + [["variado", "Variado"], ["economica", "Económico"], ["proteina", "Alta proteína"]].map(([v, l]) => '<button class="' + (pt === v ? "on" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div>';
    h += '<div class="daybtns">' + WEEK_DAYS.map((_, i) => '<button class="daybtn' + (openDay === i ? " on" : "") + '" data-day="' + i + '">' + SHORT[i] + '</button>').join("") + '</div>';
    if (openDay >= 0) h += dayView(openDay);
    h += '<div style="height:12px"></div><button class="btn btn-ghost" id="regenPlan">↻ Regenerar plan de la semana</button>';
    w.innerHTML = h;
    qsa<HTMLElement>("#plantype button", w).forEach((b) => (b.onclick = () => { generatePlan(b.dataset.v!); renderComida("plan"); }));
    qsa<HTMLElement>("[data-day]", w).forEach((b) => (b.onclick = () => { openDay = +b.dataset.day!; renderComida("plan"); }));
    qsa<HTMLElement>("[data-recipe]", w).forEach((b) => (b.onclick = () => openRecipe(b.dataset.recipe!, { day: +b.dataset.rday!, slot: b.dataset.rslot! }, () => renderComida("plan"))));
    qsa<HTMLElement>("[data-change]", w).forEach((b) => (b.onclick = () => openChooser(+b.dataset.day!, b.dataset.change!, b.dataset.pool as MealSlot)));
    qsa<HTMLElement>("[data-prep]", w).forEach((b) => (b.onclick = () => { toggleMeal(b.dataset.prep!, "prep"); renderComida("plan"); }));
    qsa<HTMLElement>("[data-cons]", w).forEach((b) => (b.onclick = () => { toggleMeal(b.dataset.cons!, "cons"); renderComida("plan"); }));
    $("regenPlan").onclick = () => { generatePlan(DB.mealPlanType); renderComida("plan"); };

  } else if (seg === "recetas") {
    let h = '<div class="note" style="margin-top:0">Banco de ' + RECIPES.length + ' recetas fáciles, económicas y aptas para meal prep.</div>';
    SLOTS.forEach((slot) => {
      h += '<div class="sect">' + MEAL_LABELS[slot] + '</div>';
      recipesByMeal(slot).forEach((r) => {
        h += '<div class="card-pad"><div class="top" style="display:flex;justify-content:space-between;gap:10px"><b style="font-weight:600">' + esc(r.name) + '</b><span class="v" style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3)">' + esc(r.protein) + '</span></div>' +
          '<div class="note" style="margin-top:6px"><b>Ingredientes:</b> ' + r.ingredients.map((i) => esc(i.qty + " " + i.item.toLowerCase())).join(", ") + '.</div>' +
          '<div class="note" style="margin-top:4px">' + esc(r.prep) + '</div>' +
          '<div class="mchips">' + macroChips(r.id) + '</div></div>';
      });
    });
    w.innerHTML = h;

  } else if (seg === "super") {
    const groups = groceryList(); let bought = 0, totalItems = 0;
    groups.forEach((g) => g.items.forEach((it) => { totalItems++; if (DB.comidaCheck[g.cat + ":" + it.item]) bought++; }));
    let h = '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Lista del súper · semana actual</div><div style="font-weight:600;font-size:18px;margin-top:6px">' + bought + ' / ' + totalItems + ' marcados</div></div>';
    h += '<div class="note" style="margin-top:0">Se genera desde tu plan, agrupada por categoría. Marca lo que ya tengas.</div>';
    groups.forEach((g) => {
      h += '<div class="sect">' + g.cat + '</div>';
      g.items.forEach((it) => { const key = g.cat + ":" + it.item; const on = DB.comidaCheck[key]; h += '<div class="task' + (on ? " done" : "") + '"><button class="check" data-k="' + esc(key) + '" aria-label="Ya lo tengo"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 5"/></svg></button><div class="body"><span class="ttl">' + esc(it.item) + (it.count > 1 ? ' <span style="color:var(--ink-3)">×' + it.count + '</span>' : '') + '</span></div></div>'; });
    });
    if (!totalItems) h += '<div class="note">Genera tu plan en la pestaña Plan para crear la lista.</div>';
    h += '<div style="height:16px"></div><button class="btn btn-primary" id="boughtBtn">Marcar lista como comprada</button>';
    h += '<div style="height:10px"></div><button class="btn btn-ghost" id="superReset">Desmarcar todo</button>';
    w.innerHTML = h;
    qsa<HTMLElement>(".check", w).forEach((b) => { b.onclick = () => { const k = b.dataset.k!; DB.comidaCheck[k] = !DB.comidaCheck[k]; save(); renderComida("super"); }; });
    $("superReset").onclick = () => { DB.comidaCheck = {}; save(); renderComida("super"); };
    $("boughtBtn").onclick = () => openBuyGrocery(() => renderComida("super"));

  } else if (seg === "refri") {
    renderRefri(w);
  } else if (seg === "suplementos") {
    renderSuplementos(w);
  } else if (seg === "perfil") {
    renderPerfil(w);
  }
}

function renderSuplementos(w: HTMLElement) {
  const day = T.isoDay();
  let h = '<div class="note" style="margin-top:0">Gestiona tus suplementos: dosis, horario, existencia y recordatorio. Marca lo que tomes hoy.</div>';
  h += '<button class="btn btn-primary" id="sp-add">+ Agregar suplemento</button>';
  (DB.supplements || []).forEach((sp) => {
    const taken = (DB.supplementLog || {})[day + "-" + sp.id];
    const meta = [sp.dose, sp.time, sp.days].filter(Boolean).join(" · ");
    h += '<div class="card-cc"><div style="display:flex;justify-content:space-between;align-items:start;gap:10px"><div><div class="cn">' + esc(sp.name) + (sp.brand ? ' <span class="ld">' + esc(sp.brand) + '</span>' : '') + '</div><div class="cnum">' + esc(meta || "—") + '</div></div><div class="money">' + (sp.stock ? sp.stock + " dosis" : "sin stock") + '</div></div>' +
      (sp.notes ? '<div class="note" style="margin-top:8px">' + esc(sp.notes) + '</div>' : '') +
      '<div class="ccact"><button class="tgl' + (taken ? " on" : "") + '" data-sptake="' + sp.id + '">' + (taken ? "Tomado hoy ✓" : "Tomado hoy") + '</button><button data-spedit="' + sp.id + '">Editar</button><button data-spdel="' + sp.id + '">Eliminar</button></div></div>';
  });
  if (!(DB.supplements || []).length) h += '<div class="note">Aún no tienes suplementos. Agrega uno.</div>';
  // Recomendaciones
  h += '<div class="sect">Sugerencias (opcionales)</div>';
  h += '<div class="note" style="margin-top:0">Basadas en evidencia y en tu perfil. Son opcionales, no parte obligatoria del plan.</div>';
  SUPP_SUGGESTIONS.forEach((g) => {
    h += '<div class="card-pad"><div class="top" style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b style="font-weight:600">' + esc(g.name) + '</b><span class="evi evi-' + g.evidence + '">evidencia ' + g.evidence + '</span></div>' +
      '<div class="note" style="margin-top:6px">' + esc(g.why) + '</div>' +
      (g.tdah ? '<div class="note" style="margin-top:4px;color:var(--ink-2)"><b>Potencialmente útil en TDAH</b> (evidencia limitada). No es un tratamiento del TDAH.</div>' : '') + '</div>';
  });
  h += '<div class="note">Información orientativa, no es indicación médica. Coméntalo con tu médico o psiquiatra antes de iniciar cualquier suplemento.</div>';
  w.innerHTML = h;
  $("sp-add").onclick = () => openSupp(undefined, () => renderComida("suplementos"));
  qsa<HTMLElement>("[data-spedit]", w).forEach((b) => (b.onclick = () => openSupp(b.dataset.spedit, () => renderComida("suplementos"))));
  qsa<HTMLElement>("[data-spdel]", w).forEach((b) => (b.onclick = () => { if (confirm("¿Eliminar este suplemento?")) { DB.supplements = (DB.supplements || []).filter((x) => x.id != (b.dataset.spdel as any)); save(); renderComida("suplementos"); } }));
  qsa<HTMLElement>("[data-sptake]", w).forEach((b) => (b.onclick = () => {
    const id = +b.dataset.sptake!; const k = day + "-" + id; DB.supplementLog = DB.supplementLog || {};
    const sp = (DB.supplements || []).find((x) => x.id === id);
    if (!DB.supplementLog[k]) { DB.supplementLog[k] = true; if (sp && (sp.stock || 0) > 0) sp.stock = (sp.stock || 0) - 1; }
    else { delete DB.supplementLog[k]; if (sp) sp.stock = (sp.stock || 0) + 1; }
    save(); renderComida("suplementos");
  }));
}

function renderRefri(w: HTMLElement) {
  const expd = P.expired(), exp = P.expiringSoon();
  let h = '<div class="note" style="margin-top:0">Registra lo que tienes en casa. Te aviso lo próximo a vencer y te sugiero recetas con lo que ya hay.</div>';
  h += '<div class="sect">Agregar alimento</div>';
  h += '<div class="field"><input class="input" id="pn-item" placeholder="Ej. Pechuga de pollo"></div>';
  h += '<div class="field row2"><select class="input select" id="pn-cat">' + GROCERY_ORDER.map((c) => '<option value="' + c + '"' + (c === newPantryCat ? " selected" : "") + '>' + c + '</option>').join("") + '</select><input class="input mono" id="pn-exp" type="date" title="Caducidad (opcional)"></div>';
  h += '<button class="btn btn-ghost" id="pn-add">+ Agregar al refri</button>';
  h += '<div style="height:8px"></div><button class="btn btn-ghost" id="pn-import">Importar de la lista del súper</button>';
  if (expd.length) { h += '<div class="sect">Vencidos</div>'; expd.forEach((p) => (h += '<div class="alert">' + esc(p.item) + ' venció hace ' + Math.abs(P.daysToExpire(p)!) + 'd</div>')); }
  if (exp.length) { h += '<div class="sect">Por vencer (≤3 días)</div>'; exp.forEach((p) => (h += '<div class="alert">' + esc(p.item) + ' en ' + P.daysToExpire(p) + 'd</div>')); }
  const groups = P.byCategory();
  h += '<div class="sect">En casa</div>';
  if (!groups.length) h += '<div class="note">Tu refri está vacío. Agrega alimentos arriba.</div>';
  groups.forEach((g) => { h += '<div class="sect" style="margin:14px 0 6px">' + g.cat + '</div>'; g.items.forEach((p) => { const d = P.daysToExpire(p); h += '<div class="lrow"><span>' + esc(p.item) + (d != null ? ' <span class="ld">' + (d < 0 ? "vencido" : "vence en " + d + "d") + '</span>' : '') + '</span><button class="hx" data-delp="' + p.id + '" style="color:var(--ink-4);background:none;border:0;font-size:16px;cursor:pointer">×</button></div>'; }); });
  const sug = P.suggestions().slice(0, 6);
  h += '<div class="sect">Puedes preparar</div>';
  if (!sug.length) h += '<div class="note">Agrega alimentos para ver sugerencias de recetas.</div>';
  sug.forEach((sx) => { h += '<div class="card-pad"><div class="top" style="display:flex;justify-content:space-between;gap:10px"><b style="font-weight:600">' + esc(sx.recipe.name) + '</b><span class="v" style="font-family:var(--font-mono);font-size:11px;color:' + (sx.coverage >= 70 ? "var(--ink-1)" : "var(--ink-3)") + '">' + sx.coverage + '% en casa</span></div>' + (sx.missing.length ? '<div class="note" style="margin-top:6px">Te falta: ' + sx.missing.map((m) => esc(m.toLowerCase())).join(", ") + '.</div>' : '<div class="note" style="margin-top:6px">¡Tienes todo!</div>') + '</div>'; });
  w.innerHTML = h;
  $("pn-add").onclick = () => { P.addPantry($<HTMLInputElement>("pn-item").value, $<HTMLSelectElement>("pn-cat").value, $<HTMLInputElement>("pn-exp").value || undefined); renderComida("refri"); };
  $("pn-import").onclick = () => { const n = P.importFromGrocery(); alert(n ? ("Se agregaron " + n + " productos al refri.") : "Ya tienes todo lo de la lista."); renderComida("refri"); };
  qsa<HTMLElement>("[data-delp]", w).forEach((b) => (b.onclick = () => { P.removePantry(+b.dataset.delp!); renderComida("refri"); }));
}

/* ===== Perfil en bloques ===== */
function renderPerfil(w: HTMLElement) {
  let h = '<div class="seg" id="perfilseg">' + [["fisico", "Físico"], ["progreso", "Progreso"], ["rachas", "Rachas"], ["stats", "Estadísticas"]].map(([v, l]) => '<button class="' + (perfilBlock === v ? "on" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div><div id="pfBody"></div>';
  w.innerHTML = h;
  const b = $("pfBody");
  if (perfilBlock === "fisico") blockFisico(b);
  else if (perfilBlock === "progreso") blockProgreso(b);
  else if (perfilBlock === "rachas") blockRachas(b);
  else blockStats(b);
  qsa<HTMLElement>("#perfilseg button", w).forEach((bt) => (bt.onclick = () => { perfilBlock = bt.dataset.v!; try { localStorage.setItem("misem_perfil", perfilBlock); } catch {} renderComida("perfil"); }));
}

function blockFisico(b: HTMLElement) {
  const p = DB.foodProfile!; const t = nutritionTargets(p); const cur = T.latestWeight(); const tw = T.todayWeight();
  let h = '<div class="block"><div class="block-h">Información física</div>';
  h += '<div class="stat-row"><div class="stat"><div class="n">' + cur + '</div><div class="l">Peso (kg)</div></div><div class="stat"><div class="n">' + T.imc(cur) + '</div><div class="l">IMC</div></div><div class="stat"><div class="n">' + (p.targetWeight || cur) + '</div><div class="l">Objetivo</div></div></div>';
  h += '<div class="stat-row" style="margin-top:10px"><div class="stat"><div class="n">' + t.kcal + '</div><div class="l">kcal/día</div></div><div class="stat"><div class="n">' + t.protein + 'g</div><div class="l">Proteína</div></div><div class="stat"><div class="n">' + p.waterTargetL + 'L</div><div class="l">Agua/día</div></div></div></div>';
  // ---- Bloque: Registro diario ----
  h += '<div class="block"><div class="block-h">Registro diario</div>';
  h += '<div class="field row2" style="margin-bottom:10px"><div><span class="label">Peso de hoy (kg)</span><input class="input mono" id="tk-weight" type="number" step="0.1" value="' + (tw ? tw.kg : "") + '" placeholder="' + cur + '"></div><div><span class="label">Agua de hoy (L)</span><input class="input mono" id="tk-water" type="number" step="0.25" value="' + (DB.waterLog?.[T.isoDay()] ?? "") + '"></div></div>';
  h += '<button class="btn btn-ghost" id="tk-save-day">Guardar registro</button>';
  h += '<div style="height:10px"></div><div class="pills"><button class="pill' + (DB.planLog?.[T.isoDay()] ? " sel" : "") + '" id="tk-plan">Seguí el plan</button><button class="pill' + (DB.mealsLog?.[T.isoDay()] ? " sel" : "") + '" id="tk-meals">Registré comidas</button></div></div>';
  // ---- Bloque: Datos físicos ----
  h += '<div class="block"><div class="block-h">Datos físicos</div>';
  h += '<div class="field row2"><div><span class="label">Estatura (cm)</span><input class="input mono" id="fp-h" type="number" value="' + p.height + '"></div><div><span class="label">Peso objetivo (kg)</span><input class="input mono" id="fp-tw" type="number" value="' + (p.targetWeight || "") + '"></div></div>';
  h += '<div class="field"><span class="label">Objetivo</span><div class="pills" id="fp-goal">' + [["recomp", "Recomposición"], ["muscle", "Músculo"], ["deficit", "Déficit"], ["maintain", "Mantener"]].map(([v, l]) => '<button class="pill' + (p.goal === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
  h += '<div class="field"><span class="label">Nivel de actividad</span><div class="pills" id="fp-act">' + [["none", "Ninguna"], ["light", "Ligera"], ["moderate", "Moderada"], ["high", "Alta"]].map(([v, l]) => '<button class="pill' + (p.activity === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
  h += '<div class="field"><span class="label">Meta de agua (L/día)</span><input class="input mono" id="fp-water" type="number" step="0.5" value="' + p.waterTargetL + '"></div>';
  h += '<button class="btn btn-primary" id="fp-save">Guardar datos físicos</button></div>';
  b.innerHTML = h;
  $("tk-save-day").onclick = () => { const kg = +$<HTMLInputElement>("tk-weight").value; if (kg > 0) T.logWeight(kg); if ($<HTMLInputElement>("tk-water").value !== "") T.logWater(+$<HTMLInputElement>("tk-water").value); renderComida("perfil"); };
  $("tk-plan").onclick = () => { T.setPlanFollowed(!(DB.planLog?.[T.isoDay()])); renderComida("perfil"); };
  $("tk-meals").onclick = () => { T.setMealsLogged(!(DB.mealsLog?.[T.isoDay()])); renderComida("perfil"); };
  pillGroup($("fp-goal"), (v) => (p.goal = v as any));
  pillGroup($("fp-act"), (v) => (p.activity = v as any));
  $("fp-save").onclick = () => { p.height = +$<HTMLInputElement>("fp-h").value || p.height; p.targetWeight = +$<HTMLInputElement>("fp-tw").value || p.targetWeight; p.waterTargetL = +$<HTMLInputElement>("fp-water").value || p.waterTargetL; save(); renderComida("perfil"); };
}

function blockProgreso(b: HTMLElement) {
  const series = T.weightSeries(progGroup); const pg = T.progressToGoal();
  let h = '<div class="seg" id="proggrp"><button class="' + (progGroup === "week" ? "on" : "") + '" data-v="week">Por semana</button><button class="' + (progGroup === "month" ? "on" : "") + '" data-v="month">Por mes</button></div>';
  h += '<div class="sect">Evolución del peso</div><div class="card-pad">' + lineChart(series, { unit: "kg" }) + '</div>';
  h += '<div class="sect">Progreso hacia el objetivo</div>';
  h += '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><b style="font-weight:500">' + pg.start + ' kg → ' + pg.target + ' kg</b><span class="v">' + pg.pct + '%</span></div>' + progressBar(pg.pct) + '<div class="note">Actual: ' + pg.current + ' kg.</div></div></div>';
  const hist = (DB.weightLog || []).slice(-8).reverse();
  h += '<div class="sect">Historial de mediciones</div>';
  if (!hist.length) h += '<div class="note">Aún no registras peso.</div>';
  hist.forEach((wk) => (h += '<div class="lrow"><span class="ld">' + wk.date + '</span><span class="money">' + wk.kg + ' kg</span></div>'));
  // medidas y fotos
  h += '<div class="sect">Medidas (cm)</div>';
  h += '<div style="display:flex;gap:10px;flex-wrap:wrap"><input class="input mono" id="ms-waist" type="number" placeholder="Cintura" style="flex:1;min-width:90px"><input class="input mono" id="ms-chest" type="number" placeholder="Pecho" style="flex:1;min-width:90px"><input class="input mono" id="ms-arm" type="number" placeholder="Brazo" style="flex:1;min-width:90px"></div>';
  h += '<div style="height:8px"></div><button class="btn btn-ghost" id="ms-add">Guardar medición</button>';
  const ms = (DB.measurements || []).slice(-4).reverse();
  ms.forEach((m) => (h += '<div class="lrow"><span class="ld">' + m.date + '</span><span class="money">' + [m.waist && "C" + m.waist, m.chest && "P" + m.chest, m.arm && "B" + m.arm].filter(Boolean).join(" · ") + '</span></div>'));
  h += '<div class="sect">Fotos de progreso</div>';
  h += '<input type="file" id="ph-file" accept="image/*" style="display:none"><button class="btn btn-ghost" id="ph-add">Agregar foto de hoy</button>';
  const photos = DB.bodyPhotos || [];
  if (photos.length) { h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">'; photos.forEach((ph, i) => (h += '<div style="position:relative"><img src="' + ph.img + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px"><button class="hx" data-ph="' + i + '" style="position:absolute;top:2px;right:4px;background:rgba(0,0,0,.5);color:#fff;border:0;border-radius:6px;cursor:pointer;font-size:14px;padding:0 6px">×</button><div class="note" style="margin:2px 0 0;text-align:center">' + ph.date.slice(5) + '</div></div>')); h += '</div>'; }
  b.innerHTML = h;
  qsa<HTMLElement>("#proggrp button", b).forEach((bt) => (bt.onclick = () => { progGroup = bt.dataset.v as any; renderComida("perfil"); }));
  $("ms-add").onclick = () => { const waist = +$<HTMLInputElement>("ms-waist").value || undefined, chest = +$<HTMLInputElement>("ms-chest").value || undefined, arm = +$<HTMLInputElement>("ms-arm").value || undefined; if (!waist && !chest && !arm) return; T.addMeasurement({ date: T.isoDay(), waist, chest, arm }); renderComida("perfil"); };
  $("ph-add").onclick = () => $("ph-file").click();
  $<HTMLInputElement>("ph-file").onchange = (e: any) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; downscalePhoto(f, (d) => { T.addPhoto(d); renderComida("perfil"); }); };
  qsa<HTMLElement>("[data-ph]", b).forEach((bt) => (bt.onclick = () => { if (confirm("¿Eliminar esta foto?")) { T.removePhoto(+bt.dataset.ph!); renderComida("perfil"); } }));
}

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

function blockStats(b: HTMLElement) {
  const m7 = T.metrics(7), m30 = T.metrics(30); const pc = T.planCompliance(30), wc = T.waterCompliance(30);
  let h = '<div class="sect">Cumplimiento semanal (últimos 7 días)</div>';
  h += '<div class="stat-row"><div class="stat"><div class="n">' + m7.comidas + '/7</div><div class="l">Comidas</div></div><div class="stat"><div class="n">' + m7.plan + '/7</div><div class="l">Plan</div></div><div class="stat"><div class="n">' + m7.peso + '/7</div><div class="l">Peso</div></div><div class="stat"><div class="n">' + m7.agua + '/7</div><div class="l">Agua</div></div></div>';
  h += '<div class="sect">Cumplimiento mensual (últimos 30 días)</div>';
  h += '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><span>Comidas registradas</span><span class="v">' + m30.comidas + '/30</span></div>' + progressBar(Math.round(m30.comidas / 30 * 100)) + '</div>';
  h += '<div class="arow"><div class="top"><span>Cumplí el plan</span><span class="v">' + pc + '%</span></div>' + progressBar(pc) + '</div>';
  h += '<div class="arow"><div class="top"><span>Hidratación</span><span class="v">' + wc + '%</span></div>' + progressBar(wc) + '</div>';
  h += '<div class="arow"><div class="top"><span>Registro de peso</span><span class="v">' + m30.peso + '/30</span></div>' + progressBar(Math.round(m30.peso / 30 * 100)) + '</div></div>';
  const tendencia = (() => { const s = T.weightSeries("week"); if (s.length < 2) return "Necesitas más registros para ver tendencia."; const d = s[s.length - 1].value - s[0].value; return d < 0 ? "Tendencia: bajando " + Math.abs(+d.toFixed(1)) + " kg." : d > 0 ? "Tendencia: subiendo " + (+d.toFixed(1)) + " kg." : "Tendencia: estable."; })();
  h += '<div class="sect">Tendencia</div><div class="card-pad"><div style="font-size:14px;color:var(--ink-2)">' + tendencia + '</div></div>';
  const pend = T.pendingToday();
  if (pend.length) { h += '<div class="sect">Para mejorar hoy</div>'; pend.forEach((x) => (h += '<div class="lrow"><span>' + esc(x) + '</span><span class="ld">pendiente</span></div>')); }
  b.innerHTML = h;
}

export function initComida() {
  useSegment("comidaseg", comidaSeg, (v) => { comidaSeg = v; try { localStorage.setItem("misem_comida", v); } catch {} renderComida(v); });
}
