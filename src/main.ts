/**
 * main.ts — punto de entrada. Importa estilos, inicializa cada módulo y arranca.
 */
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/nav.css";
import "./styles/components.css";

import { DB } from "./database/store";
import { $ } from "./utils/dom";
import { initRouter, go } from "./router";
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

// sincronización en la nube (Supabase)
initSync();

// pantalla inicial
go("hoy");
