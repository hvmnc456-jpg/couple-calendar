const CACHE = 'couple-calendar-v2';
const STATIC = ['/manifest.json', '/icons/icon.svg', '/icons/icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Firebase, CDN, 폰트는 SW 캐시 건너뜀 (자체 캐시 사용)
  if (url.includes('firestore') || url.includes('firebase') ||
      url.includes('googleapis') || url.includes('gstatic') ||
      url.includes('unpkg') || url.includes('fonts')) return;

  // ✅ HTML(메인 앱) — 네트워크 우선: 항상 최신 버전 로드, 오프라인 시만 캐시 사용
  if (e.request.mode === 'navigate' ||
      url.endsWith('/') || url.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 정적 자산 (아이콘, 매니페스트) — 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
    )
  );
});
