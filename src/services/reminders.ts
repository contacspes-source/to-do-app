/**
 * services/reminders.ts — recordatorios de comidas, súper y RUTINA (TDAH).
 * Sin servidor: muestra avisos al abrir la app y, con permiso, lanza
 * notificaciones del navegador mientras la app está abierta (o instalada, PWA).
 * (Avisos con la app totalmente cerrada requerirían web-push, a futuro.)
 */
import { DB } from "../database/store";
import { isoDay } from "./tracking";

const DAYNAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function hm(d = new Date()) { return d.getHours() * 60 + d.getMinutes(); }
function toMin(t?: string) { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); }

/** Recordatorios por hora: comidas + rutina. window = minutos que sigue vigente el aviso. */
const ITEMS: { key: string; banner: string; notif: string; window: number }[] = [
  { key: "desayuno", banner: "Es hora de tu desayuno", notif: "Es hora de tu desayuno", window: 90 },
  { key: "comida", banner: "Es hora de tu comida", notif: "Es hora de tu comida", window: 90 },
  { key: "cena", banner: "Es hora de tu cena", notif: "Es hora de tu cena", window: 90 },
  { key: "gym", banner: "Toca ir al gym", notif: "Hora del gym 💪 (45–60 min)", window: 120 },
  { key: "bano", banner: "Empieza tu rutina de baño", notif: "Rutina de baño (22:20–22:40)", window: 25 },
  { key: "dormir", banner: "Hora de dormir — apaga pantallas", notif: "Hora de dormir. Descansa bien 😴", window: 45 },
];

/** Avisos relevantes ahora mismo (para banner al abrir). */
export function dueBanners(): string[] {
  const r = DB.reminders; if (!r || !r.enabled) return [];
  const out: string[] = []; const now = hm();
  ITEMS.forEach((it) => { const t = toMin((r as any)[it.key]); if (t != null && now >= t && now <= t + it.window) out.push(it.banner); });
  if (r.groceryDay != null && new Date().getDay() === r.groceryDay) out.push("Hoy (" + DAYNAMES[r.groceryDay] + ") es tu día de súper. Revisa la lista.");
  const day = isoDay(); const log = DB.supplementLog || {};
  (DB.supplements || []).forEach((sp) => { if (sp.reminder && !log[day + "-" + sp.id]) out.push("Toma tu " + sp.name); });
  return out;
}

export function requestNotifPermission(): Promise<string> {
  if (!("Notification" in window)) return Promise.resolve("unsupported");
  return Notification.requestPermission();
}

let watcher: any = null;
/** Revisa cada minuto y notifica al dar la hora exacta (app abierta / PWA). */
export function startReminderWatcher() {
  if (watcher) clearInterval(watcher);
  let lastFired = "";
  watcher = setInterval(() => {
    const r = DB.reminders; if (!r || !r.enabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const now = hm(); const key = new Date().toDateString();
    ITEMS.forEach((it) => {
      const t = toMin((r as any)[it.key]); const tag = key + it.key;
      if (t === now && lastFired !== tag) { lastFired = tag; try { new Notification("Mi semestre", { body: it.notif }); } catch {} }
    });
  }, 60000);
}
