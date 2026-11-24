# Ridgeline – ultra training for women

Ridgeline is built for women training for long-distance and ultra events (40 km to 100 km+, including
multi-day mountain races). Bone health, energy availability, fuelling, iron, the menstrual cycle and life
stage are part of the plan from the first screen, not add-ons.

A week-by-week running training plan you can tick off as you go. Pick a goal (5k to 50k trail),
a race date and how much you're running now, and it builds a periodised plan with hills, tempo,
long runs, back-to-backs, strength and bike cross-training. Log distance, effort (RPE) and notes,
and watch your progress fill in as a ridgeline.

Runs from your Garmin can be imported as .fit, .gpx, .tcx or the .zip Garmin Connect gives you,
and they tick off the matching session automatically.

It's a Progressive Web App: plain HTML/CSS/JS, no build step, no server, no account.
Data lives on your phone (localStorage), with export/import for backups.

## Project layout

```
index.html             page shell: markup, tab bar, script tags (no logic)
css/app.css            all styles; colour tokens on :root, dark mode via prefers-color-scheme / [data-theme]
js/01-dates.js         date helpers
js/02-plan.js          session types, goals and the plan generator (volume, taper, camps, spike guard)
js/03-strength.js      exercise library, equipment kits, phase prescriptions, plyometrics
js/04-workouts.js      the text of every session (steps, effort, tips)
js/05-state.js         saved state, rebuild(), event log
js/06-cycle.js         cycle tracking, check-ins, Today cycle card
js/07-export.js        CSV/zip export
js/08-reports.js       monthly and weekly reports and their analysis
js/09-cycle-profile.js tough-day profile and automatic rearranging
js/10-onboarding.js    first-run setup
js/11-replan.js        easing after missed training
js/12-ui.js            rendering, Today/Plan/Progress screens, Setup, sheets
js/13-import.js        FIT/GPX/TCX/zip import
js/14-garmin.js        intervals.icu sync and push
js/15-setlog.js        Setlog bridge (strength logger)
js/16-lua.js           Lua bridge (period calendar)
js/17-science.js       ☰ menu and the science page
js/18-events-boot.js   click handlers and start-up
setlog/                Setlog strength logger by Jake, connected to Ridgeline (see setlog/NOTICE.md)
lua/                   Lua period calendar (MIT), built by GitHub Actions (see lua/NOTICE.md)
.github/workflows/     build-and-deploy workflow for GitHub Pages
manifest.webmanifest   app name, icons, colours for "Add to Home Screen"
sw.js                  service worker – offline support and caching
icons/                 app icons (192, 512, maskable, Apple touch)
.nojekyll              tells GitHub Pages to serve files as-is
```

The `js/` files are classic scripts loaded in numbered order; top-level declarations in one file are
available to the ones after it, so there is no build step and no import/export boilerplate. Keep new
code in the file whose topic it belongs to, and add any new file to the script tags in `index.html`
and the `CORE` list in `sw.js`.

## Put it on your phone

1. Create a new **public** repo on GitHub (e.g. `ridgeline`) and push these files:
   ```bash
   git init
   git add .
   git commit -m "Ridgeline: first version"
   git branch -M main
   git remote add origin https://github.com/<your-username>/ridgeline.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   The workflow in `.github/workflows/pages.yml` builds the Lua period calendar and publishes
   Ridgeline, Setlog and Lua together on every push to `main` (watch it under the **Actions** tab).
3. After a minute it's live at `https://<your-username>.github.io/ridgeline/`.
4. Open that link on your phone:
   - **iPhone (Safari):** Share → *Add to Home Screen*
   - **Android (Chrome):** ⋮ menu → *Install app* / *Add to Home screen*

It then opens full-screen like a native app and works offline.

## How the plan is built (and the evidence behind it)

The app explains all of this in plain language under **☰ → The science behind your plan**, with
an evidence rating and links to the studies for each decision.

Changes from an evidence review (Nov 2026). Most training studies are on non-ultra or mostly male
samples, so treat these as well-reasoned defaults, not guarantees.

- **Long-run spike guard.** No planned run is more than 10% longer than your longest run in the previous
  30 days. In 5,205 runners, single-run spikes like this were linked to overuse injury while week-to-week
  mileage change was not (Frandsen et al., BJSM 2025). The weekly report also flags spikes in what you
  actually ran, plus a soft warning if a week is over 1.5× your 4-week average.
- **Progression and taper.** About 8% a week with a recovery week every fourth week; tapers cut volume
  ~40–60% over 2–3 weeks while keeping intensity and frequency (Bosquet et al. 2007).
- **Mountain specificity for trail goals.** Long runs are prescribed by time on feet with a climbing
  target; each week has a vertical target that builds like volume; hill sessions add progressively longer
  controlled descents (repeated-bout effect), with no new big descents in the taper; Peak long climbs are
  3–5 × 6–10 min; trail Build/Peak weeks include power-hike intervals or a long uphill hike with poles.
- **Multi-day goal.** "Multi-day mountain" adds back-to-backs that grow from 60% to 75% of the long run,
  two camp weekends (three long days in a row) 8 and 4 weeks before the race, each followed by a
  recovery week, and a 3-week taper.
- **Strength.** Twice a week on your quality-run days, never in the 48 h before the long run or the day
  after it. Each session starts with plyometrics (pogo hops → single-leg hops/bounding → depth jumps)
  and B days add heavy bent-knee calf raises for the soleus. Loads move from moderate (3 × 10) to heavy
  (~80–85% of max, 3 × 6). Strength training reduced injuries in runners who stuck with it (Desai 2023;
  Leppänen 2024), and heavy loads and plyometrics improve running economy (Llanos-Lagos 2024).
  Nordics are now an optional low-dose swap (leg curl or slider curl by default) and Copenhagen planks,
  tibialis raises and hip airplanes are 2-set accessories.
- **Menstrual cycle.** Symptom-led rather than phase-led, as recommended (McNulty 2020; Colenso-Semple
  2023). A cycle over 35 days prompts a fuelling check; over 90 days without a period prompts a GP visit
  (low energy availability / REDs). "Bone pain" can be logged and prompts a check-up if it recurs. If you
  use hormonal contraception, phase labels and period-based prompts are switched off.

Worth reviewing with a sports physio or coach: a baseline strength screen, any history of bone stress,
Achilles or shin problems, the camp and vertical progression, and pack weight for the race.

## Strength logging with Setlog

The `setlog/` folder holds **Setlog** by Jake ([github.com/Jakefp/Workout](https://github.com/Jakefp/Workout)),
a set-by-set strength, cardio and bodyweight logger, included with his permission. See `setlog/NOTICE.md`
for exactly what was changed to connect it.

- Every strength session is a full workout built for your plan's phase: higher reps at moderate weight in
  Base, heavier in Build, heavy and low-rep in Peak, two lighter sets in recovery weeks and the taper.
  Holds get longer and bodyweight moves get more reps as you progress.
- Every strength session has a **home** and a **gym** version. Set up both kits in **Setup** (home
  defaults to dumbbells and bands, gym to a full gym) and where Strength A and B usually happen; switch
  any single day with the *At home / At the gym* buttons on the Today card or in the workout sheet.
  Each version uses the best exercise its kit allows, and becomes its own pre-filled Setlog workout
  (e.g. "Ridgeline · Strength A · Build · Home"). Any exercise can also be swapped for a single session.
- The next four weeks of strength and bike sessions appear in Setlog's own week plan automatically,
  so you can open Setlog, tap **Start**, and just fill in weights and reps.
- **Log it in Setlog** on a Strength A/B or bike session opens Setlog with that session's exercises,
  sets and reps ready (or starts it straight away if it's today). The routine is reused next time,
  including any changes you make to it in Setlog.
- When you come back to Ridgeline, finished Setlog sessions tick off the matching planned session
  with time, effort (Setlog's 1–5 becomes RPE), sets, kg lifted and any new personal bests.
- Weekly and monthly reports gain a strength section, and Setlog's bodyweight log shows there and in `daily.csv`.
- **Export backup** in Ridgeline includes Setlog's data too, and **Import backup** restores both.
- Setlog keeps its own storage and service worker, so it also works on its own at `…/setlog/`.

## Garmin sync via intervals.icu (automatic)

Garmin isn't accepting new API partners, so Ridgeline syncs through [intervals.icu](https://intervals.icu),
a free training site that already has a Garmin connection.

1. Create a free intervals.icu account.
2. In intervals.icu **Settings → Connections**, connect **Garmin** directly (not via Strava:
   Strava-sourced activities can't be passed on). Tick **Upload planned workouts** if you want
   Ridgeline sessions on your watch.
3. In intervals.icu **Settings → Developer Settings**, generate an API key.
4. In Ridgeline **Setup → Garmin sync**, paste the key and tap **Connect**.

After that, Ridgeline checks for new activities whenever you open it:

- a run, ride or strength session on the same day as an unfinished planned session of that kind is ticked off
  automatically, with distance, moving time, climb and (if set in intervals.icu) RPE
- if the nearest planned session is on a different day, it waits in a "to match" banner on Today
- activities with no planned session nearby are logged as extras

With **Send planned sessions to my watch** on, the next two weeks of sessions are written to your
intervals.icu calendar (updated when you move or swap a session), and intervals.icu uploads them to
Garmin Connect. Workout steps use your intervals.icu heart-rate zones (Z1–Z5), so set those up there.

The API key is stored only on your phone, separately from your training data, and is never included
in backups or CSV exports.

## Importing activity files (manual)

Garmin isn't currently accepting new API applications, so Ridgeline imports activity files instead.

1. On [connect.garmin.com](https://connect.garmin.com) (in your phone's browser or on a computer), open an activity.
2. Click the ⚙ / ⋯ menu → **Export Original** (a .zip with the .fit inside) or **Export to GPX/TCX**.
3. In Ridgeline tap **Import**, pick one or more files, and confirm which planned session each one was.

Ridgeline reads the distance, moving time, pace and climb, fills in the log, and ticks the session off.
Runs that don't match a planned session can be logged as extras and still count towards your weekly km.
Importing the same activity twice is detected and skipped.

## Period calendar with Lua

The `lua/` folder holds **Lua — Private Period Tracker**
([github.com/createusernam/lua-period-tracker](https://github.com/createusernam/lua-period-tracker), MIT licence):
a full period calendar with predictions, history, cycle-length charts and a year view. It's connected
the same way as Setlog: same site, its own storage, a small bridge (see `lua/NOTICE.md`).

- Open it from **Setup → Period calendar** or the link on the cycle card. A **‹ Ridgeline** button takes you back.
- Periods you log in Lua are added to Ridgeline's cycle tracking when you return (anything within three
  days of a period Ridgeline already has counts as the same one), and Lua's finished periods set your
  typical period length.
- Periods you log in Ridgeline appear in Lua the next time you open it.
- Already logging in Lua and haven't turned on cycle-aware training? **Use Lua's periods** in Setup does it in one tap.
- Ridgeline's backup includes Lua's periods, and restore puts them back.
- Lua is a React app, so it needs building: GitHub Actions does this for you on every push.

## Getting started

New users get a five-step setup: goal and race, current running, strength and equipment, an optional
menstrual cycle profile, and a summary of the plan. Everything can be changed later in **Setup**.

## Women's health features

Built from a review of the female-specific evidence (see ☰ → The science → "Women training long").

- **Bone health check** (onboarding and Setup): six questions on eating, weight, first period, cycle
  regularity, bone density and previous stress fractures. Moderate or high risk builds at 5% a week
  instead of 8%, caps each run at 5% over your recent longest, adds a recovery week every third week,
  and suggests asking a sports doctor about a bone density scan.
- **Energy check** every 8 weeks: seven questions on injury, gut, periods and eating, in Ridgeline's own
  words (it covers the same areas as the validated LEAF-Q but isn't it). Warning signs prompt a dietitian
  or doctor visit.
- **Fuelling by number:** every run over 75 minutes has a carbohydrate target (30–45 g/h in Base up to
  60–90 g/h in Peak) and a drink-to-thirst step; log g/h, gut and weight before/after. Finishing heavier
  than you started is flagged as over-drinking.
- **Iron reminders:** ferritin and haemoglobin every 6 months, or every 3 with heavy periods or fatigue.
- **Life stage:** natural cycles, hormonal contraception, perimenopause or post-menopause. The last two
  raise bone risk a level, keep heavy strength and jumps as a priority, add an easy day after camp
  weekends and turn off period-based prompts.
- **Heat acclimation:** for a summer race, easy runs in the two weeks before the taper become heat sessions.
- **Shin or bone pain** logged on two days in a fortnight pauses running until it's checked.
- **Race day** leads with fuelling, drinking and feet, with a between-stages routine for multi-day events.

## Ill or injured

**I’m ill or injured** (on the Today screen and in the ☰ menu) pauses the plan. Paused sessions show as
paused, not missed, and don’t count in reports. Tap **I’m back** when you’re ready: a few days off eases the
rest of that week; four days or more means easy running only for the rest of the week and a gradual build
back (65% after a week, 50% after two), using the same easing as missed training below.

## Re-planning after missed training

Ridgeline replays your weeks in order and compares what you ran with what was planned (after any
earlier easing), so a reduced week you then completed counts as a good week.

- **Missed week** (under half the planned running): the next week is eased to about 65% and is easy
  running only; each following week builds back by ~15% until you're on plan.
- **Partial week** (50–80%): the next week holds at 90%.
- **No runs for 7+ days** mid-week: the rest of that week is eased straight away.

Eased weeks are tagged in the plan, explained on the Today screen and in each session, and the weekly
report's next-week preview shows what's coming. The multi-day goal now has two camp weekends (8 and 4
weeks out) rather than three.

## Your cycle profile

In onboarding (or **Setup → Cycle-aware training**) you can say which days make training harder
(first 1–2 days, first 3 days, the whole period, the days before it, around ovulation), what you notice
(cramps, fatigue, light-headedness with hard exercise, heavy bleeding, headaches, gut problems,
poor sleep, low mood), how much it affects you, and what Ridgeline should do:

- The default is **Ask me first**. Marking many tough days (7 or more a cycle, e.g. the whole period plus
  the days before it) shows a warning, because in automatic mode that would move or soften a quarter of
  your quality sessions.
- **Move hard sessions for me:** hills, intervals, tempo and power hikes that land on a predicted
  tough day swap with an easy run that week, or move to a free day that isn't next to another hard
  session or the long run. If there's no good day, the session becomes an easy run. Each change has a note.
- **Ask me first:** tough-day sessions are flagged in the plan, in next week's preview, and on the day,
  with one-tap swap or move.
- **Just remind me:** a note only.

Long runs and strength stay put, with a note. If you mention light-headedness or heavy bleeding, Ridgeline
suggests asking your GP for an iron check (ferritin and haemoglobin) and gives what-to-do tips on those days.
Predictions update as you log periods, so the moves follow your real cycle.

## Cycle-aware training (optional)

Turn it on in **Setup** and add the first day of your last period. Ridgeline then:

- shows your cycle day and phase on the Today screen, with predicted period days marked in the week strip and plan
- lets you check in each day (energy 1–5 and a few symptoms) in two taps
- suggests swapping a hard session for an easy run, or moving it to a later easy day, when your check-in says it's a rough day
- learns your cycle length from the periods you log, and shows your own energy and effort patterns by phase on Progress

It responds to how you feel rather than rewriting the plan by phase. Everything stays on your device.

## Weekly report

Every Monday a banner on Today says last week's report is ready (also under **Progress → Weekly report**,
with ‹ › to look back through earlier weeks, or see the current week so far). It shows:

- sessions done, km vs planned, climb and longest run
- a day-by-day bar for every session, coloured by type and filled by how much of it you did
- session attainment bars by type
- what went well and what to watch: completion, easy and hard effort, km jump on last week, long run, strength
- with cycle-aware training on: an energy-by-day chart coloured by phase, symptoms, swaps and how hard sessions felt in each phase
- a preview of next week, flagging any hard session that lands on a period day or a phase you've chosen to protect

## Monthly report

On the 1st of each month a banner on the Today screen tells you last month's report is ready
(it's also under **Progress → Monthly report**, and you can flick back through earlier months).
It covers:

- sessions done, km run vs planned, climb and longest run
- what went well and what to watch: completion, easy-run effort, hard-session effort, week-to-week km jumps, strength and long-run consistency
- with cycle-aware training on: energy, completion, hard-session RPE, easy pace, symptoms and swaps for each cycle phase, plus any clear patterns
- suggested adjustments, some with a one-tap action (e.g. a prompt before hard sessions on the phase where your energy dips)

Tap any day in the week strip to fill in a missed check-in, so gaps don't skew the analysis.

## Your data

**Setup → Backup → Export data (CSV)** (or the button at the end of each report) gives you a zip with:

- `daily.csv`: one row per day: cycle day and phase, energy, symptoms, planned vs done, km, time, climb, effort
- `sessions.csv`: one row per session, including extra runs: status, actuals, pace, RPE, and cycle phase that day
- `events.csv`: a timestamped log of everything you've done in the app (ticks, logs, imports, swaps, moves, check-ins)

Cycle phases are worked out retrospectively from the periods you log, using each cycle's real length.

## Tests

```bash
npm test
```

Runs the suite in `tests/` with Node's built-in test runner (Node 22.6+; nothing to install). It loads the
app's `js/` files into a sandbox with a fixed date, fake storage and a fake DOM, and checks the plan
generator (progression, spike guard, strength placement, taper, camps, kits), re-planning and pauses, the
cycle features, reports and exports, file import, the Garmin/Setlog/Lua syncs, and the two bridge files.
The deploy workflow runs it before publishing. See `tests/README.md`.

If `lua/src/ridgelineBridge.ts` changes, regenerate the test copy:
`node -e "const fs=require('fs');fs.writeFileSync('tests/lua-bridge-shim.ts','// Generated by tests from lua/src/ridgelineBridge.ts with the database stubbed. Do not edit.\n'+fs.readFileSync('lua/src/ridgelineBridge.ts','utf8').replace(\"import { db, initializeDatabase } from './db';\",'const db=(globalThis as any).__luaDb; const initializeDatabase=async()=>{};'))"`

## Running locally

Service workers need http(s), so don't just double-click the file:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Shipping updates

Edit `index.html`, then bump `VERSION` in `sw.js` (e.g. `ridgeline-v2`) and push.
The app loads the new version next time it's opened with a connection.

## Your data

Everything is stored in the browser on that device. Use **Setup → Backup → Export backup**
regularly, and *Import backup* to restore or move to a new phone.
Note: on iPhone, the home-screen app has its own storage separate from Safari, so
set up your plan from the installed app.

## Ideas for next

- Pace zones from a recent race time
- Multi-day block for stage races
- Drag-and-drop to move sessions
