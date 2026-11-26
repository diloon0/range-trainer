/* Range Trainer offline cache.
   App files: served from the cache at once, refreshed in the background (so an update shows on the next open).
   Google Sheet sync requests are never cached. Bump VERSION to force a clean cache. */
const VERSION = "rt-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;                                   // sync POSTs go straight to Google
  if (url.hostname.endsWith("google.com") || url.hostname.endsWith("googleusercontent.com")) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: url.origin === location.origin});
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    if (hit) { e.waitUntil(fresh); return hit; }
    return fresh;
  }));
});
