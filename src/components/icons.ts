/**
 * components/icons.ts — set de iconos monocromáticos (SVG, trazo, currentColor).
 * Un solo estilo visual y sin emojis. Uso: icon("dinero").
 */
const P: Record<string, string> = {
  hoy: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
  plan: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>',
  constancia: '<path d="M5 13l4 4L19 7"/><path d="M4 20h16"/>',
  dinero: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.3" fill="currentColor" stroke="none"/>',
  comida: '<path d="M6 3v8M9 3v8M7.5 11v10M6 7h3"/><path d="M16 3c-1.5 1-2 3-2 5s.5 3 2 3v10"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  tarjetas: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 15h4"/>',
  presupuesto: '<path d="M12 3v9l7 4"/><circle cx="12" cy="12" r="9"/>',
  gastos: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  ingresos: '<path d="M12 5v14M12 19l5-5M12 19l-5-5"/>',
  proyecciones: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  metas: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  historial: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  reportes: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  cuentas: '<path d="M3 9l9-5 9 5"/><path d="M5 9v9M19 9v9M9 9v9M15 9v9M3 21h18"/>',
  deuda: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  subs: '<path d="M4 9a8 8 0 0113-3l3 3M20 15a8 8 0 01-13 3l-3-3"/><path d="M17 3v3h-3M7 21v-3h3"/>',
  refri: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 11h12M9 6v2M9 14v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  flame: '<path d="M12 3c1 3-2 4-2 7a2 2 0 004 0c0-1 1-1.5 1-1.5C16 12 16 16 12 21 8 16 8 11 12 3z"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h8"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.2 11l6.6-3.6M8.2 13l6.6 3.6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
};

export function icon(name: string, size = 18): string {
  const d = P[name] || P.plan;
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:block">' + d + '</svg>';
}
