// Ridgeline integration. Kept in its own file so the rest of Lua stays as its authors wrote it.
//
// Ridgeline (the training app this folder is served from) keeps its state in localStorage
// `ridgeline-state-v1`. Period starts logged there ("Period started today", or a day's check-in)
// are added to Lua here, so both apps show the same periods. Ridgeline reads Lua's own IndexedDB
// for periods logged in Lua, so nothing here writes back to Ridgeline.
import { db, initializeDatabase } from './db';

const RIDGELINE_STATE = 'ridgeline-state-v1';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function iso(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

function addBackLink(): void {
  if (document.querySelector('.rl-back')) return;
  const a = document.createElement('a');
  a.href = '../#today';
  a.className = 'rl-back';
  a.textContent = '‹ Ridgeline';
  a.setAttribute('aria-label', 'Back to Ridgeline');
  Object.assign(a.style, {
    position: 'fixed', left: '10px', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', zIndex: '1000',
    background: '#2E4BFF', color: '#FFFFFF', font: '600 13px/1 -apple-system, system-ui, sans-serif',
    padding: '8px 12px', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.15)',
  });
  document.body.appendChild(a);
}

export async function ridgelineBridge(): Promise<void> {
  addBackLink();
  let state: { cycle?: { on?: boolean; starts?: unknown[]; plen?: number } } | null = null;
  try { state = JSON.parse(localStorage.getItem(RIDGELINE_STATE) || 'null'); } catch { state = null; }
  const c = state && state.cycle;
  if (!c || !c.on || !Array.isArray(c.starts) || !c.starts.length) return;

  await initializeDatabase();
  const periods = await db.periods.toArray();
  const today = iso(new Date());
  const plen = Math.max(2, Math.min(10, Number(c.plen) || 5));
  const toAdd: { startDate: string; endDate: string | null; notes: string }[] = [];
  for (const s of c.starts) {
    if (typeof s !== 'string' || !DATE_RE.test(s) || s > today) continue;
    // Already there (same period logged in both apps, give or take a few days)?
    const known = periods.concat(toAdd).some((p) =>
      Math.abs(daysBetween(p.startDate, s)) <= 3 || (p.startDate <= s && (p.endDate ?? today) >= s));
    if (known) continue;
    const end = addDays(s, plen - 1);
    toAdd.push({ startDate: s, endDate: end < today ? end : null, notes: 'Added from Ridgeline' });
  }
  if (toAdd.length) await db.periods.bulkAdd(toAdd);
}
