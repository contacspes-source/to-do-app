/**
 * services/sync.ts — autenticación y sincronización en la nube (Supabase).
 * Carga diferida: el cliente solo se instancia si hay sesión guardada o cuando
 * el usuario inicia/crea sesión. Sincronización por "más reciente" (updatedAt).
 */
import { getSupabase } from "../database/client";
import { DB, STORAGE_KEY, onSave, setDB, setSyncStatus } from "../database/store";
import { $ } from "../utils/dom";

let sbClient: any = null;
let currentUser: any = null;
let pushTimer: any = null;
let loginRunning = false;
let syncedOnce = false;
let listenersOn = false;

function setAcc(html: string) { const s = $("acc-status"); if (s) s.innerHTML = html; }
function msg(t: string, ok?: boolean) { const m = $("acc-msg"); if (!m) return; m.style.display = t ? "block" : "none"; m.textContent = t || ""; m.style.color = ok ? "var(--ink-1)" : "var(--warn)"; }
function showAuthed(on: boolean) { const f = $("acc-forms"), o = $("acc-out"); if (f) f.style.display = on ? "none" : "block"; if (o) o.style.display = on ? "block" : "none"; }

/** ¿Hay un token de sesión de Supabase guardado localmente? (para cargar solo si aplica) */
function hasStoredSession(): boolean {
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.startsWith("sb-") && k.endsWith("-auth-token")) return true; } } catch {}
  return false;
}

/** Carga el cliente (una vez) y engancha los listeners de auth. */
async function ensureAuth(): Promise<any> {
  const c = await getSupabase(); if (!c) return null;
  if (!sbClient) { sbClient = c; if (!listenersOn) attachListeners(); }
  return sbClient;
}
function attachListeners() {
  listenersOn = true;
  sbClient.auth.onAuthStateChange((event: string, session: any) => {
    currentUser = session && session.user ? session.user : null;
    // Solo reaccionar a inicio/cierre reales; ignorar TOKEN_REFRESHED/SIGNED_IN repetidos.
    if (event === "SIGNED_OUT") { syncedOnce = false; onLogout(); return; }
    if (currentUser && !syncedOnce) onLogin();
  });
  sbClient.auth.getSession().then((res: any) => {
    const s = res.data ? res.data.session : null;
    const u = s && s.user ? s.user : null;
    if (u && !syncedOnce) { currentUser = u; onLogin(); }
    else if (!u) onLogout();
  });
}

async function cloudPull() {
  if (!currentUser || !sbClient) return null;
  const res = await sbClient.from("app_state").select("data").eq("user_id", currentUser.id).maybeSingle();
  if (res.error) { console.warn("pull", res.error); return null; }
  return res.data ? (res.data as any).data : null;
}
async function cloudPush() {
  if (!currentUser || !sbClient) return;
  const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
  let data; try { data = JSON.parse(raw); } catch { return; }
  setSyncStatus("Sincronizando…");
  const res = await sbClient.from("app_state").upsert({ user_id: currentUser.id, data }, { onConflict: "user_id" });
  if (res.error) { console.warn("push", res.error); setSyncStatus("Error al sincronizar"); }
  else setSyncStatus("Sincronizado ✓");
}
function schedulePush() { if (!currentUser || !sbClient) return; clearTimeout(pushTimer); pushTimer = setTimeout(cloudPush, 1200); }

async function onLogin() {
  if (loginRunning) return; loginRunning = true;
  showAuthed(true);
  const em = currentUser.email || "";
  setAcc("Sesión: <b>" + em + "</b> · sincronizando…");
  const cloud = await cloudPull();
  const localRaw = localStorage.getItem(STORAGE_KEY);
  let local: any = null; try { local = localRaw ? JSON.parse(localRaw) : null; } catch {}
  const cloudU = (cloud && (cloud as any).updatedAt) || 0;
  const localU = (local && local.updatedAt) || 0;
  if (cloud && cloudU >= localU) {
    if (JSON.stringify(cloud) !== localRaw) { setDB(cloud); setAcc("Sesión: <b>" + em + "</b> · datos sincronizados ✓"); }
    else setAcc("Sesión: <b>" + em + "</b> · sincronizado ✓");
  } else {
    await cloudPush(); setAcc("Sesión: <b>" + em + "</b> · sincronizado ✓");
  }
  syncedOnce = true; loginRunning = false;
}
function onLogout() { currentUser = null; showAuthed(false); setAcc("Sin sesión · los datos se guardan solo en este dispositivo."); }

/** Conecta auth + persistencia. Se llama una vez en el arranque. */
export function initSync() {
  onSave(schedulePush);
  wireAuthButtons();
  if (hasStoredSession()) ensureAuth();   // solo cargamos Supabase si ya había sesión
}

function wireAuthButtons() {
  const inEmail = $<HTMLInputElement>("acc-email"), inPass = $<HTMLInputElement>("acc-pass");
  const bIn = $("acc-signin"), bUp = $("acc-signup"), bOut = $("acc-signout");
  if (bIn) bIn.onclick = async () => {
    const em = (inEmail.value || "").trim(), pw = inPass.value || "";
    if (!em || !pw) { msg("Escribe email y contraseña.", false); return; }
    msg("Iniciando sesión…", true);
    const c = await ensureAuth(); if (!c) { msg("Sin conexión con el servidor.", false); return; }
    const r = await c.auth.signInWithPassword({ email: em, password: pw });
    if (r.error) msg("Error: " + r.error.message, false); else { msg("", true); inPass.value = ""; }
  };
  if (bUp) bUp.onclick = async () => {
    const em = (inEmail.value || "").trim(), pw = inPass.value || "";
    if (!em || pw.length < 6) { msg("Email válido y contraseña de 6+ caracteres.", false); return; }
    msg("Creando cuenta…", true);
    const c = await ensureAuth(); if (!c) { msg("Sin conexión con el servidor.", false); return; }
    const r = await c.auth.signUp({ email: em, password: pw });
    if (r.error) { msg("Error: " + r.error.message, false); return; }
    if (r.data && r.data.session) { msg("Cuenta creada e iniciada.", true); inPass.value = ""; }
    else msg("Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.", true);
  };
  if (bOut) bOut.onclick = async () => { const c = await ensureAuth(); if (c) { await c.auth.signOut(); msg("Sesión cerrada.", true); } };
}

/** Permite cambiar contraseña desde Ajustes. */
export async function updatePassword(p: string): Promise<{ error?: any }> {
  const c = await ensureAuth(); if (!c) return { error: { message: "sin conexión" } };
  return c.auth.updateUser({ password: p }) as any;
}
export function hasAuth() { return true; }
void DB;
