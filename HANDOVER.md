# Ridgeline – handover

Status as of 24 November 2026. Read this, then `README.md`, then `tests/README.md`.

## What it is

Ridgeline is a training-plan app **for women training for long-distance and ultra events (40 km to 100 km+,
including multi-day mountain races)**. It builds a periodised week-by-week plan, tells you each day's session,
lets you tick sessions off, logs strength work, tracks the menstrual cycle, and reports on progress. Bone health,
energy availability, fuelling, iron, cycle and life stage are part of the plan, not add-ons.

The owner is a software engineer and experienced trail/ultra runner, and is the first user: she's training for
a 3-day, 100 km Alpine run in summer 2027, starting with a 50k block, with injury prevention as the priority. She
plans to share the app with friends. She is technical (maths degree, software background), likes direct answers,
and expects claims about training to be backed by research, with honesty about where evidence is thin.

## Architecture in one paragraph

A Progressive Web App with **no build step and no server**. `index.html` is a markup shell; `css/app.css` holds all
styles; `js/01…18` are classic scripts loaded in numbered order that share one global scope (top-level
declarations in one file are visible to later files). All user data lives on the device in `localStorage` and
IndexedDB. Hosted on GitHub Pages, deployed by a GitHub Actions workflow that runs the tests, builds the bundled
Lua app, and publishes. Installed to the phone via "Add to Home Screen" (works offline via `sw.js`).

## Repository map

```
index.html                 shell + one inline <svg><symbol id="topo"> contour map reused across the UI
css/app.css                styles; colour tokens on :root, dark mode via prefers-color-scheme and [data-theme]
js/01-dates.js             date helpers (iso, parse, addDays, mondayOf, DN, fmtShort…)
js/02-plan.js              TYPES, GOALS, TAPER, buildPlan(), layout(), pickGym() – the plan generator
js/03-strength.js          exercise library XL, SLOTS A/B, equipment kits, prescribe(), plyoFor(), strengthExercises()
js/04-workouts.js          workout() – text, steps and tips for every session type; fuelSteps()
js/05-state.js            state, load/save, rebuild(), sessStatus(), inPause(), logEvent()
js/06-cycle.js             cycleInfo(), phases, check-ins (SYMS), Today cycle card, fuelling/late-period prompts
js/07-export.js            CSV/zip export (daily, sessions, events)
js/08-reports.js           weekly + monthly reports, summaries, bars, analysis
js/09-cycle-profile.js     tough-day profile, auto/ask/remind rearranging, broad-profile warning
js/10-onboarding.js        6-step first-run setup
js/11-replan.js            easing after missed weeks/pauses; guardFuture() re-applies the spike cap
js/11a-health.js           women's health: bone risk, energy check, life stage, iron, heat, pain gate, fuel targets
js/12-ui.js                render(), Today/Plan/Progress (journey map)/Setup, sheets, hero cards
js/13-import.js            FIT/GPX/TCX/zip parsing and manual import
js/14-garmin.js            intervals.icu pull (activities) and push (planned workouts)
js/15-setlog.js            Setlog bridge (Ridgeline side)
js/16-lua.js               Lua bridge (Ridgeline side)
js/17-science.js           ☰ menu, science page, "How the science differs for women" report
js/18-events-boot.js       click/change handlers, pause/illness, boot
setlog/                    Setlog strength logger (third-party, see below) + js/ridgeline-bridge.js
lua/                       Lua period calendar (React/TS, MIT) + src/ridgelineBridge.ts; built by Actions
tests/                     node:test suite (29 tests), see tests/README.md
.github/workflows/pages.yml  test → build Lua → assemble _site → deploy to Pages
sw.js                      Ridgeline service worker; VERSION must be bumped on every change
manifest.webmanifest, icons/
```

## Running, testing, deploying

- **Tests:** `npm test` (Node ≥ 22.6, nothing to install). `tests/helpers.js` loads every `js/*.js` file into a
  `vm` sandbox with a fixed "today" (2026-11-10), fake DOM and fake storage, and exposes every function and
  top-level `const`/`let`. Use `load({state, today, fetch, indexedDB, localStorage})`, `baseState()`,
  `doWeek(app, n, frac, until)`, `text(html)`.
- **Locally:** `python3 -m http.server 8000` in the repo (service workers need http).
- **Deploy:** push to `main`. Pages source must be set to **GitHub Actions** (repo Settings → Pages). The
  workflow fails before publishing if tests fail.
- **Every change:** bump `VERSION` in `sw.js` (currently `ridgeline-v21`) so phones pick it up. If you add a
  `js/` file, add a `<script>` tag in `index.html` **and** add it to `CORE` in `sw.js`.

## State and storage

- `localStorage["ridgeline-state-v1"]` – everything: `settings` (goal, dates, runDays, longDay, baseKm, longest,
  raceVert, weekVert, gym, bike, kits{home,gym}, strLoc{A,B}, hotRace), `log` (per session id: status, actual,
  rpe, note, km, secs, ascent, src, key, sl{…Setlog}, carbs, gi, wb, wa), `moves`, `swaps`, `exOver`, `loc`,
  `extras`, `checkins` (per date: energy, sym[]), `cycle` (on, starts[], len, plen, hc, profile{windows, sym,
  impact, mode}, protect[]), `health` (stage, bone{answers,score,date}, energy{…}, iron{date,ferritin},
  ironLog[], gateUntil), `pause`, `pauses[]`, `pending[]`, `events[]`, `reports{seen,weeks}`.
- Session ids are `YYYY-MM-DD-type` from the **planned** date; moves don't change ids.
- `ridgeline-icu` – intervals.icu API key and sync state. Kept out of backups/exports deliberately.
- Bridges: `ridgeline-handoff`, `ridgeline-plan`, `ridgeline-plan-entries`, `ridgeline-routines`.
- IndexedDB: `setlog` (Setlog's own), `lua-period-tracker` (Lua's own). Ridgeline opens them **without a version
  and aborts any upgrade**, so it never creates or migrates them.
- There is **no migration layer**. New fields rely on defaults (`Object.assign({...defaults}, saved)` in
  `loadLocal` and backup import). Add defaults in both places when you add top-level state.

## How the plan works (key rules)

- ~8%/week build, recovery week every 4th week (75%), taper 1–3 weeks (`TAPER`), multi-day goal has 2 camp
  weekends at 8 and 4 weeks out, each followed by a recovery week.
- **Spike guard:** no run > 10% over the longest of the previous 30 days (Frandsen 2025); re-applied after easing.
- Moderate/high **bone risk** or peri/post-menopause → 5% build, 5% spike cap, recovery every 3rd week
  (`healthRules()` in `11a-health.js`).
- Trail goals: time-on-feet long runs, weekly vertical targets, progressive descents, power-hike sessions.
- Strength twice a week on quality-run days, never in the 48 h before the long run or the day after;
  plyometrics first; home and gym versions; phase progression 3×10 → 3×6.
- Re-planning: missed week (<50%) → 65% easy-only next week, +15%/week back; partial (50–80%) → 90%; 7+ days
  without a run or an illness/injury pause → eased return.
- Cycle: symptom-led, not phase-led. Default mode "ask me first"; broad tough-day profiles (≥7 days) warn.
- Women's health: energy check every 8 weeks; iron every 6 months (3 with heavy periods/fatigue); fuel targets
  on runs ≥75 min; drink to thirst with before/after weight check; shin/bone pain on 2 days in 14 → pause prompt;
  heat acclimation 2 weeks before taper for hot races.

## Evidence base

The in-app science page (`js/17-science.js`) is the source of truth for rationale and links, including the
women-vs-men comparison table (`SEX_DIFF`). A longer report exists as a Claude Doc:
"Ridgeline for women: what the female-specific evidence changes". Principles the owner cares about:
- Summaries in our own words, with links; no long quotations.
- Say when something is coaching practice rather than research, and when data are mostly from men.
- Figures verified so far are listed in that report's caveats; Tiller 2021's ~4% ultra gap and 44%/36% fibre
  figures are as reported by the review, not independently checked.
- The energy check is **not** the LEAF-Q (copyrighted, validated); it's our own wording covering the same areas.

## Third-party code

- **Setlog** (`setlog/`) by Jake (github.com/Jakefp/Workout). **The repo has no licence.** The owner says she
  knows him; written permission or an MIT licence on his repo is still outstanding. Credited in README,
  `setlog/NOTICE.md` and Setup. Changes are kept minimal and listed in `setlog/NOTICE.md`.
- **Lua** (`lua/`), MIT, github.com/createusernam/lua-period-tracker. Changes listed in `lua/NOTICE.md`.
  It needs `npm ci && npx vite build`, done in Actions. **It has never been built in CI yet** – the first run
  is untested. If `lua/src/ridgelineBridge.ts` changes, regenerate `tests/lua-bridge-shim.ts` (command in README).

## Known gaps and risks

- **Nothing has been tested on a real phone.** All testing is in the Node sandbox. Safari/iOS needs a pass
  (service workers, storage, file import, share sheet). This is the top priority.
- **Security:** the intervals.icu key is in plain `localStorage`, and the bundled Lua page loads Google's sign-in
  script on the same origin. Either remove Lua's Google Drive feature in the bundled copy or move the key to
  storage a third-party script can't reach.
- No automatic backups; data is lost if browser storage is cleared.
- Setup is long and could be split.
- The claude.ai preview artifact is a bundled snapshot; Garmin, Setlog and Lua don't work there.
- intervals.icu sync and Garmin workout push were tested only against mocked responses.

## Open requests and proposals (not built)

1. **Goals for a 40–100 km+ women's app:** drop 5k/10k/half, keep marathon as the shortest, add a single-day
   100 km goal alongside 50k and multi-day. Proposed; owner hasn't confirmed.
2. **Weight-training changes** (proposed, not built): heavy bilateral hip/spine lift (trap-bar/DB deadlift or
   goblet squat to ~80–85% 1RM by Build), upper body (row + push/press), pack carries/step-ups at race pack
   weight in Peak, optional pelvic-floor set, keep heavy through Peak with fewer sets, heavier sooner and jump
   landings for peri/post-menopause, no new plyometrics during low energy availability. Sample sessions are in
   the chat; the bridge to Setlog would need the new exercises in `SL`/`XL` and fresh routine keys.
3. **Promo materials** (poster, promo doc, tour) don't yet say the app is for women.
4. Other suggestions on the list: optional heart-rate ceiling for easy runs, race-day kit/logistics checklist,
   automatic backup reminders, weekly report notification, simplifying Setup, learning from logs over time.

## Gotchas

- `status` was renamed `sessStatus` when the code was split (a global `status` clashes with `window.status`).
- In tests, arrays/objects created inside the sandbox fail `assert.deepEqual` against plain literals (different
  realm prototypes) – compare via `JSON.parse(JSON.stringify(x))`.
- `rebuild()` is wrapped later (`_rebuild`) to sync the Setlog plan; `replan()` and `cycleRearrange()` run inside
  it. Order matters: buildPlan → moves/swaps → replan (+ guardFuture) → cycleRearrange → Setlog plan sync.
- Strength routine keys for Setlog are versioned (`strength2-…`); bump the prefix when exercise lists change so
  Setlog creates fresh routines instead of reusing stale ones.
- The three service workers (Ridgeline, Setlog, Lua) share the origin; each only deletes its own caches, and
  Ridgeline's skips `/setlog/` and `/lua/` requests. Keep it that way.
- Keep the writing style of in-app text: plain, direct, British spelling, no jargon without explanation,
  honest about evidence strength.

## Artifacts and documents (claude.ai)

- App preview: https://claude.ai/artifact/Hwm6EGeenQFfuUrhrtcZXx (bundled snapshot)
- App tour v2 (with topographic trail): https://claude.ai/artifact/5ujGUVabNDx8dAxEHWNoPa
- Promo poster (Design canvas): https://claude.ai/artifact/Gp2Wj9xey6Hppg5mUUE4tD
- Promo doc for friends: https://claude.ai/artifact/DCw2ddynJnKqvdz2xGnQRM
- Women-specific evidence report: https://claude.ai/artifact/XeD8XPFap1inPthycawp4B
