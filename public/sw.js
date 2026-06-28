/* Mi semestre — service worker (offline + instalable) */
const CACHE = "misem-v1";
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url; try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;             // solo mismo origen (no Supabase)
  if (req.mode === "navigate") {                                 // HTML: red primero, cache de respaldo
    e.respondWith((async () => {
      try { const net = await fetch(req); const c = await caches.open(CACHE); c.put(req, net.clone()); return net; }
      catch { return (await caches.match(req)) || (await caches.match("./index.html")) || Response.error(); }
    })());
    return;
  }
  e.respondWith((async () => {                                   // assets: cache primero
    const cached = await caches.match(req);
    if (cached) return cached;
    try { const net = await fetch(req); const c = await caches.open(CACHE); c.put(req, net.clone()); return net; }
    catch { return cached || Response.error(); }
  })());
});
