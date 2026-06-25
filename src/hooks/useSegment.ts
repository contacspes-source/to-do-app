/**
 * hooks/useSegment.ts — hook reutilizable para barras de pestañas (.seg / .seg-grid).
 * Centraliza el patrón "marcar activo + recordar selección + re-render"
 * usado en Hoy, Plan, Dinero y Comida (evita duplicar lógica de navegación).
 */
import { qsa } from "../utils/dom";

export interface Segment { get: () => string; set: (v: string) => void; }

export function useSegment(containerId: string, initial: string, onChange: (v: string) => void): Segment {
  let current = initial;
  const wire = () => {
    qsa<HTMLElement>("#" + containerId + " button").forEach((b) => {
      b.classList.toggle("on", b.dataset.v === current);
      b.onclick = () => { set(b.dataset.v || initial); };
    });
  };
  const set = (v: string) => {
    current = v;
    qsa<HTMLElement>("#" + containerId + " button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    onChange(v);
  };
  wire();
  return { get: () => current, set };
}
