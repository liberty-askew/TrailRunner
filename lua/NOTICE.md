# Lua in Ridgeline

The period calendar in this folder is **Lua — Private Period Tracker**
([github.com/createusernam/lua-period-tracker](https://github.com/createusernam/lua-period-tracker)),
MIT licence (see `LICENSE`). Its data stays in its own IndexedDB database (`lua-period-tracker`), unchanged.

Changes made for Ridgeline, kept small so newer versions can be merged in:

- `src/ridgelineBridge.ts` (new): a back link to Ridgeline, and adds period starts logged in Ridgeline to Lua.
- `src/main.tsx`: runs the bridge before the app renders.
- `vite.config.ts`: `base: './'`, so it works from the `lua/` subfolder.
- `public/manifest.json`: `start_url` and `scope` set to `./`.
- `index.html`: relative path for the Apple touch icon.

Lua is a React/TypeScript app, so it's built by `.github/workflows/pages.yml` on every push
(`npm ci` then `vite build`); the built files are published at `…/lua/`.
To build locally instead: `cd lua && npm install && npx vite build`, then serve `lua/dist`.
