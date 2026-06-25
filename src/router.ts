/**
 * router.ts — navegación entre pantallas y cambio de tema.
 * Centraliza go() y goMoney(); cada página expone su propio render().
 */
import { DB, save } from "./database/store";
import { $, qsa } from "./utils/dom";
import { renderHoy } from "./pages/hoy";
import { renderPlan } from "./pages/plan";
import { renderHabitos } from "./pages/constancia";
import { renderDinero, setDineroSeg } from "./pages/dinero";
import { renderComida } from "./pages/comida";
import { renderAjustes } from "./pages/ajustes";

const TITLES: Record<string, string> = {
  hoy: "Hoy", plan: "Plan", habitos: "Constancia", dinero: "Dinero",
  comida: "Comida", add: "Nueva tarea", detalle: "Detalle", ajustes: "Ajustes",
};

export function go(id: string) {
  qsa(".screen").forEach((s) => s.classList.remove("on"));
  $(id)?.classList.add("on");
  qsa<HTMLElement>("[data-go]").forEach((b) => b.classList.toggle("on", b.dataset.go === id));
  const brand = $("brand"); if (brand) brand.textContent = TITLES[id] || "";
  window.scrollTo(0, 0);
  if (id === "hoy") renderHoy();
  else if (id === "plan") renderPlan();
  else if (id === "habitos") renderHabitos();
  else if (id === "dinero") renderDinero();
  else if (id === "comida") renderComida();
  else if (id === "ajustes") renderAjustes();
}

/** Atajo a una pestaña de Dinero (p. ej. desde el sidebar o Ajustes). */
export function goMoney(seg: string) { setDineroSeg(seg); go("dinero"); }

export function initRouter() {
  qsa<HTMLElement>("[data-go]").forEach((b) => (b.onclick = () => { if (b.dataset.go === "dinero") setDineroSeg("home"); go(b.dataset.go!); }));
  qsa<HTMLElement>("[data-money]").forEach((b) => (b.onclick = () => goMoney(b.dataset.money!)));
  $("gear").onclick = () => go("ajustes");

  // tema
  const setTheme = (t: "light" | "dark") => { DB.theme = t; document.body.setAttribute("data-theme", t); save(); renderAjustes(); };
  $("th-dark").onclick = () => setTheme("dark");
  $("th-light").onclick = () => setTheme("light");
}
