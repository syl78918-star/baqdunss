// ================================================================
// 🔥 BAQDUNS MAIN SERVICE WORKER
// يتعامل مع التخزين المؤقت + PWA Offline
// الإشعارات الحقيقية (FCM) تعالج في firebase-messaging-sw.js
// ================================================================

// ✅ دمج أداة OneSignal في السيرفر ووركر الخاص بـ PWA لضمان وصول الإشعارات في الخلفية
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'baqduns-store-v7';
const urlsToCache = [
    '/',
    '/index.html',
    '/portal.html',
    '/accounts.html',
    '/script.js',
    '/style.css',
    '/visitor-logo.png',
    '/instagram_3d.png',
    '/facebook_3d.png',
    '/tiktok_3d.png',
    '/visitor-manifest.json',
    '/firebase-config.js'
];

// ── Install: Cache essential files ──────────────────────────────
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(e => console.warn('SW Cache error:', e))
    );
});

// ── Activate: Clean old caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys =>
                Promise.all(keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
                )
            ),
            clients.claim() // Take control immediately
        ])
    );
});

// ── Fetch: Network first, cache fallback ─────────────────────────
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;
    // Skip Firebase requests
    if (event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('gstatic.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// ── Notification Click (from this SW's showNotification) ─────────
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const url = notification.data?.url || '/';
    notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

// ── Message from page: show notification ─────────────────────────
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, tag, url, urgency } = event.data;
        const vibrate = urgency === 'high' ? [300, 100, 300, 100, 300] : [200, 100, 200];

        event.waitUntil(
            self.registration.showNotification(title || 'بقدونس 🌿', {
                body: body || '',
                icon: icon || '/visitor-logo.png',
                badge: '/visitor-logo.png',
                vibrate,
                tag: tag || 'baqduns-sw-' + Date.now(),
                renotify: true,
                requireInteraction: urgency === 'high',
                silent: false,
                data: { url: url || '/' },
                actions: [
                    { action: 'open', title: '📱 فتح التطبيق' },
                    { action: 'dismiss', title: '✕ إغلاق' }
                ]
            })
        );
    }

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('✅ Baqduns SW v5 loaded');
