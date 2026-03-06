// ================================================================
// 🔔 BAQDUNS SERVICE WORKER — Push Handler
// يستقبل إشعارات من الصفحة الرئيسية عبر postMessage
// لا يحتاج Firebase FCM VAPID
// ================================================================

// Handle notification requests FROM page
self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SHOW_NOTIFICATION') {
        const d = event.data;
        const vibrate = d.urgency === 'high' ? [300, 100, 300, 100, 300] : [200, 100, 200];

        event.waitUntil(
            self.registration.showNotification(d.title || 'بقدونس 🌿', {
                body: d.body || '',
                icon: d.icon || '/visitor-logo.png',
                badge: '/visitor-logo.png',
                vibrate,
                tag: d.tag || ('bq-' + Date.now()),
                renotify: true,
                requireInteraction: d.urgency === 'high',
                silent: false,
                data: { url: d.url || '/index.html' },
                actions: [
                    { action: 'open', title: '📱 فتح' },
                    { action: 'dismiss', title: '✕' }
                ]
            })
        );
    }

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Handle click on SW notification
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const url = notification.data?.url || '/';
    notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

console.log('✅ Baqduns notification SW loaded');
