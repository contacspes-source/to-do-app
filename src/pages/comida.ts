/**
 * pages/comida.ts — MealPrep: asistente de alimentación + seguimiento físico.
 * Pestañas: Plan (acordeón por días), Recetas, Súper (lista + Finanzas),
 * Perfil (panel de progreso físico) y Progreso (gráficas).
 * Se eliminaron de la UI "Filosofía" y "Guía" (la guía queda como doc interna).
 */
import { DB, save } from "../database/store";
import { $, qsa, pillGroup } from "../utils/dom";
import { esc } from "../utils/format";
import { RECIPES, recipesByMeal, recipeById, MEAL_LABELS, type MealSlot } from "../database/recipes";
import { getPlan, generatePlan, setPlanSlot, recipesForDay, groceryList, nutritionTargets, WEEK_DAYS } from "../services/mealplan";
import { openBuyGrocery } from "../components/modals";
import { useSegment } from "../hooks/useSegment";
import * as T from "../services/tracking";
import { lineChart, progressBar } from "../components/charts";

let comidaSeg = "plan";
const SLOTS: MealSlot[] = ["desayuno", "colacion", "comida", "cena"];
let openDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // hoy abierto por defecto
let progGroup: "week" | "month" = "week";

/* downscale ligero para fotos de progreso */
function downscalePhoto(file: File, cb: (d: string) => void) {
  const r = new FileReader();
  r.onload = (e) => { const im = new Image(); im.onload = () => { const max = 360, sc = Math.min(1, max / im.width), cw = Math.round(im.width * sc), ch = Math.round(im.height * sc); const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch; cv.getContext("2d")!.drawImage(im, 0, 0, cw, ch); try { cb(cv.toDataURL("image/jpeg", 0.6)); } catch { cb(e.target!.result as string); } }; im.src = e.target!.result as string; };
  r.readAsDataURL(file);
}

export function renderComida(seg = comidaSeg) {
  comidaSeg = seg; const w = $("comidaBody"); if (!w) return; w.innerHTML = "";

  if (seg === "plan") {
    getPlan();
    let h = '<div class="note" style="margin-top:0">Plan variado de la semana (sin jitomate; con brócoli, zanahoria, pepino, lechuga, pasta boloñesa, smoothies y overnight oats). Abre un día para verlo y toca una comida para cambiarla.</div>';
    h += '<div style="height:10px"></div><button class="btn btn-ghost" id="regenPlan">↻ Regenerar plan de la semana</button><div style="height:6px"></div>';
    WEEK_DAYS.forEach((dname, day) => {
      const open = openDay === day;
      h += '<div class="acc-cat' + (open ? " open" : "") + '" data-day="' + day + '"><button class="acc-h" data-dayh="' + day + '">' + dname + '<span class="acc-x">▾</span></button><div class="acc-body">';
      recipesForDay(day).forEach(({ slot, recipe }) => {
        const opts = recipesByMeal(slot).map((r) => '<option value="' + r.id + '"' + (recipe && r.id === recipe.id ? " selected" : "") + '>' + esc(r.name) + '</option>').join("");
        h += '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="font-weight:600;font-size:13px">' + MEAL_LABELS[slot] + '</b><span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3)">' + (recipe ? esc(recipe.protein) : "") + '</span></div>' +
          '<select class="input mono select" data-day="' + day + '" data-slot="' + slot + '" style="margin-top:6px">' + opts + '</select></div>';
      });
      h += '</div></div>';
    });
    w.innerHTML = h;
    $("regenPlan").onclick = () => { generatePlan(); renderComida("plan"); };
    qsa<HTMLElement>("[data-dayh]", w).forEach((b) => { b.onclick = () => { const d = +b.dataset.dayh!; openDay = openDay === d ? -1 : d; renderComida("plan"); }; });
    qsa<HTMLSelectElement>("select[data-slot]", w).forEach((sel) => { sel.onchange = () => { setPlanSlot(+sel.dataset.day!, sel.dataset.slot as MealSlot, sel.value); renderComida("plan"); }; });

  } else if (seg === "recetas") {
    let h = '<div class="note" style="margin-top:0">Banco de ' + RECIPES.length + ' recetas fáciles, económicas y aptas para meal prep.</div>';
    SLOTS.forEach((slot) => {
      h += '<div class="sect">' + MEAL_LABELS[slot] + '</div>';
      recipesByMeal(slot).forEach((r) => {
        h += '<div class="card-pad"><div class="top" style="display:flex;justify-content:space-between;gap:10px"><b style="font-weight:600">' + esc(r.name) + '</b><span class="v" style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3)">' + esc(r.protein) + '</span></div>' +
          '<div class="note" style="margin-top:6px"><b>Ingredientes:</b> ' + r.ingredients.map((i) => esc(i.qty + " " + i.item.toLowerCase())).join(", ") + '.</div>' +
          '<div class="note" style="margin-top:4px">' + esc(r.prep) + '</div></div>';
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
    h += '<div style="height:16px"></div><button class="btn btn-primary" id="boughtBtn">✓ Marcar lista como comprada</button>';
    h += '<div style="height:10px"></div><button class="btn btn-ghost" id="superReset">Desmarcar todo</button>';
    w.innerHTML = h;
    qsa<HTMLElement>(".check", w).forEach((b) => { b.onclick = () => { const k = b.dataset.k!; DB.comidaCheck[k] = !DB.comidaCheck[k]; save(); renderComida("super"); }; });
    $("superReset").onclick = () => { DB.comidaCheck = {}; save(); renderComida("super"); };
    $("boughtBtn").onclick = () => openBuyGrocery(() => renderComida("super"));

  } else if (seg === "perfil") {
    renderPerfil(w);
  } else if (seg === "progreso") {
    renderProgreso(w);
  }
}

function renderPerfil(w: HTMLElement) {
  const p = DB.foodProfile!; const t = nutritionTargets(p); const st = T.streaks(); const cur = T.latestWeight();
  const tw = T.todayWeight();
  let h = '';
  // ---- Físico ----
  h += '<div class="stat-row"><div class="stat"><div class="n">' + cur + '</div><div class="l">Peso (kg)</div></div><div class="stat"><div class="n">' + T.imc(cur) + '</div><div class="l">IMC</div></div><div class="stat"><div class="n">' + (p.targetWeight || cur) + '</div><div class="l">Objetivo</div></div></div>';
  h += '<div class="stat-row" style="margin-top:10px"><div class="stat"><div class="n">' + t.kcal + '</div><div class="l">kcal/día</div></div><div class="stat"><div class="n">' + t.protein + 'g</div><div class="l">Proteína</div></div><div class="stat"><div class="n">' + p.waterTargetL + 'L</div><div class="l">Agua/día</div></div></div>';
  // ---- Rachas ----
  h += '<div class="sect">Rachas 🔥</div>';
  h += '<div class="stat-row"><div class="stat"><div class="n">' + st.plan + '</div><div class="l">Plan</div></div><div class="stat"><div class="n">' + st.comidas + '</div><div class="l">Comidas</div></div><div class="stat"><div class="n">' + st.peso + '</div><div class="l">Peso</div></div><div class="stat"><div class="n">' + st.agua + '</div><div class="l">Hidratación</div></div></div>';
  h += '<div class="note">Si dejas un día sin registrar, esa racha se reinicia. Registra abajo cada día.</div>';
  // ---- Registrar hoy ----
  h += '<div class="sect">Registrar hoy</div>';
  h += '<div class="field row2"><div><span class="label">Peso de hoy (kg)</span><input class="input mono" id="tk-weight" type="number" step="0.1" value="' + (tw ? tw.kg : "") + '" placeholder="' + cur + '"></div><div><span class="label">Agua de hoy (L)</span><input class="input mono" id="tk-water" type="number" step="0.25" value="' + (DB.waterLog?.[T.isoDay()] ?? "") + '"></div></div>';
  h += '<button class="btn btn-ghost" id="tk-save-day">Guardar registro de hoy</button>';
  h += '<div style="height:10px"></div><div class="pills"><button class="pill' + (DB.planLog?.[T.isoDay()] ? " sel" : "") + '" id="tk-plan">✓ Seguí el plan</button><button class="pill' + (DB.mealsLog?.[T.isoDay()] ? " sel" : "") + '" id="tk-meals">✓ Registré comidas</button></div>';
  // ---- Datos físicos editables ----
  h += '<div class="sect">Datos físicos</div>';
  h += '<div class="field row2"><div><span class="label">Estatura (cm)</span><input class="input mono" id="fp-h" type="number" value="' + p.height + '"></div><div><span class="label">Peso objetivo (kg)</span><input class="input mono" id="fp-tw" type="number" value="' + (p.targetWeight || "") + '"></div></div>';
  h += '<div class="field"><span class="label">Objetivo</span><div class="pills" id="fp-goal">' + [["recomp", "Recomposición"], ["muscle", "Músculo"], ["deficit", "Déficit"], ["maintain", "Mantener"]].map(([v, l]) => '<button class="pill' + (p.goal === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
  h += '<div class="field"><span class="label">Actividad física</span><div class="pills" id="fp-act">' + [["none", "Ninguna"], ["light", "Ligera"], ["moderate", "Moderada"], ["high", "Alta"]].map(([v, l]) => '<button class="pill' + (p.activity === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
  h += '<div class="field"><span class="label">Meta de agua (L/día)</span><input class="input mono" id="fp-water" type="number" step="0.5" value="' + p.waterTargetL + '"></div>';
  h += '<button class="btn btn-primary" id="fp-save">Guardar perfil</button>';
  // ---- Mediciones ----
  h += '<div class="sect">Medidas corporales (cm)</div>';
  h += '<div class="row2" style="display:flex;gap:12px;flex-wrap:wrap"><input class="input mono" id="ms-waist" type="number" placeholder="Cintura" style="flex:1;min-width:90px"><input class="input mono" id="ms-chest" type="number" placeholder="Pecho" style="flex:1;min-width:90px"><input class="input mono" id="ms-arm" type="number" placeholder="Brazo" style="flex:1;min-width:90px"></div>';
  h += '<div style="height:8px"></div><button class="btn btn-ghost" id="ms-add">+ Guardar medición</button>';
  const ms = (DB.measurements || []).slice(-4).reverse();
  if (ms.length) { h += '<div style="margin-top:8px">'; ms.forEach((m) => { h += '<div class="lrow"><span class="ld">' + m.date + '</span><span class="money">' + [m.waist && "C" + m.waist, m.chest && "P" + m.chest, m.arm && "B" + m.arm].filter(Boolean).join(" · ") + '</span></div>'; }); h += '</div>'; }
  // ---- Fotos ----
  h += '<div class="sect">Fotos de progreso</div>';
  h += '<input type="file" id="ph-file" accept="image/*" style="display:none"><button class="btn btn-ghost" id="ph-add">+ Agregar foto de hoy</button>';
  const photos = DB.bodyPhotos || [];
  if (photos.length) { h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">'; photos.forEach((ph, i) => { h += '<div style="position:relative"><img src="' + ph.img + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px"><button class="hx" data-ph="' + i + '" style="position:absolute;top:2px;right:4px;background:rgba(0,0,0,.5);color:#fff;border:0;border-radius:6px;cursor:pointer;font-size:14px;padding:0 6px">×</button><div class="note" style="margin:2px 0 0;text-align:center">' + ph.date.slice(5) + '</div></div>'; }); h += '</div>'; }
  w.innerHTML = h;

  // wiring
  $("tk-save-day").onclick = () => { const kg = +$<HTMLInputElement>("tk-weight").value; if (kg > 0) T.logWeight(kg); const wl = +$<HTMLInputElement>("tk-water").value; if (wl >= 0 && $<HTMLInputElement>("tk-water").value !== "") T.logWater(wl); renderComida("perfil"); };
  $("tk-plan").onclick = () => { T.setPlanFollowed(!(DB.planLog?.[T.isoDay()])); renderComida("perfil"); };
  $("tk-meals").onclick = () => { T.setMealsLogged(!(DB.mealsLog?.[T.isoDay()])); renderComida("perfil"); };
  pillGroup($("fp-goal"), (v) => (p.goal = v as any));
  pillGroup($("fp-act"), (v) => (p.activity = v as any));
  $("fp-save").onclick = () => { p.height = +$<HTMLInputElement>("fp-h").value || p.height; p.targetWeight = +$<HTMLInputElement>("fp-tw").value || p.targetWeight; p.waterTargetL = +$<HTMLInputElement>("fp-water").value || p.waterTargetL; save(); renderComida("perfil"); };
  $("ms-add").onclick = () => { const waist = +$<HTMLInputElement>("ms-waist").value || undefined, chest = +$<HTMLInputElement>("ms-chest").value || undefined, arm = +$<HTMLInputElement>("ms-arm").value || undefined; if (!waist && !chest && !arm) return; T.addMeasurement({ date: T.isoDay(), waist, chest, arm }); renderComida("perfil"); };
  $("ph-add").onclick = () => $("ph-file").click();
  $<HTMLInputElement>("ph-file").onchange = (e: any) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; downscalePhoto(f, (d) => { T.addPhoto(d); renderComida("perfil"); }); };
  qsa<HTMLElement>("[data-ph]", w).forEach((b) => (b.onclick = () => { if (confirm("¿Eliminar esta foto?")) { T.removePhoto(+b.dataset.ph!); renderComida("perfil"); } }));
}

function renderProgreso(w: HTMLElement) {
  const series = T.weightSeries(progGroup); const pg = T.progressToGoal();
  let h = '<div class="seg" id="proggrp"><button class="' + (progGroup === "week" ? "on" : "") + '" data-v="week">Por semana</button><button class="' + (progGroup === "month" ? "on" : "") + '" data-v="month">Por mes</button></div>';
  h += '<div class="sect">Evolución del peso</div><div class="card-pad">' + lineChart(series, { unit: "kg" }) + '</div>';
  h += '<div class="sect">Progreso hacia el objetivo</div>';
  h += '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><b style="font-weight:500">' + pg.start + ' kg → ' + pg.target + ' kg</b><span class="v">' + pg.pct + '%</span></div>' + progressBar(pg.pct) + '<div class="note">Actual: ' + pg.current + ' kg.</div></div></div>';
  const pc = T.planCompliance(30), wc = T.waterCompliance(30);
  h += '<div class="sect">Consistencia (últimos 30 días)</div>';
  h += '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><span>Cumplimiento del plan</span><span class="v">' + pc + '%</span></div>' + progressBar(pc) + '</div>';
  h += '<div class="arow"><div class="top"><span>Hidratación</span><span class="v">' + wc + '%</span></div>' + progressBar(wc) + '</div></div>';
  h += '<div class="note">Registra tu peso, agua y plan en la pestaña Perfil para alimentar estas gráficas.</div>';
  w.innerHTML = h;
  qsa<HTMLElement>("#proggrp button", w).forEach((b) => { b.onclick = () => { progGroup = b.dataset.v as any; renderComida("progreso"); }; });
}

export function initComida() {
  useSegment("comidaseg", "plan", (v) => { comidaSeg = v; renderComida(v); });
}
