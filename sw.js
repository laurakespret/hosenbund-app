// Service Worker: macht Hosenbund offline-fähig.
// Strategie „stale-while-revalidate“: sofort aus dem Cache antworten, im Hintergrund aktualisieren.
// Wichtig: immer am HTTP-Cache vorbei laden (cache: 'reload' / 'no-cache'). GitHub Pages erlaubt 10 Min.
// Zwischenspeichern, sonst landen beim Update die alten Dateien im neuen Cache.
// CACHE muss zur Version in js/version.js passen (tests/test_statisch.py prüft das).
const CACHE = 'hosenbund-0.13.0';
const DATEIEN = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/main.js', 'js/ui.js', 'js/store.js', 'js/rechner.js', 'js/chart.js', 'js/health.js', 'js/training.js', 'js/training-ansicht.js', 'js/training-statistik.js', 'js/bibliothek.js', 'js/lebensmittel.js', 'js/kalorien.js', 'js/kalorien-ansicht.js', 'js/barcode.js', 'js/rezepte.js', 'js/rezepte-ansicht.js', 'js/zyklus.js', 'js/zyklus-ansicht.js', 'js/icons.js', 'js/demo.js', 'js/version.js',
  'icons/icon.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png',
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN.map(d => new Request(d, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys()
    .then(namen => Promise.all(namen.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const eigen = url.origin === self.location.origin;
  const schrift = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!eigen && !schrift) return;
  ev.respondWith(caches.open(CACHE).then(async cache => {
    // Adresse ohne ?demo/?reset/#… nachschlagen, damit die Startseite immer gefunden wird
    const schluessel = eigen && req.mode === 'navigate' ? 'index.html' : req;
    const alt = await cache.match(schluessel);
    const neu = fetch(eigen ? new Request(req, { cache: 'no-cache' }) : req).then(antwort => {
      if (antwort.ok || antwort.type === 'opaque') cache.put(schluessel, antwort.clone());
      return antwort;
    }).catch(() => alt);
    return alt || neu;
  }));
});
