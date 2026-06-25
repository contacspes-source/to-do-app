/**
 * pages/constancia.ts — racha, semana y hábitos.
 */
import { DB, save, dk } from "../database/store";
import { $, qsa } from "../utils/dom";
import { esc } from "../utils/format";
import { DAYL } from "../database/academic-data";

function computeStreak() { let n = 0, d = new Date(); if (!DB.history[dk(d)]) d.setDate(d.getDate() - 1); for (let i = 0; i < 400; i++) { if (DB.history[dk(d)]) { n++; d.setDate(d.getDate() - 1); } else break; } return n; }
function weekDates() { const t = new Date(); const mo = (t.getDay() + 6) % 7; const arr: Date[] = []; for (let i = 0; i < 7; i++) { const d = new Date(t); d.setDate(t.getDate() - mo + i); arr.push(d); } return arr; }

export function renderHabitos() {
  $("streakNum").textContent = String(computeStreak());
  const wd = weekDates(), today = new Date(); const w = $("week"); w.innerHTML = "";
  wd.forEach((d, i) => { const on = !!DB.history[dk(d)], fut = d > today && dk(d) !== dk(today); w.innerHTML += '<div class="wd"><div class="dot' + (on ? " on" : "") + '">' + (on ? "✓" : (fut ? "" : d.getDate())) + '</div><div class="dl">' + DAYL[i] + '</div></div>'; });
  const hl = $("habitList"); hl.innerHTML = "";
  DB.habits.forEach((h) => {
    let days = ""; wd.forEach((d, di) => { const on = DB.habitLog[h.id] && DB.habitLog[h.id][dk(d)] ? " on" : ""; days += '<button class="day' + on + '" data-h="' + h.id + '" data-k="' + dk(d) + '">' + DAYL[di] + '</button>'; });
    const box = document.createElement("div"); box.className = "habit";
    box.innerHTML = '<div class="hh"><span class="hn">' + esc(h.n) + '</span><span style="display:flex;align-items:center;gap:8px"><span class="hg">' + esc(h.g || "") + '</span><button class="hx" data-del="' + h.id + '" aria-label="Eliminar">×</button></span></div><div class="days">' + days + '</div>';
    hl.appendChild(box);
  });
  qsa<HTMLElement>(".day", hl).forEach((b) => { b.onclick = () => { const id = b.dataset.h!, key = b.dataset.k!; DB.habitLog[id] = DB.habitLog[id] || {}; DB.habitLog[id][key] = !DB.habitLog[id][key]; save(); renderHabitos(); }; });
  qsa<HTMLElement>(".hx", hl).forEach((b) => { b.onclick = () => { if (confirm("¿Eliminar este hábito?")) { DB.habits = DB.habits.filter((x) => x.id != (b.dataset.del as any)); save(); renderHabitos(); } }; });
  const s = computeStreak(), doneTotal = DB.tasks.filter((t) => t.done).length;
  const ach: [string, string, boolean, string][] = [["Primer paso", "Completa tu primera tarea", doneTotal >= 1, "1"], ["En marcha", "3 días seguidos", s >= 3, "3"], ["Semana firme", "7 días seguidos", s >= 7, "7"], ["Constancia", "Completa 30 tareas", doneTotal >= 30, "30"]];
  const al = $("achList"); al.innerHTML = ""; ach.forEach((a) => { al.innerHTML += '<div class="ach ' + (a[2] ? "un" : "lock") + '"><div class="am">' + (a[2] ? "✓" : a[3]) + '</div><div><div class="at">' + a[0] + '</div><div class="ad">' + a[1] + '</div></div></div>'; });
}

export function initConstancia() {
  $("addHabit").onclick = () => { const inp = $<HTMLInputElement>("newHabit"), v = inp.value.trim(); if (!v) return; DB.habits.push({ id: DB.habitSeq++, n: v, g: "" }); inp.value = ""; save(); renderHabitos(); };
  $("newHabit").addEventListener("keydown", (e: any) => { if (e.key === "Enter") $("addHabit").click(); });
}
