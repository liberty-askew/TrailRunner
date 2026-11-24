# Setlog in Ridgeline

The strength, cardio and bodyweight logger in this folder is **Setlog** (Workout_jfp) by Jake
([github.com/Jakefp/Workout](https://github.com/Jakefp/Workout)), included with his permission.

Changes made for Ridgeline, kept small so his updates can be merged in:

- `js/ridgeline-bridge.js` (new): back link to Ridgeline, mirrors the Ridgeline plan into the week plan, and starts sessions handed over from Ridgeline.
- `css/ridgeline.css` (new): Ridgeline colour tokens, loaded after `css/app.css`.
- `js/app.js`: one import and one call in `boot()`, a What's new entry, `APP_VERSION` → `1.4.0-rl2`.
- `sw.js`: version bump, the two new files in `SHELL`, and old-cache cleanup limited to Setlog's own caches
  (Ridgeline shares the site, so it must not delete Ridgeline's cache).
- `index.html`: the extra stylesheet and Ridgeline theme colours.

Setlog's data stays in its own IndexedDB database (`setlog`), unchanged. Ridgeline only reads it.

To pull in a newer Setlog: copy his files over this folder, then re-apply the five changes above.
