// ================================================================
// 🔔 BAQDUNS PUSH NOTIFICATION SYSTEM v4
// ✅ OneSignal — إشعارات حقيقية حتى لو الهاتف مسكّر
// ✅ Firebase RTDB — لحظي للأجهزة المفتوحة
// ✅ Telegram — backup إضافي دائم
// ✅ يغطي: الطلبات + الشكاوي + الرفض + التنبيهات
// ================================================================

// ─── CONFIGURATION ──────────────────────────────────────────────
const ONESIGNAL_APP_ID = '207bac0d-5e2f-4d2b-8388-9f84610284d7'; // ✅ حقيقي
const ONESIGNAL_SAFARI = 'web.onesignal.auto.4d177f4c-af32-40a6-bcd9-e75371e6c146';
const ONESIGNAL_REST_KEY = 'os_v2_app_eb52ydk6f5gsxa4it6cgcaue24iebmyz5qrem4vtbddmrlyebfhglmlljydn3a23rpazto6gpdcyrjgz7ueorrhule7wlbhzw4bkcra'; // ✅ حقيقي
// ✅ رابط موقعك الرسمي والموثق لحمايته من أي أخطاء في التوجيه
const SITE_URL = 'https://syl78918-star.github.io/baqdunss';
const TG_TOKEN = '8314414879:AAE7KPKqIKSrTyjEri9lxo1o-fl5dGXqGrE';
const TG_CHAT_ID = '6222386355';

const OS_REST_READY = (ONESIGNAL_REST_KEY !== 'PASTE_REST_API_KEY_HERE');

// ────────────────────────────────────────────────────────────────
window.BaqdNotify = {

    _types: {
        order: { icon: '🛒', color: '#041E42', border: '#C5A059' },
        complaint: { icon: '📢', color: '#8e44ad', border: '#a29bfe' },
        rejected: { icon: '⚠️', color: '#c0392b', border: '#ff6b6b' },
        urgent: { icon: '🚨', color: '#c0392b', border: '#ff6b6b' },
        success: { icon: '✅', color: '#27ae60', border: '#55efc4' },
        warning: { icon: '⚠️', color: '#e67e22', border: '#fdcb6e' },
        info: { icon: '🔔', color: '#2980b9', border: '#74b9ff' }
    },

    // ══════════════════════════════════════════════════════════
    // 🚀 MAIN PUSH — يرسل لكل القنوات دفعة واحدة
    // ══════════════════════════════════════════════════════════
    async push(title, body, options) {
        // ضمان أن الرابط كامل ليقبله OneSignal
        let finalUrl = options.url || (SITE_URL + '/baqduns_optimizer.html');
        if (finalUrl.startsWith('/')) finalUrl = SITE_URL + finalUrl;
        else if (!finalUrl.startsWith('http')) finalUrl = SITE_URL + '/' + finalUrl;

        const opts = {
            type: options.type || 'info',
            url: finalUrl,
            urgency: options.urgency || 'normal',
            timestamp: Date.now()
        };

        // 1️⃣ OneSignal REST API (يصل حتى لو الهاتف مسكّر)
        this._onesignal(title, body, opts).catch(e => console.warn('OS:', e.message));

        // 2️⃣ Firebase RTDB (لحظي للأجهزة المفتوحة)
        this._rtdb(title, body, opts).catch(e => console.warn('RTDB:', e.message));

        // 3️⃣ Telegram (backup حقيقي)
        this._telegram(title + '\n' + body);

        return opts;
    },

    // ══════════════════════════════════════════════════════════
    // 📦 SPECIALIZED PUSHES
    // ══════════════════════════════════════════════════════════
    async newOrder(order) {
        const title = '🛒 طلب جديد وصل!';
        const body = '👤 ' + (order.customer || order.email || 'زبون') +
            ' | 💰 ' + order.total +
            ' | 💳 ' + (order.paymentMethod || 'CliQ');
        return this.push(title, body, { type: 'order', urgency: 'high', url: SITE_URL + '/baqduns_optimizer.html' });
    },

    async newComplaint(complaint) {
        const title = '📢 شكوى جديدة تحتاج مراجعة!';
        const body = '👤 ' + complaint.name + ' | 📝 ' + (complaint.typeText || complaint.type);
        return this.push(title, body, { type: 'complaint', urgency: 'high', url: SITE_URL + '/baqduns_optimizer.html' });
    },

    async rejectedPayment(order, reason) {
        const title = '⚠️ حوالة مرفوضة!';
        const body = '👤 ' + (order.customer || order.email) + ' — ' + reason.substring(0, 80);
        return this.push(title, body, { type: 'rejected', urgency: 'high', url: SITE_URL + '/baqduns_optimizer.html' });
    },

    // ══════════════════════════════════════════════════════════
    // 📡 ONESIGNAL — يُرسل push server-side حتى لو الهاتف مسكّر
    // ══════════════════════════════════════════════════════════
    async _onesignal(title, body, opts) {
        if (!OS_REST_READY) {
            // بدون REST Key: نعتمد على RTDB + SW
            // (OneSignal مسجّل والمستخدم أعطى إذن، لكن لا يمكن الإرسال من العميل)
            console.log('ℹ️ OneSignal REST key not set yet — RTDB push is active');
            return;
        }

        const payload = {
            app_id: ONESIGNAL_APP_ID,
            included_segments: ['All'],
            headings: { en: title, ar: title },
            contents: { en: body, ar: body },
            url: opts.url,
            chrome_web_icon: SITE_URL + '/visitor-logo.png',
            firefox_icon: SITE_URL + '/visitor-logo.png',
            chrome_web_badge: SITE_URL + '/visitor-logo.png',
            priority: opts.urgency === 'high' ? 10 : 5,
            ttl: 86400
        };

        const res = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + ONESIGNAL_REST_KEY },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.errors) throw new Error(JSON.stringify(data.errors));
        console.log('✅ OneSignal push sent | recipients:', data.recipients);
        return data;
    },

    // ══════════════════════════════════════════════════════════
    // 🔥 FIREBASE RTDB (للأجهزة المفتوحة فوراً)
    // ══════════════════════════════════════════════════════════
    async _rtdb(title, body, opts) {
        if (!window.firebase || !firebase.database) return;
        const notif = { title: title, body: body, id: 'n_' + Date.now(), timestamp: opts.timestamp };
        Object.assign(notif, opts);
        await firebase.database().ref('app_notifications').push(notif);
    },

    // ══════════════════════════════════════════════════════════
    // 🎯 RTDB LISTENER — يستقبل الإشعارات على الأجهزة المفتوحة
    // ══════════════════════════════════════════════════════════
    _listenStarted: false,
    listenForPush() {
        if (this._listenStarted) return;
        if (!window.firebase || !firebase.database) {
            setTimeout(function () { BaqdNotify.listenForPush(); }, 1200);
            return;
        }

        this._listenStarted = true;
        var startTime = Date.now() - 5000;

        firebase.database().ref('app_notifications')
            .limitToLast(20)
            .on('child_added', function (snap) {
                var n = snap.val();
                if (!n || n.timestamp < startTime) return;

                var seenKey = 'bq_seen_' + n.id;
                if (localStorage.getItem(seenKey)) return;
                localStorage.setItem(seenKey, '1');

                BaqdNotify._showLocal(n);
            });

        console.log('✅ BaqdNotify: RTDB push listener active');
    },

    // ══════════════════════════════════════════════════════════
    // 🔔 SHOW LOCAL (SW System Notification + Banner + Sound)
    // ══════════════════════════════════════════════════════════
    async _showLocal(notif) {
        this._banner(notif.title, notif.body, notif.type, notif.url);
        this._sound(notif.type);

        if (!('serviceWorker' in navigator)) return;
        if (Notification.permission !== 'granted') return;

        try {
            var sw = await navigator.serviceWorker.ready;

            // postMessage to SW → shows system notification even when minimize
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: notif.title,
                    body: notif.body,
                    icon: '/visitor-logo.png',
                    tag: notif.id || ('bq-' + Date.now()),
                    url: notif.url || '/',
                    urgency: notif.urgency || 'normal'
                });
            } else {
                var vibrate = notif.urgency === 'high' ? [300, 100, 300, 100, 300] : [200, 100, 200];
                await sw.showNotification(notif.title, {
                    body: notif.body,
                    icon: '/visitor-logo.png',
                    badge: '/visitor-logo.png',
                    vibrate: vibrate,
                    tag: notif.id || ('bq-' + Date.now()),
                    renotify: true,
                    requireInteraction: notif.urgency === 'high',
                    silent: false,
                    data: { url: notif.url || '/' },
                    actions: [
                        { action: 'open', title: '📱 فتح' },
                        { action: 'dismiss', title: '✕' }
                    ]
                });
            }
        } catch (e) {
            if (Notification.permission === 'granted') {
                var n = new Notification(notif.title, { body: notif.body, icon: '/visitor-logo.png' });
                n.onclick = function () { window.open(notif.url || '/'); n.close(); };
            }
        }
    },

    // ══════════════════════════════════════════════════════════
    // 🎨 IN-PAGE BANNER
    // ══════════════════════════════════════════════════════════
    _banner(title, body, type, url) {
        var old = document.getElementById('bq-notif-banner');
        if (old) old.remove();

        var t = this._types[type] || this._types.info;
        var el = document.createElement('div');
        el.id = 'bq-notif-banner';
        el.style.cssText = [
            'position:fixed;top:16px;right:16px;z-index:999999;',
            'background:' + t.color + ';border:2px solid ' + t.border + ';',
            'color:white;padding:14px 18px;border-radius:16px;',
            'box-shadow:0 8px 32px rgba(0,0,0,.45);',
            'display:flex;align-items:center;gap:12px;',
            'max-width:340px;min-width:260px;cursor:pointer;',
            'animation:bqIn .4s cubic-bezier(.175,.885,.32,1.275);',
            'font-family:Cairo,sans-serif;direction:rtl;'
        ].join('');

        el.innerHTML = '<style>' +
            '@keyframes bqIn{from{opacity:0;transform:translateX(120px) scale(.8)}to{opacity:1;transform:none}}' +
            '@keyframes bqOut{to{opacity:0;transform:translateX(120px) scale(.8)}}' +
            '</style>' +
            '<span style="font-size:2rem;flex-shrink:0">' + t.icon + '</span>' +
            '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:700;font-size:.95rem;margin-bottom:3px;' +
            'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + title + '</div>' +
            '<div style="font-size:.82rem;opacity:.9;line-height:1.4">' + body + '</div>' +
            '</div>' +
            '<button onclick="document.getElementById(\'bq-notif-banner\').remove()" ' +
            'style="background:rgba(255,255,255,.2);border:none;color:white;' +
            'width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:.85rem;' +
            'flex-shrink:0;display:flex;align-items:center;justify-content:center">✕</button>';

        el.addEventListener('click', function (e) {
            if (e.target.tagName === 'BUTTON') return;
            window.open(url || '/', '_self');
            el.remove();
        });

        document.body.appendChild(el);

        setTimeout(function () {
            var b = document.getElementById('bq-notif-banner');
            if (b) {
                b.style.animation = 'bqOut .3s ease-in forwards';
                setTimeout(function () { b.remove(); }, 300);
            }
        }, 9000);
    },

    // ══════════════════════════════════════════════════════════
    // 🔊 SOUND
    // ══════════════════════════════════════════════════════════
    _sound(type) {
        try {
            var sounds = {
                order: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
                complaint: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
                rejected: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
                urgent: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
                def: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg'
            };
            var audio = new Audio(sounds[type] || sounds.def);
            audio.volume = 0.7;
            audio.play().catch(function () { });
        } catch (e) { }
    },

    // ══════════════════════════════════════════════════════════
    // 📨 TELEGRAM
    // ══════════════════════════════════════════════════════════
    _telegram(text) {
        fetch('https://api.telegram.org/bot' + TG_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TG_CHAT_ID, text: text, parse_mode: 'Markdown' })
        }).catch(function () { });
    },

    // ══════════════════════════════════════════════════════════
    // 🔐 REQUEST NOTIFICATION PERMISSION
    // ══════════════════════════════════════════════════════════
    async requestPermission() {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        var result = await Notification.requestPermission();
        return result === 'granted';
    },

    // ══════════════════════════════════════════════════════════
    // 🚀 INIT
    // ══════════════════════════════════════════════════════════
    async init() {
        // طلب الإذن بعد 3 ثواني
        setTimeout(async function () {
            if (Notification.permission === 'default') {
                await BaqdNotify.requestPermission();
            }
        }, 3000);

        // ابدأ الاستماع عبر RTDB
        this.listenForPush();

        if (!OS_REST_READY) {
            console.warn('⚠️ BaqdNotify: OneSignal REST key not configured.');
            console.warn('   اذهب إلى OneSignal > Settings > Keys & IDs > REST API Key');
            console.warn('   ثم أضفه في notifications.js في متغير ONESIGNAL_REST_KEY');
        }

        console.log('🔔 BaqdNotify v4 | OS_REST:', OS_REST_READY ? '✅' : '⏳ pending', '| Permission:', Notification.permission);
    }
};

// ── AUTO START ────────────────────────────────────────────────────
var _bqWait = setInterval(function () {
    if (window.firebase) {
        clearInterval(_bqWait);
        BaqdNotify.init();
    }
}, 300);

// ── BACKWARD COMPATIBLE: sendBaqdunsNotification ──────────────────
var _origSend = window.sendBaqdunsNotification;
window.sendBaqdunsNotification = function (text, options) {
    options = options || {};
    if (_origSend) _origSend(text, options);
    else BaqdNotify._telegram(text);

    var title = options.title || 'بقدونس 🌿';
    var body = text.replace(/\*/g, '').replace(/_/g, '').substring(0, 200);
    BaqdNotify.push(title, body, {
        type: options.type || 'info',
        urgency: options.urgency || 'normal',
        url: options.url || (SITE_URL + '/baqduns_optimizer.html')
    }).catch(function () { });
};
