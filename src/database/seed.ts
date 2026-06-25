/**
 * database/seed.ts — datos de ejemplo para el primer arranque.
 */
import type { AppState } from "../types";

export const seed: AppState = {
  theme: "light", cur: "MXN", seq: 7,
  tasks: [
    { id: 1, title: "Verificar oferta de Admin. de Redes en SIIAU", list: "Personal", prio: "alta", time: "09:00", notes: "Confirmar Módulo 1 (Redes) abierto para 2026-B. Prereq cumplido.", done: false, featured: true, rem: true, subs: [{ t: "Entrar a SIIAU", d: true }, { t: "Revisar oferta 2026-B", d: false }, { t: "Anotar NRC y horario", d: false }] },
    { id: 2, title: "Inglés C1 — sesión de hoy", list: "Personal", prio: "media", time: "18:00", notes: "1h, práctica activa.", done: false, featured: false, rem: false, subs: [] },
    { id: 3, title: "Avanzar el proyecto personal", list: "Personal", prio: "media", time: "20:30", notes: "Bloque de 1.5h.", done: false, featured: false, rem: false, subs: [{ t: "Definir la tarea de hoy", d: false }] },
    { id: 4, title: "Revisar reseñas de profesores (SIAPP)", list: "Trabajo", prio: "baja", time: "", notes: "Elegir grupos.", done: false, featured: false, rem: false, subs: [] },
    { id: 5, title: "Confirmar que las 5 materias se ofertan", list: "Trabajo", prio: "media", time: "", notes: "", done: false, featured: false, rem: false, subs: [] },
    { id: 6, title: "Preparar mochila para mañana", list: "Casa", prio: "baja", time: "22:00", notes: "", done: true, featured: false, rem: false, subs: [] },
  ],
  mat: {}, matProg: { 0: 20, 1: 15, 2: 10, 3: 5, 4: 30 }, schedEdit: {},
  habits: [
    { id: 1, n: "Inglés C1", g: "1h/día" }, { id: 2, n: "Portugués", g: "≈3h/sem" },
    { id: 3, n: "Francés", g: "≈2h/sem" }, { id: 4, n: "Gimnasio", g: "45–60 min" },
    { id: 5, n: "Proyecto personal", g: "1–2h/día" },
  ], habitSeq: 6, habitLog: {},
  history: {}, cards: [], cardSeq: 1, tx: [], txSeq: 1,
  accounts: [{ id: 1, name: "Efectivo", bank: "", type: "efectivo", balance: 0 }], accountSeq: 2,
  subs: [], subSeq: 1, goals: [], goalSeq: 1,
  comidaCheck: {},
  foodProfile: { height: 178, weight: 67, activity: "none", goal: "recomp", waterTargetL: 3 },
  mealPlan: {},
};
