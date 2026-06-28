/**
 * pages/comida.ts — MealPrep: responde "¿qué voy a comer hoy?".
 * Pestañas: Plan (días en botones + vista dedicada por día, plan dinámico),
 * Recetas (con macros), Súper, Refri (inventario + sugerencias) y Suplementos.
 * El seguimiento físico/progreso vive ahora en pages/progreso.ts.
 */
import { DB, save } from "../database/store";
import { $, qsa, openModal, closeModal } from "../utils/dom";
import { esc } from "../utils/format";
import { RECIPES, recipesByMeal, MEAL_LABELS, recipeMacros, GROCERY_ORDER, type MealSlot } from "../database/recipes";
import { getPlan, generatePlan, setPlanSlot, recipesForDay, groceryList, nutritionTargets, WEEK_DAYS, weekKey } from "../services/mealplan";
import { openBuyGrocery, openRecipe, openSupp } from "../components/modals";
import { useSegment } from "../hooks/useSegment";
import * as T from "../services/tracking";
import * as P from "../services/pantry";
import { SUPP_SUGGESTIONS } from "../database/supplements";

let comidaSeg = (() => { try { return localStorage.getItem("misem_comida") || "plan"; } catch { return "plan"; } })();
const SLOTS: MealSlot[] = ["desayuno", "colacion", "comida", "cena"];
const SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
let openDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
let newPantryCat = GROCERY_ORDER[1];

function macroChips(id: string): string {
  const m = recipeMacros(id);
  return '<span class="mchip">' + m.kcal + ' kcal</span><span class="mchip">P ' + m.p + 'g</span><span class="mchip">C ' + m.c + 'g</span><span class="mchip">G ' + m.f + 'g</span>';
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
    $("boughtBtn").onclick = () => openBuyGrocery(() => { const n = P.importFromGrocery(); if (n) alert("Se agregaron " + n + " productos a tu refri."); renderComida("super"); });

  } else if (seg === "refri") {
    renderRefri(w);
  } else if (seg === "suplementos") {
    renderSuplementos(w);
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

export function initComida() {
  useSegment("comidaseg", comidaSeg, (v) => { comidaSeg = v; try { localStorage.setItem("misem_comida", v); } catch {} renderComida(v); });
}
