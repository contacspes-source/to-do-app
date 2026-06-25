/**
 * pages/dinero.ts — módulo de Finanzas (Resumen, Crédito, Débito, Deuda,
 * Calendario, Suscripciones, Metas, Proyección, Movimientos).
 *
 * Corrección 1: la antigua "Estadísticas" se eliminó; su contenido vive en
 *   la pestaña Proyección (única fuente, sin duplicar).
 * Corrección 3: cada tarjeta tiene botón "Modificar pago" (acceso rápido) y
 *   muestra siempre pago registrado del mes, pago mínimo y la diferencia.
 */
import { DB, save } from "../database/store";
import { $, qsa } from "../utils/dom";
import { esc, money } from "../utils/format";
import {
  sum, acctById, totalDebt, totalDebito, monthTx, applyTx, nextDateForDay,
  monthlyIncome, monthlyGasto, monthlySubs, monthsSpanAll, computeAlerts,
} from "../finance/calc";
import { cardBg, cardPay, cardPayType, cardById, paySim } from "../finance/cards";
import { openCard, openSim, openPay, openAcct, openTx, openSub, openGoal } from "../components/modals";
import { useSegment } from "../hooks/useSegment";

let dinSeg = "resumen";
let proyH = 1;

export function setDineroSeg(seg: string) {
  dinSeg = seg;
  qsa<HTMLElement>("#dinseg button").forEach((x) => x.classList.toggle("on", x.dataset.v === seg));
}
function buildProySeg() {
  const w = $("proyseg"); if (!w) return;
  qsa<HTMLElement>("button", w).forEach((b) => { b.classList.toggle("on", +b.dataset.m! === proyH); b.onclick = () => { proyH = +b.dataset.m!; renderDinero("proy"); }; });
}
export function moveCard(id: any, dir: number) {
  const i = DB.cards.findIndex((c) => c.id == id); if (i < 0) return;
  const j = i + dir; if (j < 0 || j >= DB.cards.length) return;
  const tmp = DB.cards[i]; DB.cards[i] = DB.cards[j]; DB.cards[j] = tmp; save(); renderDinero("tarjetas");
}

export function renderDinero(seg = dinSeg) {
  dinSeg = seg; const w = $("dinBody"); w.innerHTML = "";
  const mt = monthTx();
  const ing = sum(mt.filter((t) => t.type === "ingreso").map((t) => t.amount));
  const gas = sum(mt.filter((t) => t.type === "gasto").map((t) => t.amount));
  const deuda = totalDebt(); const debito = totalDebito();

  if (seg === "resumen") {
    const disp = ing - gas;
    let h = '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Disponible en cuentas</div><div class="big-money" style="margin-top:8px">' + money(debito) + '</div></div>';
    const alerts = computeAlerts(); if (alerts.length) { h += '<div class="sect">Alertas</div>'; alerts.forEach((a) => (h += '<div class="alert">' + esc(a) + '</div>')); }
    h += '<div class="sect">Captura rápida</div><div class="qr" id="qr"></div>';
    h += '<div class="sect">Flujo del mes</div>';
    h += '<div class="stat-row"><div class="stat"><div class="n acc">' + money(ing) + '</div><div class="l">Ingresos</div></div><div class="stat"><div class="n">' + money(gas) + '</div><div class="l">Gastos</div></div><div class="stat"><div class="n" style="color:' + (disp >= 0 ? "var(--ink-1)" : "var(--warn)") + '">' + money(disp) + '</div><div class="l">Disponible</div></div></div>';
    h += '<div class="stat-row" style="margin-top:10px"><div class="stat"><div class="n" style="color:var(--warn)">' + money(deuda) + '</div><div class="l">Deuda crédito</div></div><div class="stat"><div class="n">' + money(debito) + '</div><div class="l">En cuentas</div></div></div>';
    h += '<div class="sect">Gasto por categoría</div>';
    const cats: Record<string, number> = {}; mt.filter((t) => t.type === "gasto").forEach((t) => (cats[t.cat] = (cats[t.cat] || 0) + t.amount));
    const keys = Object.keys(cats); if (!keys.length) h += '<div class="note">Aún no registras gastos este mes.</div>';
    keys.sort((a, b) => cats[b] - cats[a]).forEach((k) => { const p = gas ? Math.round(cats[k] / gas * 100) : 0; h += '<div class="arow"><div class="top"><span>' + k + '</span><span class="v">' + money(cats[k]) + '</span></div><div class="bar"><i style="width:' + p + '%"></i></div></div>'; });
    const inc: Record<string, any> = {}; DB.tx.filter((t) => t.type === "ingreso").forEach((t) => { const o = inc[t.cat] || (inc[t.cat] = { s: 0, n: 0, min: t.date, max: t.date }); o.s += t.amount; o.n++; if (t.date < o.min) o.min = t.date; if (t.date > o.max) o.max = t.date; });
    const incKeys = Object.keys(inc);
    if (incKeys.length) { h += '<div class="sect">Ingresos típicos</div>'; incKeys.sort((a, b) => inc[b].s - inc[a].s).forEach((k) => { const o = inc[k]; const avg = o.s / o.n; const months = Math.max(1, (+new Date(o.max) - +new Date(o.min)) / 2592e6 + 1); const pm = o.n / months; const fr = pm >= 3.5 ? "≈ semanal" : pm >= 1.5 ? "≈ quincenal" : pm >= 0.8 ? "≈ mensual" : "ocasional"; h += '<div class="lrow"><span>' + esc(k) + ' <span class="ld">' + fr + '</span></span><span class="money">' + money(avg) + '</span></div>'; }); }
    h += '<div style="height:18px"></div><button class="btn btn-primary" id="quickTx">+ Registrar movimiento</button>';
    w.innerHTML = h; renderQuick();
    $("quickTx").onclick = () => openTx();
  } else if (seg === "tarjetas") {
    const lim = sum(DB.cards.map((c) => c.limit || 0)); const util = lim ? Math.round(deuda / lim * 100) : 0;
    let h = '<div class="card-pad"><div class="arow" style="margin:0"><div class="top"><b style="font-weight:500">Uso total del crédito</b><span class="v">' + util + '%</span></div><div class="bar"><i class="' + (util > 30 ? "warn" : "acc") + '" style="width:' + Math.min(util, 100) + '%"></i></div><div class="note">Deuda ' + money(deuda) + ' de ' + money(lim) + '. Sano por debajo del 30%.</div></div></div>';
    if (!DB.cards.length) h += '<div class="empty"><div class="big">Sin tarjetas</div>Agrega una con el botón de abajo</div>';
    DB.cards.forEach((c) => {
      const u = c.limit ? Math.round((c.balance || 0) / c.limit * 100) : 0; const avail = (c.limit || 0) - (c.balance || 0);
      const pl = cardPay(c); const ptype = cardPayType(c); const sim = paySim(c.balance || 0, c.apr || 0, pl); const cov = c.balance ? Math.min(100, Math.round(pl / c.balance * 100)) : 0;
      const bg = cardBg(c); const clogo = c.bank ? esc(c.bank.charAt(0).toUpperCase()) : "💳"; const cl4 = c.last4 ? "•••• " + esc(c.last4) : "•••• ••••";
      const dueD = c.pay ? nextDateForDay(+c.pay) : null; const dueTxt = dueD ? dueD.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "—"; const days = dueD ? Math.round((+dueD - +new Date()) / 864e5) : null;
      const minP = +(c.min || 0); const diff = pl - minP;
      const flags: string[] = []; if (days != null && days >= 0 && days <= 5 && (c.balance || 0) > 0) flags.push(days === 0 ? "Pago hoy" : "Pago en " + days + "d"); if (u >= 70) flags.push("Uso alto " + u + "%"); if (minP > 0 && ptype === "custom" && pl < minP) flags.push("Pago menor al mínimo");
      h += '<div class="card-cc"' + (c.active === false ? ' style="opacity:.55"' : '') + '>' +
        '<div class="cardface" style="background:' + bg + '"><div class="cf-top"><div><div class="cf-bank">' + esc(c.bank || c.name) + '</div><div class="cf-alias">' + esc(c.alias || c.name) + '</div></div><div class="cf-logo">' + clogo + '</div></div><div><div class="cf-num">' + cl4 + '</div><div class="cf-util">uso ' + u + '%' + (c.active === false ? ' · inactiva' : '') + '</div></div></div>' +
        '<div class="bar" style="margin-top:12px"><i class="' + (u > 30 ? "warn" : "acc") + '" style="width:' + Math.min(u, 100) + '%"></i></div>' +
        (flags.length ? '<div class="cflags">' + flags.map((f) => '<span class="cflag">⚠ ' + f + '</span>').join('') + '</div>' : '') +
        '<div class="cinfo">' +
        '<div><div class="k">Saldo usado</div><div class="vv">' + money(c.balance || 0) + '</div></div>' +
        '<div><div class="k">Disponible</div><div class="vv">' + money(avail) + '</div></div>' +
        '<div><div class="k">Límite</div><div class="vv">' + money(c.limit || 0) + '</div></div>' +
        '<div><div class="k">Utilización</div><div class="vv' + (u >= 70 ? ' warn' : '') + '">' + u + '%</div></div>' +
        '<div><div class="k">Corte</div><div class="vv">' + (c.cut ? "día " + c.cut : "—") + '</div></div>' +
        '<div><div class="k">Fecha límite</div><div class="vv' + (days != null && days >= 0 && days <= 5 ? ' warn' : '') + '">' + (c.pay ? dueTxt : "—") + '</div></div>' +
        '</div>' +
        // ---- Bloque de pago (siempre visible): registrado / mínimo / diferencia ----
        '<div class="cinfo" style="margin-top:10px">' +
        '<div><div class="k">Pago de este mes</div><div class="vv">' + money(pl) + '</div></div>' +
        '<div><div class="k">Pago mínimo</div><div class="vv">' + money(minP) + '</div></div>' +
        '<div><div class="k">Diferencia</div><div class="vv' + (diff < 0 ? ' warn' : '') + '">' + (diff >= 0 ? "+" : "") + money(diff) + '</div></div>' +
        '<div><div class="k">Interés anual</div><div class="vv">' + (c.apr || 0) + '%</div></div>' +
        '</div>' +
        '<div class="paychip"><span class="tag">Registrado</span> <b>' + money(pl) + '</b> <span class="tag">' + (ptype === "custom" ? "personalizado" : "mínimo") + '</span></div>' +
        ((pl > 0 && (c.balance || 0) > 0) ? '<div class="note" style="margin-top:8px">Cubre ' + cov + '% del saldo' + (sim.ok ? ' · liquidarías en ' + sim.m + ' meses' : ' · no cubre intereses') + '</div>' : '') +
        '<div class="ccact"><button class="cc-pay" data-pay="' + c.id + '">Modificar pago</button><button data-sim="' + c.id + '">Simular</button><button data-edit="' + c.id + '">Editar</button><button data-susp="' + c.id + '">' + (c.active === false ? "Activar" : "Suspender") + '</button><button data-up="' + c.id + '">↑</button><button data-down="' + c.id + '">↓</button><button data-delc="' + c.id + '">Eliminar</button></div></div>';
    });
    h += '<button class="btn btn-primary" id="addCard">+ Agregar tarjeta</button>';
    w.innerHTML = h;
    $("addCard").onclick = () => openCard();
    qsa<HTMLElement>("[data-pay]", w).forEach((b) => (b.onclick = () => openPay(b.dataset.pay!)));
    qsa<HTMLElement>("[data-edit]", w).forEach((b) => (b.onclick = () => openCard(b.dataset.edit)));
    qsa<HTMLElement>("[data-susp]", w).forEach((b) => (b.onclick = () => { const c = cardById(b.dataset.susp); if (c) { c.active = c.active === false; save(); renderDinero("tarjetas"); } }));
    qsa<HTMLElement>("[data-delc]", w).forEach((b) => (b.onclick = () => { if (confirm("¿Eliminar esta tarjeta?")) { DB.cards = DB.cards.filter((x) => x.id != (b.dataset.delc as any)); save(); renderDinero("tarjetas"); } }));
    qsa<HTMLElement>("[data-up]", w).forEach((b) => (b.onclick = () => moveCard(b.dataset.up, -1)));
    qsa<HTMLElement>("[data-down]", w).forEach((b) => (b.onclick = () => moveCard(b.dataset.down, 1)));
    qsa<HTMLElement>("[data-sim]", w).forEach((b) => (b.onclick = () => openSim(b.dataset.sim!)));
  } else if (seg === "debito") {
    let h = '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Total en cuentas</div><div class="big-money" style="margin-top:8px">' + money(debito) + '</div></div>';
    if (!DB.accounts.length) h += '<div class="empty"><div class="big">Sin cuentas</div>Agrega una cuenta o efectivo</div>';
    const TIPO: Record<string, string> = { debito: "Débito", ahorro: "Ahorros", efectivo: "Efectivo" };
    DB.accounts.forEach((a) => {
      const am = mt.filter((t) => t.method !== "credito" && t.acctId == a.id);
      const ai = sum(am.filter((t) => t.type === "ingreso").map((t) => t.amount));
      const ag = sum(am.filter((t) => t.type === "gasto").map((t) => t.amount));
      h += '<div class="card-cc"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="cn">' + esc(a.name) + '</div><div class="cnum">' + (TIPO[a.type] || "") + (a.bank ? " · " + esc(a.bank) : "") + '</div></div><button class="hx" data-dela="' + a.id + '" style="color:var(--ink-4);background:none;border:0;font-size:18px;cursor:pointer">×</button></div>' +
        '<div class="big-money" style="font-size:24px;margin-top:10px">' + money(a.balance || 0) + '</div>' +
        '<div class="crow"><span>Ingresos ' + money(ai) + '</span><span>Gastos ' + money(ag) + '</span></div>' +
        '<div class="ccact"><button data-edita="' + a.id + '">Editar</button></div></div>';
    });
    h += '<button class="btn btn-primary" id="addAcct">+ Agregar cuenta</button>';
    w.innerHTML = h;
    $("addAcct").onclick = () => openAcct();
    qsa<HTMLElement>("[data-edita]", w).forEach((b) => (b.onclick = () => openAcct(b.dataset.edita)));
    qsa<HTMLElement>("[data-dela]", w).forEach((b) => (b.onclick = () => { if (confirm("¿Eliminar esta cuenta?")) { DB.accounts = DB.accounts.filter((x) => x.id != (b.dataset.dela as any)); save(); renderDinero("debito"); } }));
  } else if (seg === "movs") {
    let h = '<button class="btn btn-primary" id="addTx">+ Registrar movimiento</button><div class="sect">Este mes</div>';
    if (!mt.length) h += '<div class="note">Sin movimientos aún.</div>';
    w.innerHTML = h; const listed = mt.slice().sort((a, b) => +new Date(b.date) - +new Date(a.date));
    listed.forEach((t) => { const src = t.method === "credito" ? (cardById(t.cardId) || ({} as any)).name || "" : (acctById(t.acctId) || ({} as any)).name || ""; const el = document.createElement("div"); el.className = "tx"; el.innerHTML = '<div class="ti">' + (t.type === "ingreso" ? "+" : "−") + '</div><div class="tn">' + esc(t.cat) + (t.note ? ' · <span style="color:var(--ink-3)">' + esc(t.note) + '</span>' : '') + '<div class="td">' + new Date(t.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) + ' · ' + (t.method || "efectivo") + (src ? " · " + esc(src) : "") + '</div></div><div style="display:flex;align-items:center;gap:10px"><div class="tm ' + (t.type === "ingreso" ? "in" : "") + '">' + (t.type === "ingreso" ? "+" : "−") + money(t.amount) + '</div><button class="hx" data-delt="' + t.id + '" style="color:var(--ink-4);background:none;border:0;font-size:16px;cursor:pointer">×</button></div>'; w.appendChild(el); });
    $("addTx").onclick = () => openTx();
    qsa<HTMLElement>("[data-delt]", w).forEach((b) => (b.onclick = () => { const t = DB.tx.find((x) => x.id == (b.dataset.delt as any)); if (t && confirm("¿Eliminar este movimiento?")) { applyTx(t, -1); DB.tx = DB.tx.filter((x) => x.id != t.id); save(); renderDinero("movs"); } }));
  } else if (seg === "deuda") {
    let h = '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Deuda total</div><div class="big-money" style="margin-top:8px;color:' + (deuda > 0 ? "var(--warn)" : "var(--ink-1)") + '">' + money(deuda) + '</div></div>';
    const used = DB.cards.slice().filter((c) => (c.balance || 0) > 0).sort((a, b) => (b.balance || 0) - (a.balance || 0));
    h += '<div class="sect">Crédito usado</div>'; if (!used.length) h += '<div class="note">Sin deuda registrada.</div>';
    used.forEach((c) => (h += '<div class="lrow"><span>' + esc(c.name) + '</span><span class="money">' + money(c.balance || 0) + '</span></div>'));
    if (used.length) h += '<div class="lrow" style="border:0"><b style="font-weight:600">Total usado</b><b class="money" style="color:var(--warn)">' + money(deuda) + '</b></div>';
    h += '<div class="sect">Pagos próximos</div>';
    const pays = DB.cards.filter((c) => c.active !== false && (c.balance || 0) > 0 && c.pay).map((c) => ({ d: nextDateForDay(+(c.pay as number)), name: c.name, amt: c.balance || 0 })).sort((a, b) => +a.d - +b.d);
    if (!pays.length) h += '<div class="note">Agrega día de pago y saldo a tus tarjetas para verlos.</div>';
    pays.forEach((p) => (h += '<div class="lrow"><span><span class="ld">' + p.d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) + '</span> · ' + esc(p.name) + '</span><span class="money">' + money(p.amt) + '</span></div>'));
    const ordered = DB.cards.slice().filter((c) => (c.balance || 0) > 0).sort((a, b) => (b.apr || 0) - (a.apr || 0));
    if (ordered.length) { h += '<div class="sect">Orden de pago sugerido (avalancha)</div><div class="note" style="margin-top:0;margin-bottom:10px">Paga el mínimo en todas y ataca primero la de mayor interés.</div>'; ordered.forEach((c, i) => (h += '<div class="lrow"' + (i === 0 ? ' style="border-color:var(--ink-1)"' : '') + '><span>' + (i + 1) + '. ' + esc(c.name) + ' · ' + (c.apr || 0) + '%</span><span class="money" style="color:var(--warn)">' + money(c.balance || 0) + '</span></div>')); }
    h += '<div class="sect">Buenas prácticas</div><div class="card-pad"><div style="font-size:14px;color:var(--ink-2);line-height:1.7">· Paga siempre más que el mínimo.<br>· Liquida antes de la fecha de corte para no generar intereses.<br>· Mantén el uso por debajo del 30% del límite.<br>· Un fondo de emergencia pequeño evita endeudarte de nuevo.</div></div>';
    h += '<div class="note">Información general, no asesoría financiera.</div>';
    w.innerHTML = h;
  } else if (seg === "calendario") {
    const now = new Date(); const mes = now.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    let h = '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Calendario financiero</div><div style="font-weight:600;font-size:18px;margin-top:6px;text-transform:capitalize">' + mes + '</div></div>';
    const ev: { day: number; label: string; amt: number | null }[] = [];
    DB.cards.forEach((c) => { if (c.active === false) return; if (c.cut) ev.push({ day: +c.cut, label: "Corte " + c.name, amt: null }); if (c.pay) ev.push({ day: +c.pay, label: "Pago " + c.name, amt: (c.balance || 0) > 0 ? (c.balance || 0) : null }); });
    (DB.subs || []).forEach((s) => { if (s.active !== false && s.day) ev.push({ day: +s.day, label: "Suscripción " + s.name, amt: s.amount || null }); });
    ev.sort((a, b) => a.day - b.day);
    if (!ev.length) h += '<div class="note">Agrega fechas a tus tarjetas o suscripciones para ver tu calendario.</div>';
    const today = now.getDate();
    ev.forEach((e) => { const soon = e.day >= today && e.day - today <= 3; h += '<div class="lrow"><span><span class="ld">' + e.day + '</span> · ' + esc(e.label) + (soon ? ' <span style="color:var(--warn)">• pronto</span>' : '') + '</span>' + (e.amt != null ? '<span class="money">' + money(e.amt) + '</span>' : '<span class="ld">—</span>') + '</div>'; });
    h += '<div class="note" style="margin-top:14px">Incluye cortes y pagos de tarjetas y suscripciones activas.</div>';
    w.innerHTML = h;
  } else if (seg === "subs") {
    const activeSubs = (DB.subs || []).filter((s) => s.active !== false); const mensual = sum(activeSubs.map((s) => s.amount || 0));
    let h = '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Gasto mensual recurrente</div><div class="big-money" style="margin-top:8px">' + money(mensual) + '</div><div class="note" style="margin-top:4px">' + money(mensual * 12) + ' al año</div></div>';
    if (!DB.subs.length) h += '<div class="empty"><div class="big">Sin suscripciones</div>Agrega Netflix, Spotify, hosting…</div>';
    DB.subs.forEach((s) => (h += '<div class="card-cc"' + (s.active === false ? ' style="opacity:.5"' : '') + '><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="cn">' + esc(s.name) + (s.active === false ? ' · pausada' : '') + '</div><div class="cnum">día ' + (s.day || "—") + ' · ' + money(s.amount || 0) + '/mes</div></div><div class="money">' + money(s.amount || 0) + '</div></div><div class="ccact"><button data-edits="' + s.id + '">Editar</button><button data-pausa="' + s.id + '">' + (s.active === false ? "Activar" : "Pausar") + '</button><button data-dels="' + s.id + '">Eliminar</button></div></div>'));
    h += '<button class="btn btn-primary" id="addSub">+ Agregar suscripción</button>';
    w.innerHTML = h;
    $("addSub").onclick = () => openSub();
    qsa<HTMLElement>("[data-edits]", w).forEach((b) => (b.onclick = () => openSub(b.dataset.edits)));
    qsa<HTMLElement>("[data-pausa]", w).forEach((b) => (b.onclick = () => { const s = (DB.subs || []).find((x) => x.id == (b.dataset.pausa as any)); if (s) { s.active = s.active === false; save(); renderDinero("subs"); } }));
    qsa<HTMLElement>("[data-dels]", w).forEach((b) => (b.onclick = () => { if (confirm("¿Eliminar esta suscripción?")) { DB.subs = DB.subs.filter((x) => x.id != (b.dataset.dels as any)); save(); renderDinero("subs"); } }));
  } else if (seg === "metas") {
    let h = ""; if (!DB.goals.length) h += '<div class="empty"><div class="big">Sin metas</div>Crea una meta de ahorro</div>';
    DB.goals.forEach((g) => { const p = g.target ? Math.min(100, Math.round((g.saved || 0) / g.target * 100)) : 0; h += '<div class="card-cc"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="cn">' + esc(g.name) + '</div><div class="cnum">Meta ' + money(g.target || 0) + '</div></div><div class="money">' + p + '%</div></div><div class="big-money" style="font-size:22px;margin-top:8px">' + money(g.saved || 0) + '</div><div class="bar" style="margin-top:10px"><i class="acc" style="width:' + p + '%"></i></div><div class="ccact"><button data-abona="' + g.id + '">+ Abonar</button><button data-editg="' + g.id + '">Editar</button><button data-delg="' + g.id + '">Eliminar</button></div></div>'; });
    h += '<button class="btn btn-primary" id="addGoal">+ Agregar meta</button>';
    w.innerHTML = h;
    $("addGoal").onclick = () => openGoal();
    qsa<HTMLElement>("[data-editg]", w).forEach((b) => (b.onclick = () => openGoal(b.dataset.editg)));
    qsa<HTMLElement>("[data-delg]", w).forEach((b) => (b.onclick = () => { if (confirm("¿Eliminar esta meta?")) { DB.goals = DB.goals.filter((x) => x.id != (b.dataset.delg as any)); save(); renderDinero("metas"); } }));
    qsa<HTMLElement>("[data-abona]", w).forEach((b) => (b.onclick = () => { const g = DB.goals.find((x) => x.id == (b.dataset.abona as any)); if (!g) return; const v = prompt("¿Cuánto abonar a " + g.name + "?"); if (v === null) return; const n = +v; if (!n || n <= 0) return; g.saved = (g.saved || 0) + n; save(); renderDinero("metas"); }));
  } else if (seg === "proy") {
    const cash = totalDebito(), mInc = monthlyIncome(), mGas = monthlyGasto(), mSub = monthlySubs(), deudaT = totalDebt();
    const H = proyH || 1; const inc2 = mInc * H, gas2 = mGas * H, sub2 = mSub * H, pay2 = deudaT;
    const proj = cash + inc2 - gas2 - sub2 - pay2; const hl = H === 1 ? "30 días" : H === 3 ? "90 días" : "1 año";
    let h = '<div class="seg" id="proyseg"><button data-m="1">30 días</button><button data-m="3">90 días</button><button data-m="12">1 año</button></div>';
    h += '<div class="card-pad" style="text-align:center"><div class="l" style="font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;font-family:var(--font-mono)">Saldo proyectado · ' + hl + '</div><div class="big-money" style="margin-top:8px;color:' + (proj >= 0 ? "var(--ink-1)" : "var(--warn)") + '">' + money(proj) + '</div></div>';
    h += '<div class="lrow"><span>Dinero actual</span><span class="money">' + money(cash) + '</span></div>';
    h += '<div class="lrow"><span>Ingresos esperados</span><span class="money">+' + money(inc2) + '</span></div>';
    h += '<div class="lrow"><span>Gastos estimados</span><span class="money">−' + money(gas2) + '</span></div>';
    h += '<div class="lrow"><span>Suscripciones</span><span class="money">−' + money(sub2) + '</span></div>';
    h += '<div class="lrow"><span>Pagos de tarjeta</span><span class="money">−' + money(pay2) + '</span></div>';
    h += '<div class="lrow" style="border:0"><b style="font-weight:600">Saldo proyectado</b><b class="money" style="color:' + (proj >= 0 ? "var(--ink-1)" : "var(--warn)") + '">' + money(proj) + '</b></div>';
    h += '<div class="sect">¿Cuánto puedo gastar?</div>';
    const committed = deudaT + mSub, safe = cash - committed;
    h += '<div class="card-pad"><div style="font-size:14px;color:var(--ink-2);line-height:1.6">Este mes puedes gastar aprox <b style="color:var(--ink-1)">' + money(Math.max(0, safe)) + '</b> más sin afectar tus pagos de tarjeta ni tus suscripciones.' + (safe < 0 ? ' <span style="color:var(--warn)">Cuidado: tus compromisos (' + money(committed) + ') superan tu efectivo.</span>' : '') + '</div></div>';
    const allG = DB.tx.filter((t) => t.type === "gasto"); const msp = monthsSpanAll(allG); const avgC: Record<string, number> = {};
    allG.forEach((t) => (avgC[t.cat] = (avgC[t.cat] || 0) + t.amount));
    const mt2 = monthTx(); const curC: Record<string, number> = {}; mt2.filter((t) => t.type === "gasto").forEach((t) => (curC[t.cat] = (curC[t.cat] || 0) + t.amount));
    const cks = Object.keys(avgC);
    if (cks.length) { h += '<div class="sect">Margen por categoría (este mes)</div>'; cks.map((k) => ({ k, avg: avgC[k] / msp, cur: curC[k] || 0 })).sort((a, b) => b.avg - a.avg).forEach((o) => { const rem = o.avg - o.cur; h += '<div class="lrow"><span>' + esc(o.k) + ' <span class="ld">prom. ' + money(o.avg) + '</span></span><span class="money" style="color:' + (rem >= 0 ? "var(--ink-1)" : "var(--warn)") + '">' + (rem >= 0 ? "te quedan " + money(rem) : "+" + money(-rem) + " sobre") + '</span></div>'; }); }
    h += '<div class="note">Estimaciones basadas en tu historial. No es asesoría financiera.</div>';
    w.innerHTML = h; buildProySeg();
  }
}

function renderQuick() {
  const w = $("qr"); if (!w) return; const favs = ["Comida", "Supermercado", "Gasolina", "Transporte"]; w.innerHTML = "";
  favs.forEach((c) => { const b = document.createElement("button"); b.className = "qrb"; b.textContent = c; b.onclick = () => openTx("gasto", c); w.appendChild(b); });
}

export function initDinero() {
  useSegment("dinseg", "resumen", (v) => { dinSeg = v; renderDinero(v); });
}
