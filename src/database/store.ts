/**
 * database/store.ts — estado central (DB), persistencia local y migraciones.
 * Conserva la clave 'misem_v2' para no perder datos existentes.
 */
import type { AppState } from "../types";
import { STORAGE_KEY } from "../config/app";
import { seed } from "./seed";
import { MATS } from "./academic-data";

const LS = window.localStorage;

function dk(d: Date) { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), da = String(d.getDate()).padStart(2, "0"); return y + "-" + m + "-" + da; }

function loadRaw(): AppState | null {
  try { return JSON.parse(LS.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}

/** Estado global mutable. Los módulos lo importan y lo mutan; save() persiste. */
export let DB: AppState = loadRaw() as AppState;

if (!DB) {
  DB = structuredClone(seed) as AppState;
  const t = new Date();
  for (let i = 1; i <= 4; i++) { const d = new Date(t); d.setDate(t.getDate() - i); DB.history[dk(d)] = true; }
  persist();
}

migrate();

/** Asegura que existan todas las colecciones (datos viejos compatibles). */
function migrate() {
  (["mat", "matProg", "schedEdit", "habitLog", "history", "comidaCheck"] as const)
    .forEach((k) => { (DB as any)[k] = (DB as any)[k] || {}; });
  DB.habits = DB.habits || []; DB.cards = DB.cards || []; DB.tx = DB.tx || [];
  DB.habitSeq = DB.habitSeq || 1; DB.cardSeq = DB.cardSeq || 1; DB.txSeq = DB.txSeq || 1;
  DB.accounts = DB.accounts || [{ id: 1, name: "Efectivo", bank: "", type: "efectivo", balance: 0 }];
  DB.accountSeq = DB.accountSeq || (DB.accounts.length + 1);
  DB.cards.forEach((c) => {
    if (c.bank === undefined) c.bank = "";
    if (c.cut === undefined) c.cut = "";
    if (c.active === undefined) c.active = true;
    if (c.color === undefined) c.color = "";
    if (c.payments === undefined) c.payments = [];
  });
  DB.subs = DB.subs || []; DB.subSeq = DB.subSeq || 1;
  DB.goals = DB.goals || []; DB.goalSeq = DB.goalSeq || 1;
  DB.cur = DB.cur || "MXN";
  // ---- MealPrep ----
  if (!DB.foodProfile) DB.foodProfile = { height: 178, weight: 67, activity: "none", goal: "recomp", waterTargetL: 3 };
  if (DB.foodProfile.targetWeight == null) DB.foodProfile.targetWeight = 70;
  DB.mealPlan = DB.mealPlan || {};
  DB.mealPlanType = DB.mealPlanType || "variado";
  DB.weightLog = DB.weightLog || [];
  DB.measurements = DB.measurements || [];
  DB.bodyPhotos = DB.bodyPhotos || [];
  DB.waterLog = DB.waterLog || {};
  DB.activityLog = DB.activityLog || {};
  DB.planLog = DB.planLog || {};
  DB.mealsLog = DB.mealsLog || {};
  DB.pantry = DB.pantry || [];
  DB.pantrySeq = DB.pantrySeq || 1;
  DB.reminders = DB.reminders || { enabled: false, desayuno: "07:00", comida: "14:00", cena: "21:00", groceryDay: 0, gym: "", bano: "22:20", dormir: "22:45" };
  if (DB.reminders.bano == null) DB.reminders.bano = "22:20";
  if (DB.reminders.dormir == null) DB.reminders.dormir = "22:45";
  if (DB.reminders.gym == null) DB.reminders.gym = "";
  DB.review = DB.review || {};
  DB.finPins = DB.finPins || [];
  DB.finHidden = DB.finHidden || [];
  DB.finOrder = DB.finOrder || [];
  DB.mealState = DB.mealState || {};
  if (!DB.supplements) DB.supplements = [
    { id: 1, name: "Creatina", brand: "Birdman", dose: "5 g", time: "Cualquier hora", days: "Diario", stock: 0, reminder: true, notes: "" },
    { id: 2, name: "Proteína Whey", brand: "", dose: "1 scoop", time: "Mañana / post-entreno", days: "Diario", stock: 0, reminder: false, notes: "" },
    { id: 3, name: "Omega-3", brand: "", dose: "1 cápsula", time: "Con una comida", days: "Diario", stock: 0, reminder: false, notes: "" },
    { id: 4, name: "Magnesio", brand: "", dose: "1 cápsula", time: "Noche", days: "Diario", stock: 0, reminder: true, notes: "" },
  ];
  DB.supplementSeq = DB.supplementSeq || (DB.supplements.reduce((m, x) => Math.max(m, x.id), 0) + 1);
  DB.supplementLog = DB.supplementLog || {};
  if (!DB.courses) DB.courses = MATS.map((m, i) => ({ id: i + 1, name: m[0], target: 90, credits: 8, evals: [] }));
  DB.courseSeq = DB.courseSeq || (DB.courses.reduce((mx, c) => Math.max(mx, c.id), 0) + 1);
  DB.evalSeq = DB.evalSeq || 1;
  if (!DB.timetable) DB.timetable = ["7:00", "9:00", "11:00", "13:00", "16:00", "18:00"].map((t) => ({ time: t, cells: [null, null, null, null, null, null, null] }));
  // migrar formato viejo (celdas string / 5 días) a objetos de 7 días
  DB.timetable.forEach((r: any) => {
    r.cells = (r.cells || []).map((c: any) => (c == null || c === "") ? null : (typeof c === "string" ? { text: c } : c));
    while (r.cells.length < 7) r.cells.push(null);
    if (r.cells.length > 7) r.cells = r.cells.slice(0, 7);
  });

  // ---- migraciones versionadas (ordenadas por esquema) ----
  DB.schemaVersion = DB.schemaVersion || 1;
  if (DB.schemaVersion < 2) {
    // v2: claves de 'history' unificadas a YYYY-MM-DD local (antes: toDateString)
    const oldH: Record<string, boolean> = (DB.history as any) || {}, nh: Record<string, boolean> = {};
    Object.keys(oldH).forEach((k) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) { nh[k] = oldH[k]; return; }
      const d = new Date(k); nh[isNaN(+d) ? k : dk(d)] = oldH[k];
    });
    DB.history = nh;
    DB.schemaVersion = 2;
  }
}

export function persist() { LS.setItem(STORAGE_KEY, JSON.stringify(DB)); }

/** Hook de sincronización en la nube (lo conecta services/sync). */
let syncHook: (() => void) | null = null;
export function onSave(fn: () => void) { syncHook = fn; }

/** Estado de guardado/sincronización visible en la barra superior. */
let statusHook: ((s: string) => void) | null = null;
export function onStatus(fn: (s: string) => void) { statusHook = fn; }
export function setSyncStatus(s: string) { if (statusHook) statusHook(s); }

/** Guarda local y dispara sync nube. Único punto de escritura. */
export function save() { DB.updatedAt = Date.now(); persist(); setSyncStatus("Guardado"); if (syncHook) syncHook(); }

/** Hook para re-render cuando llegan datos de la nube (sin recargar la página). */
let replaceHook: (() => void) | null = null;
export function onReplace(fn: () => void) { replaceHook = fn; }
/** Reemplaza el estado en memoria con datos de la nube y re-renderiza. */
export function setDB(data: AppState) { DB = data; migrate(); persist(); if (replaceHook) replaceHook(); }

export { dk, STORAGE_KEY };
