// ✅ دمج أداة OneSignal في لوحة التحكم (Admin PWA) لضمان وصول الاشعارات في الخلفية
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const ADMIN_CACHE = 'baqduns-admin-v1';
const adminUrls = [
    'baqduns_optimizer.html',
    'admin_portal.html',
    'firebase-db.js',
    'admin-manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(ADMIN_CACHE)
            .then(cache => cache.addAll(adminUrls))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Notifications and other admin specific SW logic
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'NOTIFY') {
        const { title, body, url, tag, vibrate } = event.data.payload;
        self.registration.showNotification(title || 'تنبيه نظام بقدونس ⚡', {
            body: body || '',
            icon: 'admin-icon.svg',
            badge: 'admin-icon.svg',
            vibrate: vibrate || [400, 100, 400, 100, 400, 100, 600],
            tag: tag || 'baqduns-admin-alert',
            renotify: true,
            requireInteraction: true,
            data: { url: url || 'baqduns_optimizer.html' }
        });
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data.url;
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
