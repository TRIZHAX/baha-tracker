const staticCache = "baha-static-v2"
const mapCache = "baha-map-v2"
const staticAssets = ["/", "/manifest.json", "/icon.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(staticCache).then((cache) => cache.addAll(staticAssets)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![staticCache, mapCache].includes(key)).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url)

  if (event.request.method === "GET" && event.request.mode === "navigate") {
    event.respondWith(fetch(event.request))
    return
  }

  if (requestUrl.origin === self.location.origin && event.request.method === "GET") {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
  }
})
