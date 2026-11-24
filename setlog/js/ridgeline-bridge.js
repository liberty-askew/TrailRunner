// Ridgeline integration. Kept in its own file so the rest of Setlog stays as its author wrote it.
//
// Ridgeline (served from the parent folder, same site) hands a planned strength or bike session
// over through localStorage key `ridgeline-handoff`:
//   { at, key, routineName, date: 'YYYY-MM-DD', start: bool,
//     items: [{ name, type, category, muscles, perSide, modality, sets, reps, time, rest }] }
// This module makes sure the exercises and a matching routine exist, adds the routine to the
// week plan for that date and (if it's today) starts the session. Ridgeline reads finished
// sessions straight from this app's IndexedDB, so nothing here writes back to Ridgeline.
//
// Routine ids made for Ridgeline are remembered in localStorage `ridgeline-routines`
// ({ key: routineId }) so the same routine is reused, including any edits made to it here.

const HANDOFF = 'ridgeline-handoff';
const ROUTINES = 'ridgeline-routines';
const MAX_AGE_MS = 15 * 60 * 1000;

const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

function addBackLink() {
  const bar = document.querySelector('.tabbar');
  if (!bar || bar.querySelector('.rl-back')) return;
  const a = document.createElement('a');
  a.href = '../#today';
  a.className = 'rl-back';
  a.setAttribute('aria-label', 'Back to Ridgeline');
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20 L8 9 L12 14 L17 5 L22 20 Z"/></svg><span>Ridgeline</span>';
  bar.prepend(a);
}

const PLAN = 'ridgeline-plan';            // { at, today, entries: [{ date, key, routineName, items }] }
const OWNED = 'ridgeline-plan-entries';   // { date: [planEntryId] } entries this bridge added to the week plan

export async function ridgelineBridge({ S, uid, putEx, putRoutine, startSession, setMeta }) {
  addBackLink();
  const map = read(ROUTINES) || {};

  // Exercises: reuse by name (case-insensitive), otherwise add as custom exercises.
  const byName = new Map([...S.ex.values()].map(e => [e.name.trim().toLowerCase(), e]));
  async function exerciseFor(it) {
    let ex = byName.get(String(it.name).trim().toLowerCase());
    if (!ex) {
      ex = { id: uid(), name: it.name, type: it.type, category: it.category || 'Strength', muscles: it.muscles || [],
        perSide: !!it.perSide, modality: it.modality || null, archived: false, custom: true };
      await putEx(ex);
      byName.set(ex.name.toLowerCase(), ex);
    }
    return ex;
  }
  // One routine per Ridgeline workout (Strength A/B per phase and kit, the bike ride, or a one-off edited session).
  // Edits made here stick, because an existing routine is never overwritten.
  async function routineFor(h) {
    let r = map[h.key] && S.routines.find(x => x.id === map[h.key]);
    if (r) return r;
    const items = [];
    for (const it of h.items) {
      const ex = await exerciseFor(it);
      const target = { sets: it.sets || 3, rest: it.rest ?? 60 };
      if (it.reps != null) target.reps = it.reps;
      if (it.time != null) target.time = it.time;
      items.push({ uid: uid(), exId: ex.id, group: null, target });
    }
    r = { id: uid(), name: h.routineName, created: Date.now(), items };
    await putRoutine(r);
    map[h.key] = r.id;
    write(ROUTINES, map);
    return r;
  }

  // 1. Mirror the next four weeks of the Ridgeline plan into this app's week plan.
  //    Only entries this bridge added are ever removed, and nothing on or before today is removed.
  const ps = read(PLAN);
  if (ps && Array.isArray(ps.entries)) {
    const today = ps.today;
    const owned = read(OWNED) || {};
    const plan = { ...(S.meta.plan || {}) };
    const nextOwned = {};
    for (const [date, ids] of Object.entries(owned)) {
      if (date > today && plan[date]) {
        plan[date] = plan[date].filter(e => !ids.includes(e.id));
        if (!plan[date].length) delete plan[date];
      } else nextOwned[date] = ids;
    }
    for (const h of ps.entries) {
      if (!h.items || !h.items.length) continue;
      const r = await routineFor(h);
      const day = (plan[h.date] || []).slice();
      if (!day.some(e => e.routineId === r.id)) {
        const id = uid();
        day.push({ id, routineId: r.id });
        (nextOwned[h.date] = nextOwned[h.date] || []).push(id);
      }
      plan[h.date] = day;
    }
    await setMeta('plan', plan);
    write(OWNED, nextOwned);
  }

  // 2. A session handed over from Ridgeline ("Log it in Setlog").
  const h = read(HANDOFF);
  if (!h) return;
  localStorage.removeItem(HANDOFF);               // one-shot, so a reload never starts it twice
  if (!h.at || Date.now() - h.at > MAX_AGE_MS || !Array.isArray(h.items) || !h.items.length) return;
  const r = await routineFor(h);
  if (h.date) {
    const plan = { ...(S.meta.plan || {}) };
    const day = (plan[h.date] || []).slice();
    if (!day.some(e => e.routineId === r.id)) day.push({ id: uid(), routineId: r.id });
    plan[h.date] = day;
    await setMeta('plan', plan);
  }
  if (h.start) await startSession(r.id);
  else location.hash = '#/train';
}
