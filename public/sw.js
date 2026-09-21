const staticCache = "baha-static-v1"
const mapCache = "baha-map-v1"
const staticAssets = ["/", "/map", "/manifest.json", "/icon.svg"]

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
  const isMapTile = requestUrl.hostname.endsWith("tile.openstreetmap.org")
  if (isMapTile) {
    event.respondWith(caches.open(mapCache).then(async (cache) => {
      const cached = await cache.match(event.request)
      const network = fetch(event.request).then((response) => {
        if (response.ok) cache.put(event.request, response.clone())
        return response
      }).catch(() => cached)
      return cached || network
    }))
    return
  }
  if (event.request.method === "GET" && requestUrl.origin === self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((response) => response || caches.match("/"))))
  }
})
