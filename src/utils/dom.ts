/**
 * utils/dom.ts — helpers de DOM reutilizables (selección, pills, modales).
 */
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
export function qsa<T extends Element = Element>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

/** Grupo de pills exclusivo: marca .sel y notifica el valor. */
export function pillGroup(wrap: HTMLElement | null, cb: (v: string) => void) {
  if (!wrap) return;
  qsa<HTMLElement>(".pill", wrap).forEach((p) => {
    p.onclick = () => {
      qsa(".pill", wrap).forEach((x) => x.classList.remove("sel"));
      p.classList.add("sel");
      cb((p as HTMLElement).dataset.v || "");
    };
  });
}
export function resetPills(id: string, v: string) {
  qsa<HTMLElement>("#" + id + " .pill").forEach((p) => p.classList.toggle("sel", p.dataset.v === v));
}

let lastFocused: HTMLElement | null = null;
export function openModal(id: string) {
  const m = $(id); if (!m) return;
  lastFocused = document.activeElement as HTMLElement;
  m.classList.add("on");
  m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-hidden", "false");
  const f = m.querySelector<HTMLElement>("input,select,textarea,button,[tabindex]");
  if (f) setTimeout(() => { try { f.focus(); } catch {} }, 60);
}
export function closeModal(id: string) {
  const m = $(id); if (!m) return;
  m.classList.remove("on"); m.setAttribute("aria-hidden", "true");
  if (lastFocused) { try { lastFocused.focus(); } catch {} lastFocused = null; }
}

// Accesibilidad global: Escape cierra el modal superior; clic en el fondo también.
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = qsa<HTMLElement>(".modal.on"); const top = open[open.length - 1];
    if (top) closeModal(top.id);
  });
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t && t.classList && t.classList.contains("modal") && t.classList.contains("on")) closeModal(t.id);
  });
}
