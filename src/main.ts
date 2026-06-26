/**
 * main.ts — punto de entrada. Importa estilos, inicializa cada módulo y arranca.
 */
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/nav.css";
import "./styles/components.css";

import { DB, onReplace } from "./database/store";
import { $, qsa } from "./utils/dom";
import { icon } from "./components/icons";
import { initRouter, go, savedScreen, rerenderCurrent } from "./router";
import { initModals } from "./components/modals";
import { initHoy } from "./pages/hoy";
import { initAdd, openAdd } from "./pages/tarea-nueva";
import { initDetalle } from "./pages/tarea-detalle";
import { initPlan } from "./pages/plan";
import { initConstancia } from "./pages/constancia";
import { initDinero } from "./pages/dinero";
import { initComida } from "./pages/comida";
import { initAjustes } from "./pages/ajustes";
import { initSync } from "./services/sync";
import { startReminderWatcher } from "./services/reminders";

// tema inicial
document.body.setAttribute("data-theme", DB.theme || "light");
if (DB.accent) document.body.style.setProperty("--accent", DB.accent);

// wiring de cada módulo (una sola vez)
initRouter();
initModals();
initHoy();
initAdd();
initDetalle();
initPlan();
initConstancia();
initDinero();
initComida();
initAjustes();

// botones de "nueva tarea"
$("fab").onclick = openAdd;
$("newSide").onclick = openAdd;


// iconografía monocromática (sin emojis)
function initIcons() {
  const map: Record<string, string> = { hoy: "hoy", plan: "plan", habitos: "constancia", dinero: "dinero", comida: "comida", ajustes: "ajustes" };
  qsa<HTMLElement>("[data-go]").forEach((b) => { const ic = map[b.dataset.go!]; if (!ic) return; const sp = b.querySelector(".si,.ni") as HTMLElement | null; if (sp) sp.innerHTML = icon(ic, sp.classList.contains("ni") ? 20 : 18); });
  qsa<HTMLElement>('[data-money="tarjetas"]').forEach((b) => { const sp = b.querySelector(".si") as HTMLElement | null; if (sp) sp.innerHTML = icon("tarjetas"); });
  const gear = $("gear"); if (gear) gear.innerHTML = icon("ajustes");
  const fab = $("fab"); if (fab) fab.innerHTML = icon("plus", 24);
}
initIcons();

// sincronización en la nube (Supabase)
initSync();
startReminderWatcher();

// re-render al sincronizar datos de la nube (sin recargar)
onReplace(rerenderCurrent);

// pantalla inicial: restaura la última que usaste
go(savedScreen());
