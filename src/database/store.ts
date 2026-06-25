/**
 * database/store.ts — estado central (DB), persistencia local y migraciones.
 * Conserva la clave 'misem_v2' para no perder datos existentes.
 */
import type { AppState } from "../types";
import { STORAGE_KEY } from "../config/app";
import { seed } from "./seed";

const LS = window.localStorage;

function dk(d: Date) { return d.toDateString(); }

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
  });
  DB.subs = DB.subs || []; DB.subSeq = DB.subSeq || 1;
  DB.goals = DB.goals || []; DB.goalSeq = DB.goalSeq || 1;
  DB.cur = DB.cur || "MXN";
  // ---- MealPrep ----
  if (!DB.foodProfile) DB.foodProfile = { height: 178, weight: 67, activity: "none", goal: "recomp", waterTargetL: 3 };
  DB.mealPlan = DB.mealPlan || {};
}

export function persist() { LS.setItem(STORAGE_KEY, JSON.stringify(DB)); }

/** Hook de sincronización en la nube (lo conecta services/sync). */
let syncHook: (() => void) | null = null;
export function onSave(fn: () => void) { syncHook = fn; }

/** Guarda local y dispara sync nube. Único punto de escritura. */
export function save() { persist(); if (syncHook) syncHook(); }

export { dk, STORAGE_KEY };
