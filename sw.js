const CACHE_NAME = 'trading-journal-v1'; // 💡 未來大改版時，可將 v1 改成 v2
const urlsToCache = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安裝 Service Worker 並快取基本資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // 強制等待中的 Service Worker 立即激活
});

// 激活 Service Worker 並清除舊版本的快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
    ))
  );
  self.clients.claim(); // 立即控制所有開啟的頁面
});

// 攔截網路請求 (Network First 策略：優先抓取最新網路資料)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(res => {
      // 如果成功從網路抓取到資料
      if (res && res.status === 200 && res.type === 'basic') {
        const resClone = res.clone();
        // 將最新的資料更新到快取中
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
      }
      return res;
    }).catch(() => {
      // 如果網路斷線或抓取失敗，才從快取中尋找舊資料
      return caches.match(event.request);
    })
  );
});
