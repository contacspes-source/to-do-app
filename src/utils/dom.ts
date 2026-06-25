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

export function openModal(id: string) { $(id)?.classList.add("on"); }
export function closeModal(id: string) { $(id)?.classList.remove("on"); }
