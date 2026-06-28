/**
 * Pruebas de la lógica pura (sin UI): finanzas y calificaciones.
 * Blindan los cálculos que sostienen alertas, pagos y promedios.
 */
import { describe, it, expect } from "vitest";
import { paySim, cardPay, requiredThisCycle, paidThisCycleAmount, remainingThisCycle } from "../src/finance/cards";
import { earned, currentGrade, remainingWeight, neededFor } from "../src/academics/grades";

describe("finance/cards", () => {
  it("paySim: liquida sin intereses", () => {
    const r = paySim(1000, 0, 500);
    expect(r.ok).toBe(true);
    expect(r.m).toBe(2);
    expect(r.interes).toBe(0);
  });
  it("paySim: pago insuficiente con interés = nunca termina", () => {
    expect(paySim(1000, 120, 5).ok).toBe(false);
  });
  it("cardPay: usa el mínimo si no hay pago sin intereses", () => {
    expect(cardPay({ min: 200 } as any)).toBe(200);
  });
  it("cardPay: usa el pago sin intereses cuando está configurado", () => {
    expect(cardPay({ min: 200, planned: 500 } as any)).toBe(500);
  });
  it("remainingThisCycle = requerido - pagado en el ciclo", () => {
    const cut = new Date().getDate(); // corte hoy → el ciclo inicia hoy
    const card: any = { min: 0, planned: 800, cut, payments: [{ date: new Date().toISOString(), amount: 500 }] };
    expect(requiredThisCycle(card)).toBe(800);
    expect(paidThisCycleAmount(card)).toBe(500);
    expect(remainingThisCycle(card)).toBe(300);
  });
  it("remainingThisCycle = 0 cuando el pago quedó cubierto", () => {
    const cut = new Date().getDate();
    const card: any = { min: 300, planned: 0, cut, payments: [{ date: new Date().toISOString(), amount: 300 }] };
    expect(remainingThisCycle(card)).toBe(0);
  });
});

describe("academics/grades", () => {
  const c: any = { evals: [{ weight: 50, grade: 80 }, { weight: 50, grade: null }] };
  it("earned: puntos acumulados", () => { expect(earned(c)).toBeCloseTo(40); });
  it("currentGrade: promedio de lo calificado", () => { expect(currentGrade(c)).toBe(80); });
  it("remainingWeight: peso sin calificar", () => { expect(remainingWeight(c)).toBe(50); });
  it("neededFor(90): necesita 100 en lo que falta", () => { expect(neededFor(c, 90).need).toBe(100); });
  it("neededFor(70): alcanzable", () => { const n = neededFor(c, 70); expect(n.possible).toBe(true); expect(n.need).toBe(60); });
});
