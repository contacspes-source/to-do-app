/**
 * pages/comida.ts — MealPrep: asistente de alimentación.
 * Pestañas: Plan (semana), Recetas (banco), Súper (lista inteligente +
 * integración con Finanzas), Perfil (datos físicos y metas) y Guía.
 */
import { DB, save } from "../database/store";
import { $, qsa, pillGroup } from "../utils/dom";
import { esc } from "../utils/format";
import { RECIPES, recipesByMeal, recipeById, FREE_FOODS, MEAL_LABELS, type MealSlot } from "../database/recipes";
import { getPlan, generatePlan, setPlanSlot, recipesForDay, groceryList, nutritionTargets, WEEK_DAYS } from "../services/mealplan";
import { openBuyGrocery } from "../components/modals";
import { useSegment } from "../hooks/useSegment";

let comidaSeg = "plan";
const SLOTS: MealSlot[] = ["desayuno", "colacion", "comida", "cena"];

export function renderComida(seg = comidaSeg) {
  comidaSeg = seg; const w = $("comidaBody"); if (!w) return; w.innerHTML = "";

  if (seg === "plan") {
    getPlan();
    let h = '<div class="note" style="margin-top:0">Plan variado de la semana, inspirado en el menú de tu nutrióloga y adaptado a tus gustos (sin jitomate; con brócoli, zanahoria, pepino, lechuga, pasta boloñesa, smoothies y overnight oats). Toca una comida para cambiarla.</div>';
    h += '<div style="height:10px"></div><button class="btn btn-ghost" id="regenPlan">↻ Regenerar plan de la semana</button>';
    WEEK_DAYS.forEach((dname, day) => {
      h += '<div class="sect">' + dname + '</div>';
      recipesForDay(day).forEach(({ slot, recipe }) => {
        const opts = recipesByMeal(slot).map((r) => '<option value="' + r.id + '"' + (recipe && r.id === recipe.id ? " selected" : "") + '>' + esc(r.name) + '</option>').join("");
        h += '<div class="card-pad" style="margin-bottom:8px"><div class="top" style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b style="font-weight:600;font-size:13px">' + MEAL_LABELS[slot] + '</b><span class="v" style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3)">' + (recipe ? esc(recipe.protein) : "") + '</span></div>' +
          '<select class="input mono" data-day="' + day + '" data-slot="' + slot + '" style="margin-top:8px">' + opts + '</select></div>';
      });
    });
    w.innerHTML = h;
    $("regenPlan").onclick = () => { generatePlan(); renderComida("plan"); };
    qsa<HTMLSelectElement>("select[data-slot]", w).forEach((sel) => { sel.onchange = () => { setPlanSlot(+sel.dataset.day!, sel.dataset.slot as MealSlot, sel.value); renderComida("plan"); }; });

  } else if (seg === "recetas") {
    let h = '<div class="note" style="margin-top:0">Banco de recetas fáciles, económicas y aptas para meal prep. ' + RECIPES.length + ' opciones y creciendo.</div>';
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
    const groups = groceryList();
    let bought = 0, totalItems = 0;
    groups.forEach((g) => g.items.forEach((it) => { totalItems++; if (DB.comidaCheck[g.cat + ":" + it.item]) bought++; }));
    let h = '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Lista del súper · semana actual</div><div style="font-weight:600;font-size:18px;margin-top:6px">' + bought + ' / ' + totalItems + ' marcados</div></div>';
    h += '<div class="note" style="margin-top:0">Se genera automáticamente desde tu plan, agrupada por categoría. Marca lo que ya tengas en casa.</div>';
    groups.forEach((g) => {
      h += '<div class="sect">' + g.cat + '</div>';
      g.items.forEach((it) => {
        const key = g.cat + ":" + it.item; const on = DB.comidaCheck[key];
        h += '<div class="task' + (on ? " done" : "") + '"><button class="check" data-k="' + esc(key) + '" aria-label="Ya lo tengo"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 5"/></svg></button><div class="body"><span class="ttl">' + esc(it.item) + (it.count > 1 ? ' <span style="color:var(--ink-3)">×' + it.count + '</span>' : '') + '</span></div></div>';
      });
    });
    if (!totalItems) h += '<div class="note">Genera tu plan en la pestaña Plan para crear la lista.</div>';
    h += '<div style="height:16px"></div><button class="btn btn-primary" id="boughtBtn">✓ Marcar lista como comprada</button>';
    h += '<div style="height:10px"></div><button class="btn btn-ghost" id="superReset">Desmarcar todo</button>';
    w.innerHTML = h;
    qsa<HTMLElement>(".check", w).forEach((b) => { b.onclick = () => { const k = b.dataset.k!; DB.comidaCheck[k] = !DB.comidaCheck[k]; save(); renderComida("super"); }; });
    $("superReset").onclick = () => { DB.comidaCheck = {}; save(); renderComida("super"); };
    // Integración con Finanzas: al comprar, ofrecer registrar el gasto
    $("boughtBtn").onclick = () => { openBuyGrocery(() => renderComida("super")); };

  } else if (seg === "perfil") {
    const p = DB.foodProfile!; const t = nutritionTargets(p);
    let h = '<div class="note" style="margin-top:0">Tu perfil ajusta las metas. Se recalcula solo si cambias peso o actividad (listo para integrar macros y seguimiento a futuro).</div>';
    h += '<div class="stat-row" style="margin-top:14px"><div class="stat"><div class="n">' + t.kcal + '</div><div class="l">kcal/día aprox</div></div><div class="stat"><div class="n">' + t.protein + 'g</div><div class="l">Proteína</div></div><div class="stat"><div class="n">' + t.imc + '</div><div class="l">IMC</div></div></div>';
    h += '<div class="sect">Datos físicos</div>';
    h += '<div class="field row2"><div><span class="label">Estatura (cm)</span><input class="input mono" id="fp-h" type="number" value="' + p.height + '"></div><div><span class="label">Peso (kg)</span><input class="input mono" id="fp-w" type="number" value="' + p.weight + '"></div></div>';
    h += '<div class="field"><span class="label">Actividad física</span><div class="pills" id="fp-act">' + [["none", "Ninguna"], ["light", "Ligera"], ["moderate", "Moderada"], ["high", "Alta"]].map(([v, l]) => '<button class="pill' + (p.activity === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
    h += '<div class="field"><span class="label">Objetivo</span><div class="pills" id="fp-goal">' + [["recomp", "Recomposición"], ["muscle", "Músculo"], ["deficit", "Déficit"], ["maintain", "Mantener"]].map(([v, l]) => '<button class="pill' + (p.goal === v ? " sel" : "") + '" data-v="' + v + '">' + l + '</button>').join("") + '</div></div>';
    h += '<div class="field"><span class="label">Meta de agua (L/día)</span><input class="input mono" id="fp-water" type="number" step="0.5" value="' + p.waterTargetL + '"></div>';
    h += '<button class="btn btn-primary" id="fp-save">Guardar perfil</button>';
    w.innerHTML = h;
    pillGroup($("fp-act"), (v) => (p.activity = v as any));
    pillGroup($("fp-goal"), (v) => (p.goal = v as any));
    $("fp-save").onclick = () => { p.height = +$<HTMLInputElement>("fp-h").value || p.height; p.weight = +$<HTMLInputElement>("fp-w").value || p.weight; p.waterTargetL = +$<HTMLInputElement>("fp-water").value || p.waterTargetL; save(); renderComida("perfil"); };

  } else if (seg === "guia") {
    const p = DB.foodProfile!;
    let h = '<div class="card-pad" style="margin-top:0"><b style="font-weight:600">Filosofía del plan</b><div class="note" style="margin-top:6px">Inspirado en el plan de la Nutrióloga Michelle Guadarrama: alta proteína, mucha verdura, porciones medidas y desayunos tipo overnight oats / smoothies. Aquí con más variedad y a tu gusto.</div></div>';
    h += '<div class="card-pad"><b style="font-weight:600">Tus preferencias</b><div class="note" style="margin-top:6px">Evitamos el jitomate como ingrediente principal. Priorizamos brócoli, zanahoria, pepino, lechuga, pasta boloñesa, smoothies y avenas trasnochadas.</div></div>';
    h += '<div class="card-pad"><b style="font-weight:600">Agua e hidratación</b><div class="note" style="margin-top:6px">Meta: ' + p.waterTargetL + ' L al día. Ten una botella a la vista — es el recordatorio más efectivo.</div></div>';
    h += '<div class="sect">Alimentos libres</div><div class="card-pad"><div class="note" style="margin-top:0">' + FREE_FOODS.map((f) => "· " + esc(f)).join("<br>") + '</div></div>';
    h += '<div class="card-pad"><b style="font-weight:600">Truco TDAH</b><div class="note" style="margin-top:6px">Comida ya decidida = una decisión menos. El plan y la lista del súper evitan saltarte comidas y la comida rápida por impulso.</div></div>';
    h += '<div class="note">Orientación general, no sustituye a tu nutrióloga. Para números exactos, ajústalo con ella.</div>';
    w.innerHTML = h;
  }
}

export function initComida() {
  useSegment("comidaseg", "plan", (v) => { comidaSeg = v; renderComida(v); });
}
