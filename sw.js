const CACHE = 'fitness-v6';
const FILES = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 网络优先策略：优先用网络，网络失败才用缓存
// 这样能保证数据不丢失，同时支持离线
self.addEventListener('fetch', e => {
  // 只处理GET请求
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 网络成功，更新缓存
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // 网络失败，用缓存（离线模式）
        return caches.match(e.request).then(cached => cached || caches.match('./index.html'));
      })
  );
});
