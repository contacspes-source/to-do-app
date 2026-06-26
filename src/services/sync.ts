/**
 * services/sync.ts — autenticación y sincronización en la nube (Supabase).
 * Reemplaza el <script type="module"> suelto del archivo único, ahora modular.
 */
import { supabase } from "../database/client";
import { DB, STORAGE_KEY, onSave, setDB } from "../database/store";
import { $ } from "../utils/dom";

let currentUser: any = null;
let pushTimer: any = null;
let loginRunning = false;
let syncedOnce = false;

function setAcc(html: string) { const s = $("acc-status"); if (s) s.innerHTML = html; }
function msg(t: string, ok?: boolean) { const m = $("acc-msg"); if (!m) return; m.style.display = t ? "block" : "none"; m.textContent = t || ""; m.style.color = ok ? "var(--ink-1)" : "var(--warn)"; }
function showAuthed(on: boolean) { const f = $("acc-forms"), o = $("acc-out"); if (f) f.style.display = on ? "none" : "block"; if (o) o.style.display = on ? "block" : "none"; }

async function cloudPull() {
  if (!currentUser || !supabase) return null;
  const res = await supabase.from("app_state").select("data").eq("user_id", currentUser.id).maybeSingle();
  if (res.error) { console.warn("pull", res.error); return null; }
  return res.data ? (res.data as any).data : null;
}
async function cloudPush() {
  if (!currentUser || !supabase) return;
  const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
  let data; try { data = JSON.parse(raw); } catch { return; }
  const res = await supabase.from("app_state").upsert({ user_id: currentUser.id, data }, { onConflict: "user_id" });
  if (res.error) console.warn("push", res.error);
}
function schedulePush() { if (!currentUser) return; clearTimeout(pushTimer); pushTimer = setTimeout(cloudPush, 1200); }

async function onLogin() {
  if (loginRunning) return; loginRunning = true;
  showAuthed(true);
  const em = currentUser.email || "";
  setAcc("Sesión: <b>" + em + "</b> · sincronizando…");
  const cloud = await cloudPull();
  const localRaw = localStorage.getItem(STORAGE_KEY);
  if (cloud) {
    const cloudStr = JSON.stringify(cloud);
    if (cloudStr !== localRaw) {
      setDB(cloud);                       // aplica datos y re-renderiza, SIN recargar
      setAcc("Sesión: <b>" + em + "</b> · datos sincronizados ✓");
    } else {
      setAcc("Sesión: <b>" + em + "</b> · sincronizado ✓");
    }
    syncedOnce = true;
  } else { await cloudPush(); setAcc("Sesión: <b>" + em + "</b> · sincronizado ✓"); }
  syncedOnce = true; loginRunning = false;
}
function onLogout() { currentUser = null; showAuthed(false); setAcc("Sin sesión · los datos se guardan solo en este dispositivo."); }

/** Conecta auth + persistencia. Se llama una vez en el arranque. */
export function initSync() {
  // cada save() local agenda un push a la nube
  onSave(schedulePush);
  if (!supabase) return;

  supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session && session.user ? session.user : null;
    // Solo reaccionar a inicio/cierre de sesión reales. Ignorar TOKEN_REFRESHED,
    // USER_UPDATED y SIGNED_IN repetidos (que ocurren al reactivar la pestaña):
    // antes reejecutaban onLogin() + reload y devolvían al usuario a "Hoy".
    if (event === "SIGNED_OUT") { syncedOnce = false; onLogout(); return; }
    if (currentUser && !syncedOnce) onLogin();
  });

  const inEmail = $<HTMLInputElement>("acc-email"), inPass = $<HTMLInputElement>("acc-pass");
  const bIn = $("acc-signin"), bUp = $("acc-signup"), bOut = $("acc-signout");
  if (bIn) bIn.onclick = async () => {
    const em = (inEmail.value || "").trim(), pw = inPass.value || "";
    if (!em || !pw) { msg("Escribe email y contraseña.", false); return; }
    msg("Iniciando sesión…", true);
    const r = await supabase!.auth.signInWithPassword({ email: em, password: pw });
    if (r.error) msg("Error: " + r.error.message, false); else { msg("", true); inPass.value = ""; }
  };
  if (bUp) bUp.onclick = async () => {
    const em = (inEmail.value || "").trim(), pw = inPass.value || "";
    if (!em || pw.length < 6) { msg("Email válido y contraseña de 6+ caracteres.", false); return; }
    msg("Creando cuenta…", true);
    const r = await supabase!.auth.signUp({ email: em, password: pw });
    if (r.error) { msg("Error: " + r.error.message, false); return; }
    if (r.data && r.data.session) { msg("Cuenta creada e iniciada.", true); inPass.value = ""; }
    else msg("Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.", true);
  };
  if (bOut) bOut.onclick = async () => { await supabase!.auth.signOut(); msg("Sesión cerrada.", true); };

  supabase.auth.getSession().then((res) => {
    const s = res.data ? res.data.session : null;
    const u = s && s.user ? s.user : null;
    if (u && !syncedOnce) { currentUser = u; onLogin(); }
    else if (!u) onLogout();
  });
}

/** Permite cambiar contraseña desde Ajustes. */
export function updatePassword(p: string): Promise<{ error?: any }> {
  if (!supabase) return Promise.resolve({ error: { message: "sin conexión" } });
  return supabase.auth.updateUser({ password: p }) as any;
}
export function hasAuth() { return !!supabase; }
// referencia usada para evitar import sin uso en algunos builds
void DB;
