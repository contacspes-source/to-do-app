/**
 * components/charts.ts — gráficas SVG ligeras (sin librerías), con colores
 * del tema vía CSS variables. Reutilizable en cualquier vista.
 */
export interface Point { label: string; value: number; }

/** Gráfica de línea simple con área, puntos y etiquetas mín/máx. */
export function lineChart(points: Point[], opts: { unit?: string; height?: number } = {}): string {
  const unit = opts.unit || "";
  const H = opts.height || 140, W = 320, padX = 8, padY = 16;
  if (!points.length) return '<div class="note" style="margin:0">Sin datos aún. Registra para ver tu progreso.</div>';
  if (points.length === 1) {
    return '<div class="card-pad" style="text-align:center;margin:0"><div class="big-money">' + points[0].value + unit + '</div><div class="note" style="margin-top:2px">' + points[0].label + ' · agrega más registros para ver la tendencia</div></div>';
  }
  const vals = points.map((p) => p.value);
  let mn = Math.min(...vals), mx = Math.max(...vals);
  if (mn === mx) { mn -= 1; mx += 1; }
  const innerW = W - padX * 2, innerH = H - padY * 2;
  const x = (i: number) => padX + (innerW * i) / (points.length - 1);
  const y = (v: number) => padY + innerH * (1 - (v - mn) / (mx - mn));
  const line = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.value).toFixed(1)).join(" ");
  const area = "M" + x(0).toFixed(1) + " " + (H - padY).toFixed(1) + " " + points.map((p, i) => "L" + x(i).toFixed(1) + " " + y(p.value).toFixed(1)).join(" ") + " L" + x(points.length - 1).toFixed(1) + " " + (H - padY).toFixed(1) + " Z";
  const dots = points.map((p, i) => '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.value).toFixed(1) + '" r="2.5" fill="var(--accent)"/>').join("");
  const first = points[0].label, last = points[points.length - 1].label;
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="none" style="display:block">' +
    '<path d="' + area + '" fill="var(--accent)" opacity="0.10"/>' +
    '<path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots +
    '<text x="' + padX + '" y="' + (padY - 4) + '" font-size="9" fill="var(--ink-3)" font-family="monospace">' + mx + unit + '</text>' +
    '<text x="' + padX + '" y="' + (H - 3) + '" font-size="9" fill="var(--ink-3)" font-family="monospace">' + mn + unit + '</text>' +
    '</svg>' +
    '<div style="display:flex;justify-content:space-between"><span class="note" style="margin:0">' + first + '</span><span class="note" style="margin:0">' + last + '</span></div>';
}

/** Barra de progreso etiquetada (reutiliza estilos .bar). */
export function progressBar(pct: number, accent = true): string {
  return '<div class="bar"><i class="' + (accent ? "acc" : "") + '" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div>';
}
