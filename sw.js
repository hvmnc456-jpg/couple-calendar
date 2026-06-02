// __BUILD__ 값은 배포 스크립트가 매 배포마다 타임스탬프로 치환함
// → sw.js 바이트가 달라져 브라우저가 새 SW를 감지/설치 (skipWaiting + clients.claim으로 즉시 교체)
const BUILD = '1780362720477';
const CACHE = 'couple-calendar-' + BUILD;
const STATIC = ['/manifest.json', '/icons/icon.svg', '/icons/icon-maskable.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
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

/* ═══════════════════════════════════════
   PUSH NOTIFICATIONS
══════════════════════════════════════ */
self.addEventListener('push', e => {
  let data = { title: '우리 캘린더 🌸', body: '새로운 알림이 있어요', url: '/' };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon-maskable.svg',
      tag: 'couple-calendar-notif',
      renotify: true,
      data: { url: data.url }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
