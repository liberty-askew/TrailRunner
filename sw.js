// Ridgeline service worker – makes the app work offline.
// Bump VERSION whenever you change index.html so phones pick up the update.
const VERSION = "ridgeline-v21";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./css/app.css",
  "./js/01-dates.js", "./js/02-plan.js", "./js/03-strength.js", "./js/04-workouts.js", "./js/05-state.js", "./js/06-cycle.js", "./js/07-export.js", "./js/08-reports.js", "./js/09-cycle-profile.js", "./js/10-onboarding.js", "./js/11-replan.js", "./js/11a-health.js", "./js/12-ui.js", "./js/13-import.js", "./js/14-garmin.js", "./js/15-setlog.js", "./js/16-lua.js", "./js/17-science.js", "./js/18-events-boot.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    // Setlog shares this site, so only remove Ridgeline's own old caches.
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k.startsWith("ridgeline-")).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Setlog (./setlog/) has its own service worker; leave its requests alone.
  if (url.origin === location.origin && url.pathname.startsWith(new URL("./setlog/", self.registration.scope).pathname)) return;
  // Lua (./lua/) has its own service worker too.
  if (url.origin === location.origin && url.pathname.startsWith(new URL("./lua/", self.registration.scope).pathname)) return;

  // The page itself: network first so updates arrive, cache as fallback offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req)
      .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }

  // Everything else (icons, Google Fonts): cache first, fill the cache as we go.
  if (url.origin === location.origin || url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
