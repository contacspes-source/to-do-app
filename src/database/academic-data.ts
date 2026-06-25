/**
 * database/academic-data.ts — datos de referencia del plan académico ICOM.
 */
export const MATS: string[][] = [
  ["Arquitectura de Computadoras", "Base de Redes", "Redes"],
  ["Análisis de Algoritmos", "Base de IA", "IA"],
  ["Ingeniería de Software", "Proyecto fuerte", "Tronco"],
  ["Administración de Redes", "Tu área", "Redes"],
  ["Innovación Tecnológica", "Colchón (barco)", "Tronco"],
];

export const AREAS: [string, number, number][] = [
  ["Formación básica común", 134, 146],
  ["Básico particular oblig.", 61, 101],
  ["Especializante oblig.", 30, 99],
  ["Especializante selectiva", 0, 24],
  ["Optativa abierta", 0, 24],
];

export const DAYL = ["L", "M", "M", "J", "V", "S", "D"];

export interface ScenDay { d: string; b: [string, string][]; }
export interface Scenario { p: string; g: ScenDay[]; }

export const SCEN: Record<string, Scenario> = {
  normal: { p: "Plan completo. Carga fuerte de lunes a miércoles; el finde solo mantenimiento ligero.", g: [
    { d: "Lun–Mié", b: [["5:45", "Despertar + preparación"], ["6:20", "Traslado a campus"], ["7:00", "Clases"], ["13:00", "Comida"], ["14:00", "Tareas y estudio (2h)"], ["16:30", "Gimnasio (1h)"], ["18:00", "Inglés C1 (1h)"], ["19:15", "Portugués o Francés (1h)"], ["20:30", "Proyecto personal (1.5h)"], ["22:00", "Tiempo libre"], ["22:20", "Rutina de baño"], ["22:40", "Dormir"]] },
    { d: "Jueves", b: [["5:45", "Despertar + preparación"], ["7:00", "Clases"], ["13:00", "Comida"], ["14:00", "Estudio ligero (1h)"], ["16:00", "Traslado a Zamora (3h) — idioma pasivo"], ["19:30", "Llegada, cena, descanso"], ["22:20", "Baño / dormir"]] },
    { d: "Vie–Sáb", b: [["7:30", "Despertar + preparación"], ["9:00", "Proyecto personal (1.5h)"], ["11:00", "Inglés C1 + idioma ligero"], ["13:00", "Comida"], ["15:00", "Negocio familiar (5h)"], ["20:30", "Gimnasio o descanso"], ["22:20", "Baño / dormir"]] },
    { d: "Domingo", b: [["8:00", "Despertar + preparación"], ["9:00", "Negocio familiar (5h)"], ["14:00", "Comida"], ["15:30", "Traslado a GDL (3h)"], ["19:00", "Revisión semanal + preparar la semana"], ["20:00", "Tiempo libre / recarga"], ["22:20", "Baño / dormir"]] },
  ]},
  superv: { p: "Regla: nunca recortes sueño ni faltes a clase. Todo lo electivo se encoge — sin culpa.", g: [
    { d: "Lun–Mié", b: [["—", "Clases (fijo)"], ["—", "Solo lo que se entrega mañana (1–1.5h)"], ["—", "Inglés pasivo 15 min"], ["—", "Caminar 20 min"], ["—", "Dormir 7h — innegociable"]] },
    { d: "Jueves", b: [["—", "Clases + traslado a Zamora"], ["—", "Cero pendientes nuevos · descansar"]] },
    { d: "Vie–Sáb", b: [["—", "Negocio familiar (5h)"], ["—", "Idiomas en pausa · dormir bien"]] },
    { d: "Domingo", b: [["—", "Negocio + traslado a GDL"], ["—", "Una sola cosa: revisar entregas"]] },
  ]},
  examen: { p: "Protege el sueño, pausa los idiomas nuevos y estudia espaciado (no cramming).", g: [
    { d: "Lun–Mié", b: [["7:00", "Clases"], ["14:00", "Estudio profundo 3h (Pomodoro 25/5)"], ["17:30", "Repaso activo (1h)"], ["18:45", "Gimnasio corto 30–40 min"], ["19:45", "Inglés pasivo 20 min"], ["20:30", "Francés / Portugués — en pausa"], ["22:40", "Dormir 7h"]] },
    { d: "Jueves", b: [["—", "Examen / estudio"], ["16:00", "Traslado a Zamora — repasar"]] },
    { d: "Vie–Sáb", b: [["9:00", "Estudio en bloque (2h)"], ["15:00", "Negocio familiar (5h)"]] },
    { d: "Domingo", b: [["9:00", "Negocio familiar (5h)"], ["15:30", "Traslado a GDL + simulacro (1h)"]] },
  ]},
};
