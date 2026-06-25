/**
 * components/modals.ts — lógica de todos los modales (hojas inferiores).
 * Incluye: tarjeta, pago rápido (Modificar pago), simulador, cuenta,
 * movimiento, suscripción, meta y compra del súper → Finanzas.
 */
import { DB, save } from "../database/store";
import { $, qsa, pillGroup, resetPills, openModal, closeModal } from "../utils/dom";
import { esc, money } from "../utils/format";
import { CATEGORIES } from "../config/app";
import { CARDCOLORS, CARDGRADS, CARDTPL, cardBg, cardById, cardPay, cardPayType, paySim } from "../finance/cards";
import { applyTx } from "../finance/calc";
import { renderDinero } from "../pages/dinero";

/* ============ Tarjeta ============ */
let cardEdit: number | null = null, cardStatus = 1, cardColor = CARDCOLORS[0], cardBgMode = "color", cardGrad = CARDGRADS[0], cardTpl = 0, cardImg = "", cardPaySel: "min" | "custom" = "min";

function updatePayHint() {
  const min = +$<HTMLInputElement>("c-min").value || 0, cust = +$<HTMLInputElement>("c-planned").value || 0;
  const val = cardPaySel === "custom" ? cust : min; const h = $("c-payhint"); if (!h) return;
  h.textContent = "Se registrará " + money(val) + " como pago de este periodo" + (cardPaySel === "custom" && min > 0 && cust < min ? " · ⚠ menor al mínimo" : "");
  h.style.color = cardPaySel === "custom" && min > 0 && cust < min ? "var(--warn)" : "var(--ink-3)";
}
function swatchBtn(bgval: string, sel: boolean, cb: () => void) {
  const b = document.createElement("button"); b.className = "pill";
  b.style.cssText = "width:46px;height:30px;padding:0;border-color:" + (sel ? "var(--ink-1)" : "var(--hair)");
  b.innerHTML = '<span style="display:block;width:100%;height:100%;border-radius:4px;background:' + bgval + '"></span>'; b.onclick = cb; return b;
}
function buildColorPills() { const w = $("c-color"); w.innerHTML = ""; CARDCOLORS.forEach((col) => w.appendChild(swatchBtn(col, col === cardColor && cardBgMode === "color", () => { cardColor = col; cardBgMode = "color"; buildColorPills(); updateCardPreview(); }))); }
function buildGradPills() { const w = $("c-grad"); w.innerHTML = ""; CARDGRADS.forEach((g) => w.appendChild(swatchBtn(g, g === cardGrad && cardBgMode === "gradient", () => { cardGrad = g; cardBgMode = "gradient"; buildGradPills(); updateCardPreview(); }))); }
function buildTplPills() { const w = $("c-tpl"); w.innerHTML = ""; CARDTPL.forEach((t, i) => w.appendChild(swatchBtn(t.bg, i === cardTpl && cardBgMode === "template", () => { cardTpl = i; cardBgMode = "template"; buildTplPills(); updateCardPreview(); }))); }
function previewBg() { if (cardBgMode === "image" && cardImg) return "#222 url(" + cardImg + ") center/cover"; if (cardBgMode === "gradient") return cardGrad; if (cardBgMode === "template") return CARDTPL[cardTpl].bg; return cardColor; }
function updateCardPreview() {
  const p = $("c-preview"); if (!p) return; p.style.background = previewBg();
  const bank = $<HTMLInputElement>("c-bank").value.trim(), name = $<HTMLInputElement>("c-name").value.trim(), alias = $<HTMLInputElement>("c-alias").value.trim(), l4 = $<HTMLInputElement>("c-last4").value.trim();
  $("cp-bank").textContent = bank || name || "Banco"; $("cp-alias").textContent = alias || name || "Alias";
  $("cp-logo").textContent = bank ? bank.charAt(0).toUpperCase() : "💳"; $("cp-num").textContent = l4 ? "•••• " + l4 : "•••• ••••";
}
function showBgWrap() { $("c-color-wrap").style.display = cardBgMode === "color" ? "block" : "none"; $("c-grad-wrap").style.display = cardBgMode === "gradient" ? "block" : "none"; $("c-tpl-wrap").style.display = cardBgMode === "template" ? "block" : "none"; $("c-img-wrap").style.display = cardBgMode === "image" ? "block" : "none"; }
function downscaleImg(file: File, cb: (d: string) => void) {
  const r = new FileReader(); r.onload = (e) => { const im = new Image(); im.onload = () => { const max = 480, sc = Math.min(1, max / im.width), cw = Math.round(im.width * sc), ch = Math.round(im.height * sc); const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch; cv.getContext("2d")!.drawImage(im, 0, 0, cw, ch); try { cb(cv.toDataURL("image/jpeg", 0.7)); } catch { cb(e.target!.result as string); } }; im.onerror = () => {}; im.src = e.target!.result as string; }; r.readAsDataURL(file);
}
export function openCard(id?: any) {
  const c = id ? cardById(id) : null; cardEdit = c ? c.id : null;
  $("cardTitle").textContent = c ? "Editar tarjeta" : "Nueva tarjeta";
  $<HTMLInputElement>("c-name").value = c ? c.name : ""; $<HTMLInputElement>("c-bank").value = c ? c.bank || "" : "";
  $<HTMLInputElement>("c-alias").value = c && c.alias ? c.alias : ""; $<HTMLInputElement>("c-last4").value = c && c.last4 ? c.last4 : "";
  $<HTMLInputElement>("c-limit").value = c && c.limit ? String(c.limit) : ""; $<HTMLInputElement>("c-bal").value = c && c.balance ? String(c.balance) : "";
  $<HTMLInputElement>("c-cut").value = c ? String(c.cut || "") : ""; $<HTMLInputElement>("c-pay").value = c ? String(c.pay || "") : "";
  $<HTMLInputElement>("c-apr").value = c && c.apr ? String(c.apr) : "";
  $<HTMLInputElement>("c-min").value = c && c.min ? String(c.min) : ""; $<HTMLInputElement>("c-planned").value = c && c.planned ? String(c.planned) : "";
  cardPaySel = c ? cardPayType(c) : "min"; resetPills("c-paytype", cardPaySel); updatePayHint();
  cardStatus = c ? (c.active === false ? 0 : 1) : 1; resetPills("c-status", String(cardStatus));
  cardColor = c && c.color ? c.color : CARDCOLORS[0]; cardGrad = c && c.grad ? c.grad : CARDGRADS[0]; cardTpl = c && c.tpl != null ? c.tpl : 0; cardImg = c && c.img ? c.img : ""; cardBgMode = c && c.bg ? c.bg : "color";
  resetPills("c-bgmode", cardBgMode); showBgWrap(); buildColorPills(); buildGradPills(); buildTplPills(); updateCardPreview();
  openModal("cardModal");
}

/* ============ Pago rápido (Modificar pago) ============ */
let payCardId: any = null, paySel: "min" | "custom" = "min";
function updatePayModalHint() {
  const c = cardById(payCardId); if (!c) return;
  const min = +(c.min || 0); const cust = +$<HTMLInputElement>("pay-amt").value || 0;
  const val = paySel === "custom" ? cust : min; const diff = val - min;
  const h = $("pay-hint"); if (!h) return;
  h.innerHTML = "Pago a registrar: <b>" + money(val) + "</b>" + (min > 0 ? " · Mínimo " + money(min) + " · Diferencia " + (diff >= 0 ? "+" : "") + money(diff) : "") + (paySel === "custom" && min > 0 && cust < min ? ' · <span style="color:var(--warn)">⚠ menor al mínimo</span>' : "");
}
export function openPay(id: any) {
  const c = cardById(id); if (!c) return; payCardId = id;
  $("payTitle").textContent = "Modificar pago · " + c.name;
  $("pay-info").textContent = "Saldo " + money(c.balance || 0) + (c.min ? " · mínimo " + money(c.min) : "") + " · este pago aplica solo a este mes.";
  paySel = cardPayType(c); resetPills("pay-type", paySel);
  $("pay-custom-wrap").style.display = paySel === "custom" ? "block" : "none";
  $<HTMLInputElement>("pay-amt").value = paySel === "custom" ? String(cardPay(c) || c.min || "") : String(c.min || "");
  updatePayModalHint(); openModal("payModal");
}

/* ============ Simulador ============ */
let simCardId: any = null;
function renderSim() {
  const c = cardById(simCardId); if (!c) return; const pay = +$<HTMLInputElement>("sim-amt").value || 0; const s = paySim(c.balance || 0, c.apr || 0, pay); const o = $("sim-out");
  if (!s.ok) { o.innerHTML = '<div class="alert" style="margin-top:12px">Con ese pago la deuda no baja (no cubre los intereses). Sube el monto.</div>'; return; }
  const end = new Date(); end.setMonth(end.getMonth() + s.m);
  o.innerHTML = '<div class="lrow"><span>Meses para liquidar</span><b class="money">' + s.m + '</b></div><div class="lrow"><span>Fecha estimada</span><span class="money">' + end.toLocaleDateString("es-MX", { month: "short", year: "numeric" }) + '</span></div><div class="lrow"><span>Intereses totales</span><span class="money" style="color:var(--warn)">' + money(s.interes) + '</span></div><div class="lrow" style="border:0"><b style="font-weight:600">Total a pagar</b><b class="money">' + money(s.total) + '</b></div>';
}
export function openSim(id: any) {
  const c = cardById(id); if (!c) return; simCardId = id;
  $("simTitle").textContent = "Simular · " + c.name;
  $("sim-info").textContent = "Saldo " + money(c.balance || 0) + " · interés " + (c.apr || 0) + "% anual" + (c.min ? " · mínimo " + money(c.min) : "");
  $<HTMLInputElement>("sim-amt").value = String(cardPay(c) || c.min || ""); renderSim(); openModal("simModal");
}

/* ============ Cuenta ============ */
let acctEdit: number | null = null, acctType = "debito";
export function openAcct(id?: any) {
  const a = id ? DB.accounts.find((x) => x.id == id) : null; acctEdit = a ? a.id : null;
  $("acctTitle").textContent = a ? "Editar cuenta" : "Nueva cuenta";
  $<HTMLInputElement>("a-name").value = a ? a.name : ""; $<HTMLInputElement>("a-bank").value = a ? a.bank || "" : "";
  $<HTMLInputElement>("a-bal").value = a && a.balance ? String(a.balance) : "";
  acctType = a ? a.type : "debito"; resetPills("a-type", acctType); openModal("acctModal");
}

/* ============ Movimiento ============ */
let txType = "gasto", txMethod = "efectivo", txSrc: any = null, txCat = "Comida";
function buildCats(type: string) { const w = $("t-cat"); w.innerHTML = ""; (CATEGORIES as any)[type].forEach((c: string, i: number) => (w.innerHTML += '<button class="pill' + (i === 0 ? " sel" : "") + '" data-v="' + c + '">' + c + '</button>')); txCat = (CATEGORIES as any)[type][0]; pillGroup(w, (v) => (txCat = v)); }
function updateMethodUI() {
  const wrap = $("t-src-wrap"), lab = $("t-src-label"), box = $("t-src");
  if (txMethod === "efectivo") { wrap.style.display = "none"; const ef = DB.accounts.find((a) => a.type === "efectivo"); txSrc = ef ? ef.id : null; return; }
  wrap.style.display = "block"; box.innerHTML = "";
  const items = txMethod === "credito" ? DB.cards : DB.accounts.filter((a) => a.type !== "efectivo");
  lab.textContent = txMethod === "credito" ? "Tarjeta" : "Cuenta";
  if (!items.length) { box.innerHTML = '<div class="note" style="margin:0">No hay ' + (txMethod === "credito" ? "tarjetas" : "cuentas") + '. Agrégalas primero.</div>'; txSrc = null; return; }
  items.forEach((it, i) => (box.innerHTML += '<button class="pill' + (i === 0 ? " sel" : "") + '" data-v="' + it.id + '">' + esc(it.name) + '</button>'));
  txSrc = items[0].id; pillGroup(box, (v) => (txSrc = v));
}
export function openTx(type?: string, cat?: string) {
  txType = type || "gasto"; resetPills("t-type", txType); buildCats(txType); if (cat) { txCat = cat; resetPills("t-cat", cat); }
  txMethod = "efectivo"; resetPills("t-method", "efectivo"); updateMethodUI();
  $<HTMLInputElement>("t-amt").value = ""; $<HTMLInputElement>("t-note").value = ""; openModal("txModal"); setTimeout(() => $("t-amt").focus(), 250);
}

/* ============ Suscripción ============ */
let subEdit: number | null = null;
export function openSub(id?: any) {
  const s = id ? (DB.subs || []).find((x) => x.id == id) : null; subEdit = s ? s.id : null;
  $("subTitle").textContent = s ? "Editar suscripción" : "Nueva suscripción";
  $<HTMLInputElement>("s-name").value = s ? s.name : ""; $<HTMLInputElement>("s-amt").value = s && s.amount ? String(s.amount) : ""; $<HTMLInputElement>("s-day").value = s ? String(s.day || "") : "";
  openModal("subModal");
}

/* ============ Meta ============ */
let goalEdit: number | null = null;
export function openGoal(id?: any) {
  const g = id ? DB.goals.find((x) => x.id == id) : null; goalEdit = g ? g.id : null;
  $("goalTitle").textContent = g ? "Editar meta" : "Nueva meta";
  $<HTMLInputElement>("g-name").value = g ? g.name : ""; $<HTMLInputElement>("g-target").value = g && g.target ? String(g.target) : ""; $<HTMLInputElement>("g-saved").value = g && g.saved ? String(g.saved) : "";
  openModal("goalModal");
}

/* ============ Compra del súper → Finanzas ============ */
let buyMethod = "efectivo", buySrc: any = null, buyDone: (() => void) | null = null;
function updateBuyMethodUI() {
  const wrap = $("buy-src-wrap"), lab = $("buy-src-label"), box = $("buy-src");
  if (buyMethod === "efectivo") { wrap.style.display = "none"; const ef = DB.accounts.find((a) => a.type === "efectivo"); buySrc = ef ? ef.id : null; return; }
  wrap.style.display = "block"; box.innerHTML = "";
  const items = buyMethod === "credito" ? DB.cards : DB.accounts.filter((a) => a.type !== "efectivo");
  lab.textContent = buyMethod === "credito" ? "Tarjeta" : "Cuenta";
  if (!items.length) { box.innerHTML = '<div class="note" style="margin:0">No hay ' + (buyMethod === "credito" ? "tarjetas" : "cuentas") + '.</div>'; buySrc = null; return; }
  items.forEach((it, i) => (box.innerHTML += '<button class="pill' + (i === 0 ? " sel" : "") + '" data-v="' + it.id + '">' + esc(it.name) + '</button>'));
  buySrc = items[0].id; pillGroup(box, (v) => (buySrc = v));
}
/** Abre el flujo "¿registrar esta compra en Finanzas?". onDone se llama tras decidir. */
export function openBuyGrocery(onDone?: () => void) {
  buyDone = onDone || null; buyMethod = "efectivo"; resetPills("buy-method", "efectivo"); updateBuyMethodUI();
  $<HTMLInputElement>("buy-amt").value = ""; $<HTMLInputElement>("buy-note").value = ""; openModal("buyModal"); setTimeout(() => $("buy-amt").focus(), 250);
}

/* ============ Wiring de botones estáticos ============ */
export function initModals() {
  // tarjeta
  pillGroup($("c-status"), (v) => (cardStatus = +v));
  pillGroup($("c-paytype"), (v) => { cardPaySel = v as any; updatePayHint(); });
  ["c-min", "c-planned"].forEach((id) => $(id)?.addEventListener("input", updatePayHint));
  pillGroup($("c-bgmode"), (v) => { cardBgMode = v; showBgWrap(); buildColorPills(); buildGradPills(); buildTplPills(); updateCardPreview(); });
  ["c-name", "c-bank", "c-alias", "c-last4"].forEach((id) => $(id)?.addEventListener("input", updateCardPreview));
  $("c-imgbtn").onclick = () => $("c-imgfile").click();
  $<HTMLInputElement>("c-imgfile").onchange = (e: any) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; downscaleImg(f, (d) => { cardImg = d; cardBgMode = "image"; resetPills("c-bgmode", "image"); showBgWrap(); updateCardPreview(); }); };
  $("c-imgclear").onclick = () => { cardImg = ""; updateCardPreview(); };
  $("c-cancel").onclick = () => closeModal("cardModal");
  $("c-save").onclick = () => {
    const n = $<HTMLInputElement>("c-name").value.trim(); if (!n) { $("c-name").focus(); return; }
    const obj: any = { name: n, bank: $<HTMLInputElement>("c-bank").value.trim(), alias: $<HTMLInputElement>("c-alias").value.trim(), last4: $<HTMLInputElement>("c-last4").value.trim().slice(0, 4), limit: +$<HTMLInputElement>("c-limit").value || 0, balance: +$<HTMLInputElement>("c-bal").value || 0, apr: +$<HTMLInputElement>("c-apr").value || 0, cut: $<HTMLInputElement>("c-cut").value || "", pay: $<HTMLInputElement>("c-pay").value || "", min: +$<HTMLInputElement>("c-min").value || 0, planned: +$<HTMLInputElement>("c-planned").value || 0, payType: cardPaySel, color: cardColor, grad: cardGrad, tpl: cardTpl, img: cardImg, bg: cardBgMode, active: cardStatus === 1 };
    if (cardEdit) Object.assign(cardById(cardEdit)!, obj); else { obj.id = DB.cardSeq++; DB.cards.push(obj); }
    save(); closeModal("cardModal"); renderDinero("tarjetas");
  };

  // pago rápido
  pillGroup($("pay-type"), (v) => { paySel = v as any; $("pay-custom-wrap").style.display = paySel === "custom" ? "block" : "none"; updatePayModalHint(); });
  $("pay-amt").addEventListener("input", updatePayModalHint);
  $("pay-cancel").onclick = () => closeModal("payModal");
  $("pay-save").onclick = () => {
    const c = cardById(payCardId); if (!c) return;
    c.payType = paySel;
    if (paySel === "custom") c.planned = +$<HTMLInputElement>("pay-amt").value || 0;
    save(); closeModal("payModal"); renderDinero("tarjetas");
  };

  // simulador
  $("sim-amt").addEventListener("input", renderSim);
  $("sim-close").onclick = () => closeModal("simModal");
  $("sim-save").onclick = () => { const c = cardById(simCardId); if (!c) return; c.planned = +$<HTMLInputElement>("sim-amt").value || 0; c.payType = "custom"; save(); closeModal("simModal"); renderDinero("tarjetas"); };

  // cuenta
  pillGroup($("a-type"), (v) => (acctType = v));
  $("a-cancel").onclick = () => closeModal("acctModal");
  $("a-save").onclick = () => { const n = $<HTMLInputElement>("a-name").value.trim(); if (!n) { $("a-name").focus(); return; } const obj: any = { name: n, bank: $<HTMLInputElement>("a-bank").value.trim(), type: acctType, balance: +$<HTMLInputElement>("a-bal").value || 0 }; if (acctEdit) Object.assign(DB.accounts.find((x) => x.id == acctEdit)!, obj); else { obj.id = DB.accountSeq++; DB.accounts.push(obj); } save(); closeModal("acctModal"); renderDinero("debito"); };

  // movimiento
  pillGroup($("t-type"), (v) => { txType = v; buildCats(v); updateMethodUI(); });
  pillGroup($("t-method"), (v) => { txMethod = v; updateMethodUI(); });
  $("t-cancel").onclick = () => closeModal("txModal");
  $("t-save").onclick = () => {
    const a = +$<HTMLInputElement>("t-amt").value; if (!a || a <= 0) { $("t-amt").focus(); return; }
    const t: any = { id: DB.txSeq++, type: txType, amount: a, cat: txCat, note: $<HTMLInputElement>("t-note").value.trim(), date: new Date().toISOString(), method: txMethod };
    if (txMethod === "credito") t.cardId = txSrc; else t.acctId = txSrc;
    DB.tx.push(t); applyTx(t, 1); save(); closeModal("txModal"); renderDinero();
  };

  // suscripción
  $("s-cancel").onclick = () => closeModal("subModal");
  $("s-save").onclick = () => { const n = $<HTMLInputElement>("s-name").value.trim(); if (!n) { $("s-name").focus(); return; } const obj: any = { name: n, amount: +$<HTMLInputElement>("s-amt").value || 0, day: $<HTMLInputElement>("s-day").value || "" }; if (subEdit) Object.assign((DB.subs || []).find((x) => x.id == subEdit)!, obj); else { obj.id = DB.subSeq++; obj.active = true; DB.subs.push(obj); } save(); closeModal("subModal"); renderDinero("subs"); };

  // meta
  $("g-cancel").onclick = () => closeModal("goalModal");
  $("g-save").onclick = () => { const n = $<HTMLInputElement>("g-name").value.trim(); if (!n) { $("g-name").focus(); return; } const obj: any = { name: n, target: +$<HTMLInputElement>("g-target").value || 0, saved: +$<HTMLInputElement>("g-saved").value || 0 }; if (goalEdit) Object.assign(DB.goals.find((x) => x.id == goalEdit)!, obj); else { obj.id = DB.goalSeq++; DB.goals.push(obj); } save(); closeModal("goalModal"); renderDinero("metas"); };

  // compra de súper -> Finanzas
  pillGroup($("buy-method"), (v) => { buyMethod = v; updateBuyMethodUI(); });
  $("buy-skip").onclick = () => { closeModal("buyModal"); if (buyDone) buyDone(); };
  $("buy-save").onclick = () => {
    const a = +$<HTMLInputElement>("buy-amt").value; if (!a || a <= 0) { $("buy-amt").focus(); return; }
    const t: any = { id: DB.txSeq++, type: "gasto", amount: a, cat: "Supermercado", note: $<HTMLInputElement>("buy-note").value.trim() || "Compra del súper (MealPrep)", date: new Date().toISOString(), method: buyMethod };
    if (buyMethod === "credito") t.cardId = buySrc; else t.acctId = buySrc;
    DB.tx.push(t); applyTx(t, 1); save(); closeModal("buyModal"); if (buyDone) buyDone();
  };

  // cerrar al tocar el fondo
  ["blkModal", "cardModal", "payModal", "acctModal", "txModal", "subModal", "goalModal", "simModal", "buyModal"].forEach((id) => { const m = $(id); if (m) m.onclick = (e: any) => { if (e.target === m) closeModal(id); }; });
}
