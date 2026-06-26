/**
 * pages/ajustes.ts — preferencias: cuenta, finanzas, apariencia, datos, sistema.
 */
import { DB, save, STORAGE_KEY } from "../database/store";
import { $, qsa, pillGroup, resetPills } from "../utils/dom";
import { updatePassword, hasAuth } from "../services/sync";
import { requestNotifPermission } from "../services/reminders";
import { renderHoy, setHoyMode } from "./hoy";

const ACCENTS = ["#2563eb", "#7c3aed", "#db2777", "#059669", "#ea580c", "#0891b2", "#161616"];

function applyAccent() { if (DB.accent) document.body.style.setProperty("--accent", DB.accent); else document.body.style.removeProperty("--accent"); }
function buildAccent() {
  const w = $("set-accent"); if (!w) return; w.innerHTML = "";
  const def = document.createElement("button"); def.className = "pill" + (!DB.accent ? " sel" : ""); def.textContent = "Tema"; def.onclick = () => { DB.accent = ""; applyAccent(); save(); buildAccent(); }; w.appendChild(def);
  ACCENTS.forEach((col) => { const b = document.createElement("button"); b.className = "pill"; b.style.cssText = "width:38px;padding:6px;border-color:" + (DB.accent === col ? "var(--ink-1)" : "var(--hair)"); b.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' + col + '"></span>'; b.onclick = () => { DB.accent = col; applyAccent(); save(); buildAccent(); }; w.appendChild(b); });
}

export function renderAjustes() {
  const n = Object.keys(DB.mat).filter((k) => DB.mat[k]).length;
  $("setMat").textContent = n + " de 5";
  $("themeState").textContent = DB.theme === "dark" ? "Oscuro" : "Claro";
  $("th-dark").classList.toggle("on", DB.theme === "dark");
  $("th-light").classList.toggle("on", DB.theme === "light");
  $<HTMLInputElement>("set-name").value = DB.name || "";
  resetPills("set-cur", DB.cur || "MXN"); buildAccent();
  const r = DB.reminders || {};
  $("rem-enabled").classList.toggle("on", !!r.enabled);
  ($("rem-desayuno") as HTMLInputElement).value = r.desayuno || "";
  ($("rem-comida") as HTMLInputElement).value = r.comida || "";
  ($("rem-cena") as HTMLInputElement).value = r.cena || "";
  ($("rem-gday") as HTMLSelectElement).value = String(r.groceryDay ?? 0);
}

export function initAjustes() {
  qsa<HTMLElement>("#ajustes .acc-h").forEach((b) => (b.onclick = () => b.parentElement!.classList.toggle("open")));
  pillGroup($("set-cur"), (v) => { DB.cur = v; save(); });
  $("set-name-save").onclick = () => { DB.name = $<HTMLInputElement>("set-name").value.trim(); save(); setHoyMode("hoy"); renderHoy(); };
  $("set-pass-save").onclick = () => {
    const p = $<HTMLInputElement>("set-newpass").value, m = $("set-pass-msg"); m.style.display = "block"; m.style.color = "var(--ink-3)";
    if (!hasAuth()) { m.textContent = "Inicia sesión primero para cambiar tu contraseña."; return; }
    if (!p || p.length < 6) { m.textContent = "La contraseña debe tener 6+ caracteres."; return; }
    m.textContent = "Cambiando…";
    updatePassword(p).then((r) => { m.style.color = r.error ? "var(--warn)" : "var(--ink-1)"; m.textContent = r.error ? "Error: " + r.error.message : "Contraseña actualizada."; if (!r.error) $<HTMLInputElement>("set-newpass").value = ""; });
  };
  // recordatorios
  $("rem-enabled").onclick = () => { DB.reminders = DB.reminders || {}; DB.reminders.enabled = !DB.reminders.enabled; save(); renderAjustes(); };
  $("rem-save").onclick = () => { DB.reminders = DB.reminders || {}; DB.reminders.desayuno = ($("rem-desayuno") as HTMLInputElement).value; DB.reminders.comida = ($("rem-comida") as HTMLInputElement).value; DB.reminders.cena = ($("rem-cena") as HTMLInputElement).value; DB.reminders.groceryDay = +($("rem-gday") as HTMLSelectElement).value; save(); const m = $("rem-msg"); m.textContent = "Recordatorios guardados."; m.style.color = "var(--ink-1)"; };
  $("rem-notif").onclick = () => { requestNotifPermission().then((p) => { const m = $("rem-msg"); m.style.color = "var(--ink-1)"; m.textContent = p === "granted" ? "Notificaciones activadas (mientras la app está abierta)." : "Permiso: " + p + "."; }); };
  $("resetHab").onclick = () => { if (confirm("¿Reiniciar los hábitos de la semana?")) { DB.habitLog = {}; save(); } };
  $("resetAll").onclick = () => { if (confirm("¿Restablecer todo a los datos de ejemplo? Se borra tu progreso.")) { localStorage.removeItem(STORAGE_KEY); location.reload(); } };
  initDataIO();
}

/* exportar / importar */
function ioMessage(txt: string, ok: boolean) { const m = $("ioMsg"); if (!m) return; m.style.display = "block"; m.textContent = txt; m.style.color = ok ? "var(--ink-1)" : "var(--warn)"; }
function validData(d: any) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  if (!Array.isArray(d.tasks)) return false;
  const objKeys = ["mat", "matProg", "schedEdit", "habitLog", "history"];
  for (const k of objKeys) if (d[k] !== undefined && (typeof d[k] !== "object" || d[k] === null)) return false;
  for (const k of ["habits", "cards", "tx", "accounts", "subs", "goals"]) if (d[k] !== undefined && !Array.isArray(d[k])) return false;
  return true;
}
function initDataIO() {
  $("exportData").onclick = () => {
    try {
      const payload = { app: "misem", key: STORAGE_KEY, version: 4, exportedAt: new Date().toISOString(), data: DB };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = "mi-semestre-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      ioMessage("Datos exportados correctamente.", true);
    } catch (e: any) { ioMessage("No se pudo exportar: " + e.message, false); }
  };
  $("importBtn").onclick = () => $("importFile").click();
  $<HTMLInputElement>("importFile").onchange = (e: any) => {
    const file = e.target.files && e.target.files[0]; e.target.value = ""; if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => ioMessage("No se pudo leer el archivo.", false);
    reader.onload = (ev: any) => {
      let parsed; try { parsed = JSON.parse(ev.target.result); } catch { ioMessage("Archivo inválido: no es un JSON legible.", false); return; }
      const incoming = parsed && parsed.data !== undefined ? parsed.data : parsed;
      if (!validData(incoming)) { ioMessage("El archivo no tiene el formato de Mi semestre. No se cambió nada.", false); return; }
      if (!confirm("Esto reemplazará tus datos actuales con los del archivo. ¿Continuar?")) return;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming)); ioMessage("Datos importados. Recargando…", true); setTimeout(() => location.reload(), 600); }
      catch (err2: any) { ioMessage("No se pudo guardar la importación: " + err2.message, false); }
    };
    reader.readAsText(file);
  };
}
