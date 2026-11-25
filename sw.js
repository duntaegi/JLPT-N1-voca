// 오프라인 사용을 위한 캐시. 앱을 수정하면 VERSION 숫자를 올리세요.
const VERSION = 'jpvocab-v111-applyupd';
const FILES = ['./', './index.html', './xlsx.full.min.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // 깃허브 페이지의 임시 저장본(10분)이 아니라 항상 서버의 최신 파일을 받아서 저장
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(u => fetch(new Request(u, {cache: 'reload'})).then(r => { if (!r.ok) throw new Error(u); return c.put(u, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 동기화 서버(Firestore) 통신은 저장하지 않고 그대로 보냄
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseio.com')) return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      if (res.ok) caches.open(VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => url.origin === location.origin ? caches.match('./index.html') : Response.error()))
  );
});
