/**
 * services/reminders.ts — recordatorios de comidas y de compras.
 * Sin servidor: muestra avisos cuando abres la app y, si das permiso, lanza
 * notificaciones del navegador mientras la pestaña está abierta.
 * (Notificaciones en segundo plano requerirían push + service worker, a futuro.)
 */
import { DB } from "../database/store";

const DAYNAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function hm(d = new Date()) { return d.getHours() * 60 + d.getMinutes(); }
function toMin(t?: string) { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); }

/** Avisos relevantes ahora mismo (para banner al abrir). */
export function dueBanners(): string[] {
  const r = DB.reminders; if (!r || !r.enabled) return [];
  const out: string[] = []; const now = hm();
  ([["desayuno", "tu desayuno"], ["comida", "tu comida"], ["cena", "tu cena"]] as const).forEach(([k, label]) => {
    const t = toMin((r as any)[k]); if (t != null && now >= t && now <= t + 90) out.push("Es hora de " + label);
  });
  if (r.groceryDay != null && new Date().getDay() === r.groceryDay) out.push("Hoy (" + DAYNAMES[r.groceryDay] + ") es tu día de súper. Revisa la lista.");
  return out;
}

export function requestNotifPermission(): Promise<string> {
  if (!("Notification" in window)) return Promise.resolve("unsupported");
  return Notification.requestPermission();
}

let watcher: any = null;
/** Revisa cada minuto y notifica al dar la hora exacta de una comida (app abierta). */
export function startReminderWatcher() {
  if (watcher) clearInterval(watcher);
  let lastFired = "";
  watcher = setInterval(() => {
    const r = DB.reminders; if (!r || !r.enabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const now = hm(); const key = new Date().toDateString();
    ([["desayuno", "desayuno"], ["comida", "comida"], ["cena", "cena"]] as const).forEach(([k, label]) => {
      const t = toMin((r as any)[k]); const tag = key + k;
      if (t === now && lastFired !== tag) { lastFired = tag; try { new Notification("Mi semestre · MealPrep", { body: "Es hora de tu " + label }); } catch {} }
    });
  }, 60000);
}
