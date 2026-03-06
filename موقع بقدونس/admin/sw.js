// ================================================================
// ⚡ BAQDUNS ADMIN SERVICE WORKER — scope: /admin/
// ================================================================
const ADMIN_CACHE = 'baqduns-admin-v3';

const adminUrls = [
    './',
    'index.html',
    '../baqduns_optimizer.html',
    '../admin_portal.html',
    '../firebase-db.js',
    '../firebase-config.js',
    '../admin-icon.svg'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(ADMIN_CACHE)
            .then(cache => cache.addAll(adminUrls))
            .catch(e => console.warn('Admin SW cache error:', e))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys =>
                Promise.all(keys
                    .filter(k => k !== ADMIN_CACHE)
                    .map(k => caches.delete(k))
                )
            ),
            clients.claim()
        ])
    );
});

self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith(self.location.origin)) return;
    if (event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('googleapis.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(ADMIN_CACHE).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Admin Notifications
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'NOTIFY') {
        const { title, body, url, tag } = event.data.payload || event.data;
        self.registration.showNotification(title || 'تنبيه الإدارة ⚡', {
            body: body || '',
            icon: '/admin-icon.svg',
            badge: '/admin-icon.svg',
            vibrate: [400, 100, 400, 100, 600],
            tag: tag || 'baqduns-admin-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            data: { url: url || '/admin/' }
        });
    }
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || './';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

console.log('⚡ Baqduns Admin SW v3 loaded — scope: /admin/');
