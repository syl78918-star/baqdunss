// ================================================================
// 🔥 BAQDUNS DATABASE LAYER (Firebase + localStorage fallback)
// ================================================================
// الملف هذا يربط الموقع بـ Firebase Realtime Database
// كل بيانات المستخدمين والطلبات والدخولات تُحفظ في السحابة
// الأدمن يشوف كل شيء من أي جهاز فوراً 🌍
// ================================================================

(function () {
    'use strict';

    // ── Internal State ─────────────────────────────────────────
    let _db = null;
    let _initialized = false;
    let _dbReady = false;  // true after _flush() is called
    let _readyQueue = [];
    let _listeners = {};   // Active Firebase listeners

    // ── Encode email for Firebase (no dots allowed as keys) ────
    function _enc(email) {
        return (email || '').toLowerCase()
            .replace(/\./g, ',')
            .replace(/@/g, '___');
    }
    function _dec(key) {
        return (key || '').replace(/,/g, '.').replace(/___/g, '@');
    }

    // ── Check if Firebase config is real (not placeholder) ─────
    function _isConfigured() {
        const cfg = window.BAQDUNS_FIREBASE_CONFIG;
        return cfg &&
            cfg.databaseURL &&
            !cfg.databaseURL.includes('YOUR_PROJECT_ID') &&
            !cfg.databaseURL.includes('undefined');
    }

    // ── Load Firebase SDK dynamically ──────────────────────────
    function _loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // ── Initialize Firebase ────────────────────────────────────
    async function _init() {
        if (_initialized) return;
        _initialized = true;

        if (!_isConfigured()) {
            console.warn('🔥 BaqdDB: Firebase not configured. Using localStorage only.');
            console.warn('   → Edit firebase-config.js with your Firebase project details.');
            _flush();
            return;
        }

        try {
            // Load Firebase compat SDK v9
            await _loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
            await _loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');
            await _loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js');
            await _loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-check-compat.js');

            // ── Initialize app (avoid duplicate) ──────────────────────
            if (!firebase.apps.length) {
                firebase.initializeApp(window.BAQDUNS_FIREBASE_CONFIG);
            }

            // ── Set _db FIRST so real-time works even if App Check fails ──
            _db = firebase.database();

            // Watch Auth State
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    console.log('🛡️ Auth: User authenticated', user.email);
                    window._fbUser = user;
                } else {
                    window._fbUser = null;
                }
            });

            console.log('✅ BaqdDB: Firebase connected!');
            _flush();

            // Setup session presence on disconnect
            _setupPresenceSystem();

            // 🛡️ APP CHECK — non-blocking, runs AFTER flush so it never delays connection
            if (window.BAQDUNS_FIREBASE_CONFIG.recaptchaKey) {
                try {
                    // Allow debug mode on localhost / file:// / PWA dev
                    const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname)
                        || window.location.protocol === 'file:';
                    if (isLocal) {
                        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
                        console.log('🛡️ App Check: Debug mode (localhost)');
                    }
                    const appCheck = firebase.appCheck();
                    appCheck.activate(
                        new firebase.appCheck.ReCaptchaV3Provider(window.BAQDUNS_FIREBASE_CONFIG.recaptchaKey),
                        true
                    );
                    console.log('🛡️ App Check: Activated');
                } catch (acErr) {
                    console.warn('🛡️ App Check skipped (non-critical):', acErr.message);
                }
            }

        } catch (err) {
            console.warn('🔥 BaqdDB: Firebase init failed, using localStorage fallback.', err.message);
            _flush();
        }
    }

    // ── Run queued callbacks when ready ────────────────────────
    function _flush() {
        _dbReady = true;
        _readyQueue.forEach(fn => { try { fn(); } catch (e) { } });
        _readyQueue = [];
    }

    // ── Setup Firebase presence on/offline system ──────────────
    function _setupPresenceSystem() {
        if (!_db) return;
        const connRef = _db.ref('.info/connected');
        connRef.on('value', (snap) => {
            const online = snap.val() === true;
            window._fbOnline = online;
            if (online) {
                console.log('🟢 Firebase: Connection live');
            } else {
                console.log('🔴 Firebase: Connection lost/pending');
            }
            // Broadcast for UI to react
            window.dispatchEvent(new CustomEvent('firebase-connection', { detail: { online } }));
        });
    }

    // ── Local array helper: get/set LS arrays ──────────────────
    function _ls(key) {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
    }
    function _lsSet(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { }
    }
    function _lsGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function _lsPut(key, val) {
        try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) { }
    }

    // ── Compress base64 image to thumbnail for Firebase (~50KB max) ─
    function _compressImageForFirebase(base64, maxWidth = 320, quality = 0.55) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                // Safety: if still too large, compress harder
                if (compressed.length > 200000) {
                    canvas.width = Math.round(w * 0.6);
                    canvas.height = Math.round(h * 0.6);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.4));
                } else {
                    resolve(compressed);
                }
            };
            img.onerror = reject;
            img.src = base64;
        });
    }

    // ────────────────────────────────────────────────────────────
    // PUBLIC API
    // ────────────────────────────────────────────────────────────
    const BaqdDB = {

        /** Returns true if Firebase SDK is initialized (regardless of network) */
        isConnected: () => !!_db,

        /** Returns true if Firebase has a live real-time connection */
        isOnline: () => !!_db && window._fbOnline === true,

        /** Run callback when DB is ready (Firebase or fallback) */
        onReady: (fn) => {
            if (_dbReady) fn();  // Already initialized — call immediately
            else _readyQueue.push(fn);
        },

        // ════════════════════════════════════════
        // 👤 USERS
        // ════════════════════════════════════════

        /** Authenticate with Google Credential from login.html */
        async authWithGoogle(idToken) {
            const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
            return firebase.auth().signInWithCredential(credential);
        },

        /** Save/update a user — writes to both uid path and email path for full compatibility */
        async saveUser(user) {
            if (!user || !user.email) return;
            const uid = (firebase.auth && firebase.auth().currentUser)
                ? firebase.auth().currentUser.uid
                : 'temp_' + _enc(user.email);

            // LS update
            const users = _ls('baqdouns_users');
            const idx = users.findIndex(u => u.email === user.email);
            if (idx > -1) users[idx] = { ...users[idx], ...user, uid };
            else users.push({ ...user, uid });
            _lsSet('baqdouns_users', users);

            if (!_db) return;
            try {
                const userData = { ...user, uid };
                // Write to BOTH paths so getUser (by email) and getUsers (by uid) both work
                await _db.ref(`users/${_enc(user.email)}`).update(userData);
                await _db.ref(`email_to_uid/${_enc(user.email)}`).set(_enc(user.email));
            } catch (e) { console.warn('BaqdDB.saveUser Firebase error:', e.message); }
        },

        /** Update specific fields of a user */
        async updateUser(email, updates) {
            if (!email) return;
            // LS update
            const users = _ls('baqdouns_users');
            const idx = users.findIndex(u => u.email === email);
            if (idx > -1) {
                Object.assign(users[idx], updates);
                _lsSet('baqdouns_users', users);
            }
            // Firebase update — write to the consistent email-keyed path
            if (!_db) return;
            try {
                await _db.ref(`users/${_enc(email)}`).update(updates);
            } catch (e) { console.warn('BaqdDB.updateUser Firebase error:', e.message); }
        },



        /** Get all users (Firebase first, LS fallback) */
        async getUsers() {
            if (!_db) return _ls('baqdouns_users');
            try {
                const [usersSnap, deletedSnap] = await Promise.all([
                    _db.ref('users').get(),
                    _db.ref('deleted_users').get()
                ]);
                if (!usersSnap.exists()) return _ls('baqdouns_users');

                let fbUsers = Object.values(usersSnap.val() || {});

                // Filter out explicitly deleted users
                if (deletedSnap.exists()) {
                    const deletedMap = deletedSnap.val() || {};
                    fbUsers = fbUsers.filter(u => !u.email || !deletedMap[_enc(u.email)]);
                }

                _lsSet('baqdouns_users', fbUsers); // Sync to LS
                return fbUsers;
            } catch (e) {
                console.warn('BaqdDB.getUsers error:', e.message);
                return _ls('baqdouns_users');
            }
        },

        /** Get a single user by email */
        async getUser(email) {
            if (!_db) {
                return _ls('baqdouns_users').find(u => u.email === email) || null;
            }
            try {
                const snap = await _db.ref(`users/${_enc(email)}`).get();
                return snap.exists() ? snap.val() : null;
            } catch (e) {
                return _ls('baqdouns_users').find(u => u.email === email) || null;
            }
        },

        /** Listen to users in real-time (for admin panel) */
        listenUsers(callback) {
            if (!_db) {
                callback(_ls('baqdouns_users'));
                return () => { };
            }
            const ref = _db.ref('users');
            const handler = async (snap) => {
                let users = Object.values(snap.val() || {});

                // Filter out any users that were explicitly deleted
                try {
                    const delSnap = await _db.ref('deleted_users').get();
                    if (delSnap.exists()) {
                        const deletedMap = delSnap.val() || {};
                        users = users.filter(u => !u.email || !deletedMap[_enc(u.email)]);
                    }
                } catch (e) { /* silent */ }

                _lsSet('baqdouns_users', users);
                callback(users);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        /** Delete a single user by email (localStorage + Firebase) */
        async deleteUser(email) {
            if (!email) return;

            // 1. Delete from localStorage
            let users = _ls('baqdouns_users');
            users = users.filter(u => u.email !== email);
            _lsSet('baqdouns_users', users);

            // 2. Mark as deleted in Firebase (so listener doesn't bring it back)
            if (_db) {
                try {
                    // Mark in deleted_users node FIRST
                    await _db.ref(`deleted_users/${_enc(email)}`).set(true);

                    // Get UID from email map
                    const mapSnap = await _db.ref(`email_to_uid/${_enc(email)}`).get();
                    const uid = mapSnap.exists() ? mapSnap.val() : ('temp_' + _enc(email));

                    // Delete user data + email map
                    await _db.ref(`users/${uid}`).remove();
                    await _db.ref(`email_to_uid/${_enc(email)}`).remove();
                } catch (e) {
                    console.warn('BaqdDB.deleteUser Firebase error:', e.message);
                }
            }
        },

        /** Delete ALL users — full reset (localStorage + Firebase) */
        async resetAllUsers() {
            // 1. Clear localStorage
            _lsSet('baqdouns_users', []);

            // 2. Clear Firebase
            if (!_db) return;
            try {
                // Get all users to mark them deleted first
                const snap = await _db.ref('users').get();
                if (snap.exists()) {
                    const promises = [];
                    Object.values(snap.val() || {}).forEach(u => {
                        if (u.email) promises.push(_db.ref(`deleted_users/${_enc(u.email)}`).set(true));
                    });
                    await Promise.all(promises);
                }
                await _db.ref('users').remove();
                await _db.ref('email_to_uid').remove();
            } catch (e) {
                console.warn('BaqdDB.resetAllUsers Firebase error:', e.message);
            }
        },



        // ════════════════════════════════════════
        // 🔔 LOGIN LOGS
        // ════════════════════════════════════════

        /** Record a login event (called on every user login) */
        async addLoginLog(logData) {
            // LS
            const logs = _ls('baqdouns_login_logs');
            logs.push(logData);
            if (logs.length > 300) logs.splice(0, logs.length - 300);
            _lsSet('baqdouns_login_logs', logs);
            // Firebase
            if (!_db) return;
            try {
                await _db.ref('login_logs').push(logData);
            } catch (e) { console.warn('BaqdDB.addLoginLog error:', e.message); }
        },

        /** Get all login logs */
        async getLoginLogs() {
            if (!_db) return _ls('baqdouns_login_logs');
            try {
                const snap = await _db.ref('login_logs')
                    .orderByChild('timestamp')
                    .limitToLast(300)
                    .get();
                if (!snap.exists()) return _ls('baqdouns_login_logs');
                const logs = Object.values(snap.val() || {})
                    .sort((a, b) => a.timestamp - b.timestamp);
                _lsSet('baqdouns_login_logs', logs);
                return logs;
            } catch (e) {
                console.warn('BaqdDB.getLoginLogs error:', e.message);
                return _ls('baqdouns_login_logs');
            }
        },

        /** Real-time listener for login logs (admin panel) */
        listenLoginLogs(callback) {
            if (!_db) {
                callback(_ls('baqdouns_login_logs'));
                return () => { };
            }
            const ref = _db.ref('login_logs').orderByChild('timestamp').limitToLast(200);
            const handler = (snap) => {
                const logs = Object.values(snap.val() || {})
                    .sort((a, b) => a.timestamp - b.timestamp);
                _lsSet('baqdouns_login_logs', logs);
                callback(logs);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        // ════════════════════════════════════════
        // 🟢 PRESENCE (Online Status)
        // ════════════════════════════════════════

        /** Update user's online presence */
        async setPresence(email, isOnline) {
            if (!email) return;
            const ts = isOnline ? Date.now() : 0;
            // LS
            const users = _ls('baqdouns_users');
            const idx = users.findIndex(u => u.email === email);
            if (idx > -1) {
                users[idx].lastActive = ts;
                _lsSet('baqdouns_users', users);
            }
            // Firebase
            if (!_db) return;
            const key = _enc(email);
            try {
                const presenceRef = _db.ref(`presence/${key}`);
                if (isOnline) {
                    await presenceRef.set({ email, lastSeen: firebase.database.ServerValue.TIMESTAMP, online: true });
                    // Set onDisconnect to mark offline
                    await presenceRef.onDisconnect().update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
                } else {
                    await presenceRef.update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
                }
                // Also update lastActive in users node
                await _db.ref(`users/${key}/lastActive`).set(
                    isOnline ? firebase.database.ServerValue.TIMESTAMP : 0
                );
            } catch (e) { /* silent */ }
        },

        /** Listen to all online users (admin) */
        listenPresence(callback) {
            if (!_db) {
                const users = _ls('baqdouns_users');
                const online = users.filter(u => u.lastActive && Date.now() - u.lastActive < 120000);
                callback(online.length);
                return () => { };
            }
            const ref = _db.ref('presence');
            const handler = (snap) => {
                const data = snap.val() || {};
                const onlineCount = Object.values(data)
                    .filter(p => p.online === true).length;
                callback(onlineCount);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        // ════════════════════════════════════════
        // 📦 ORDERS
        // ════════════════════════════════════════

        /** Save a new order — image stays in LS, metadata goes to Firebase */
        async addOrder(order) {
            if (!order || !order.id) return;

            // LS: save full order WITH image
            const orders = _ls('baqdouns_orders');
            const existingIdx = orders.findIndex(o => o.id === order.id);
            if (existingIdx === -1) orders.unshift(order);
            _lsSet('baqdouns_orders', orders);

            // Firebase: save order WITHOUT full image (RTDB has ~10MB node limit)
            if (!_db) return;
            try {
                const orderForFirebase = { ...order };

                if (orderForFirebase.screenshotData) {
                    // Compress to tiny thumbnail for Firebase (max ~50KB)
                    try {
                        orderForFirebase.screenshotData = await _compressImageForFirebase(orderForFirebase.screenshotData);
                        orderForFirebase.hasImage = true; // Flag: image exists in localStorage too
                    } catch (compressErr) {
                        // If compress fails, strip it — admin can request via separate mechanism
                        delete orderForFirebase.screenshotData;
                        orderForFirebase.hasImage = true;
                        console.warn('BaqdDB: Image compression failed, saving without image to Firebase');
                    }
                }

                await _db.ref(`orders/${order.id}`).set(orderForFirebase);
            } catch (e) { console.warn('BaqdDB.addOrder error:', e.message); }
        },

        /** Compress base64 image to small thumbnail for Firebase storage */
        // Returns compressed base64 or throws

        /** Get all orders */
        async getOrders() {
            if (!_db) return _ls('baqdouns_orders');
            try {
                const snap = await _db.ref('orders').get();
                if (!snap.exists()) return _ls('baqdouns_orders');
                const orders = Object.values(snap.val() || {});
                _lsSet('baqdouns_orders', orders);
                return orders;
            } catch (e) {
                return _ls('baqdouns_orders');
            }
        },

        /** Update an order */
        async updateOrder(orderId, updates) {
            // LS
            const orders = _ls('baqdouns_orders');
            const idx = orders.findIndex(o => o.id === orderId);
            if (idx > -1) { Object.assign(orders[idx], updates); _lsSet('baqdouns_orders', orders); }
            // Firebase
            if (!_db) return;
            try { await _db.ref(`orders/${orderId}`).update(updates); } catch (e) { }
        },

        /** Real-time listener for orders (admin) */
        listenOrders(callback) {
            if (!_db) { callback(_ls('baqdouns_orders')); return () => { }; }
            const ref = _db.ref('orders');
            const handler = (snap) => {
                let fbOrders = Object.values(snap.val() || {});

                // 🔑 KEY FIX: Merge full images from localStorage into Firebase data
                // Firebase has compressed/no image; LS has the real full-res image
                const lsOrders = _ls('baqdouns_orders');
                fbOrders = fbOrders.map(fbOrder => {
                    if (fbOrder.hasImage) {
                        const lsMatch = lsOrders.find(o => o.id === fbOrder.id);
                        if (lsMatch && lsMatch.screenshotData) {
                            return { ...fbOrder, screenshotData: lsMatch.screenshotData };
                        }
                    }
                    return fbOrder;
                });

                // Sync merged data to LS
                _lsSet('baqdouns_orders', fbOrders);
                callback(fbOrders);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        // ════════════════════════════════════════
        // ⚙️ SETTINGS (Admin Controls)
        // ════════════════════════════════════════

        /** Get a setting value */
        async getSetting(key) {
            const lsKey = `baqdouns_${key}`;
            if (!_db) return _lsGet(lsKey);
            try {
                const snap = await _db.ref(`settings/${key}`).get();
                if (snap.exists()) {
                    const val = snap.val();
                    _lsPut(lsKey, val);
                    return val;
                }
                return _lsGet(lsKey);
            } catch (e) { return _lsGet(lsKey); }
        },

        /** Set a setting value (syncs to all devices) */
        async setSetting(key, value) {
            _lsPut(`baqdouns_${key}`, value);
            if (!_db) return;
            try { await _db.ref(`settings/${key}`).set(value); } catch (e) { }
        },

        /** Listen to a setting (for admin controls that affect users) */
        listenSetting(key, callback) {
            if (!_db) { callback(_lsGet(`baqdouns_${key}`)); return () => { }; }
            const ref = _db.ref(`settings/${key}`);
            const handler = (snap) => {
                const val = snap.exists() ? snap.val() : _lsGet(`baqdouns_${key}`);
                _lsPut(`baqdouns_${key}`, val);
                callback(val);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        // ════════════════════════════════════════
        // 📢 COMPLAINTS
        // ════════════════════════════════════════

        async addComplaint(complaint) {
            const c = _ls('baqdouns_complaints');
            c.push(complaint);
            _lsSet('baqdouns_complaints', c);
            if (!_db) return;
            try { await _db.ref(`complaints/${complaint.id}`).set(complaint); } catch (e) { }
        },

        async getComplaints() {
            if (!_db) return _ls('baqdouns_complaints');
            try {
                const snap = await _db.ref('complaints').get();
                if (!snap.exists()) return _ls('baqdouns_complaints');
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_complaints', list);
                return list;
            } catch (e) { return _ls('baqdouns_complaints'); }
        },

        async updateComplaint(id, updates) {
            const c = _ls('baqdouns_complaints');
            const idx = c.findIndex(x => x.id === id);
            if (idx > -1) { Object.assign(c[idx], updates); _lsSet('baqdouns_complaints', c); }
            if (!_db) return;
            try { await _db.ref(`complaints/${id}`).update(updates); } catch (e) { }
        },

        listenComplaints(callback) {
            if (!_db) { callback(_ls('baqdouns_complaints')); return () => { }; }
            const ref = _db.ref('complaints');
            const handler = (snap) => {
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_complaints', list);
                callback(list);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        // ════════════════════════════════════════
        // 💸 TRANSFERS
        // ════════════════════════════════════════

        async addTransfer(transfer) {
            const t = _ls('baqdouns_transfers');
            t.push(transfer);
            _lsSet('baqdouns_transfers', t);
            if (!_db) return;
            try { await _db.ref(`transfers/${transfer.id}`).set(transfer); } catch (e) { }
        },

        async getTransfers() {
            if (!_db) return _ls('baqdouns_transfers');
            try {
                const snap = await _db.ref('transfers').get();
                if (!snap.exists()) return _ls('baqdouns_transfers');
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_transfers', list);
                return list;
            } catch (e) { return _ls('baqdouns_transfers'); }
        },

        // ════════════════════════════════════════
        // 🏷️ COUPONS
        // ════════════════════════════════════════

        async saveCoupon(coupon) {
            const c = _ls('baqdouns_coupons');
            const idx = c.findIndex(x => x.code === coupon.code);
            if (idx > -1) c[idx] = coupon; else c.push(coupon);
            _lsSet('baqdouns_coupons', c);
            if (!_db) return;
            try { await _db.ref(`coupons/${coupon.code}`).set(coupon); } catch (e) { }
        },

        async getCoupons() {
            if (!_db) return _ls('baqdouns_coupons');
            try {
                const snap = await _db.ref('coupons').get();
                if (!snap.exists()) return _ls('baqdouns_coupons');
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_coupons', list);
                return list;
            } catch (e) { return _ls('baqdouns_coupons'); }
        },

        async deleteCoupon(code) {
            const c = _ls('baqdouns_coupons').filter(x => x.code !== code);
            _lsSet('baqdouns_coupons', c);
            if (!_db) return;
            try { await _db.ref(`coupons/${code}`).remove(); } catch (e) { }
        },

        // ════════════════════════════════════════
        // 🔨 AUCTION
        // ════════════════════════════════════════

        async setAuction(data) {
            localStorage.setItem('baqdouns_active_auction', JSON.stringify(data));
            if (!_db) return;
            try { await _db.ref('auction/current').set(data); } catch (e) { }
        },

        async getAuction() {
            if (!_db) {
                const raw = localStorage.getItem('baqdouns_active_auction');
                return raw ? JSON.parse(raw) : null;
            }
            try {
                const snap = await _db.ref('auction/current').get();
                return snap.exists() ? snap.val() : null;
            } catch (e) {
                const raw = localStorage.getItem('baqdouns_active_auction');
                return raw ? JSON.parse(raw) : null;
            }
        },

        listenAuction(callback) {
            if (!_db) {
                const raw = localStorage.getItem('baqdouns_active_auction');
                callback(raw ? JSON.parse(raw) : null);
                return () => { };
            }
            const ref = _db.ref('auction/current');
            const handler = (snap) => callback(snap.exists() ? snap.val() : null);
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        // ════════════════════════════════════════
        // 💎 REAL-TIME SYNC FOR ADMINS
        // ════════════════════════════════════════

        /** Listen to ALL admin settings at once (Controls) */
        listenAllSettings(callback) {
            if (!_db) return () => { };
            const ref = _db.ref('settings');
            const handler = (snap) => {
                const settings = snap.val() || {};
                // Sync to LS for other scripts cross-compat
                Object.keys(settings).forEach(k => {
                    localStorage.setItem(`baqdouns_${k}`, settings[k]);
                });
                callback(settings);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        /** Listen to Coupons in real-time */
        listenCoupons(callback) {
            if (!_db) { callback(_ls('baqdouns_coupons')); return () => { }; }
            const ref = _db.ref('coupons');
            const handler = (snap) => {
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_coupons', list);
                callback(list);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        /** Listen to Transfers in real-time */
        listenTransfers(callback) {
            if (!_db) { callback(_ls('baqdouns_transfers')); return () => { }; }
            const ref = _db.ref('transfers');
            const handler = (snap) => {
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_transfers', list);
                callback(list);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        /** Save Accounts (Admin sync) */
        async saveAccounts(accounts) {
            _lsSet('baqdouns_accounts_store', accounts);
            if (!_db) return;
            try {
                if (!accounts || accounts.length === 0) {
                    await _db.ref('accounts_store').remove();
                } else {
                    await _db.ref('accounts_store').set(accounts);
                }
            } catch (e) { }
        },

        /** Listen to Accounts in real-time */
        listenAccounts(callback) {
            if (!_db) { callback(_ls('baqdouns_accounts_store')); return () => { }; }
            const ref = _db.ref('accounts_store');
            const handler = (snap) => {
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_accounts_store', list);
                callback(list);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        /** Save Service Packages (Admin sync) */
        async savePackages(packages) {
            _lsSet('baqdouns_service_packages', packages);
            if (!_db) return;
            try {
                if (!packages || packages.length === 0) {
                    await _db.ref('service_packages').remove();
                } else {
                    await _db.ref('service_packages').set(packages);
                }
            } catch (e) { }
        },

        /** Listen to Service Packages in real-time */
        listenPackages(callback) {
            if (!_db) { callback(_ls('baqdouns_service_packages')); return () => { }; }
            const ref = _db.ref('service_packages');
            const handler = (snap) => {
                const list = Object.values(snap.val() || {});
                _lsSet('baqdouns_service_packages', list);
                callback(list);
            };
            ref.on('value', handler);
            return () => ref.off('value', handler);
        },

        // ════════════════════════════════════════
        // 🔄 MIGRATION (LS → Firebase one-time sync)
        // ════════════════════════════════════════

        async migrate() {
            if (!_db) return;
            const done = localStorage.getItem('baqdouns_firebase_migrated');
            if (done === 'true') return;

            console.log('🔄 BaqdDB: Migrating existing localStorage data to Firebase...');
            try {
                // Users
                const users = _ls('baqdouns_users');
                const snap = await _db.ref('users').get();
                const existing = snap.exists() ? Object.keys(snap.val() || {}) : [];

                for (const user of users) {
                    if (user.email && !existing.includes(_enc(user.email))) {
                        await _db.ref(`users/${_enc(user.email)}`).set(user);
                    }
                }

                // Orders
                const orders = _ls('baqdouns_orders');
                for (const order of orders) {
                    if (order.id) {
                        const os = await _db.ref(`orders/${order.id}`).get();
                        if (!os.exists()) await _db.ref(`orders/${order.id}`).set(order);
                    }
                }

                // Complaints
                const complaints = _ls('baqdouns_complaints');
                for (const c of complaints) {
                    if (c.id) {
                        const cs = await _db.ref(`complaints/${c.id}`).get();
                        if (!cs.exists()) await _db.ref(`complaints/${c.id}`).set(c);
                    }
                }

                // Settings
                const settingsKeys = [
                    'freeze_welcome', 'lock_auctions', 'lock_accounts',
                    'lock_games', 'lock_transfers', 'lock_packages',
                    'admin_announcement'
                ];
                for (const k of settingsKeys) {
                    const val = localStorage.getItem(`baqdouns_${k}`);
                    if (val !== null) {
                        const ss = await _db.ref(`settings/${k}`).get();
                        if (!ss.exists()) await _db.ref(`settings/${k}`).set(val);
                    }
                }

                localStorage.setItem('baqdouns_firebase_migrated', 'true');
                console.log('✅ BaqdDB: Migration complete! All data is now in Firebase.');
            } catch (e) {
                console.warn('BaqdDB.migrate error:', e.message);
            }
        },

        // ════════════════════════════════════════
        // 🛡️ ADMIN ACTIONS (cross-device)
        // ════════════════════════════════════════

        /** Delete a login log from Firebase */
        async clearLoginLogs() {
            _lsSet('baqdouns_login_logs', []);
            localStorage.removeItem('baqdouns_logins_last_read');
            if (!_db) return;
            try { await _db.ref('login_logs').remove(); } catch (e) { }
        },

        /** Called by admin: update user points across all devices */
        async adminUpdatePoints(email, newPoints) {
            return BaqdDB.updateUser(email, { points: newPoints });
        },

        // ════════════════════════════════════════
        // 🔔 DYNAMIC APP NOTIFICATIONS
        // ════════════════════════════════════════

        /** Push a notification to be received by Admins (Real-time) */
        /** Push a notification to the Cloud Bridge (all devices) */
        async pushAppNotification(data) {
            const send = async () => {
                if (!_db) return;
                try {
                    const notif = {
                        title: data.title || 'تنبيه نظام بقدونس ⚡',
                        body: data.body || '',
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        type: data.type || 'info',
                        source: data.source || 'web_client',
                        id: 'N-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
                    };
                    await _db.ref('broadcast_notifications').push(notif);
                } catch (e) { console.error('Push failed:', e); }
            };
            if (!_db) BaqdDB.onReady(send);
            else send();
        },

        /** Listen for cloud notifications with duplicate prevention */
        listenAppNotifications(callback) {
            if (!_db) return () => { };
            const myFp = localStorage.getItem('baqdouns_fp') || 'unknown';
            const ref = _db.ref('broadcast_notifications').orderByChild('timestamp').limitToLast(5);

            // We use 'child_added' for real-time and 'value' for the initial batch
            const handler = (snap) => {
                const notif = snap.val();
                if (!notif || !notif.id) return;

                // Skip if sent by this device (unless it's a test and we want verification?)
                if (notif.source.includes(myFp) && notif.type !== 'test') return;

                // Only process fresh ones (less than 5 mins old) to avoid replay
                const serverTime = notif.timestamp || Date.now();
                if (Math.abs(Date.now() - serverTime) < 300000) {
                    callback(notif);
                }
            };

            ref.on('child_added', handler);
            return () => ref.off('child_added', handler);
        },

        /** Force a deep refresh of all local data from Firebase */
        async syncAll() {
            if (!_db) return;
            console.log('🔄 BaqdDB: Deep Syncing all data...');
            try {
                await Promise.all([
                    this.getUsers(), this.getOrders(), this.getCoupons(),
                    this.getComplaints(), this.getTransfers(), this.getLoginLogs(),
                    this.getAuction()
                ]);
                console.log('✅ BaqdDB: Deep Sync complete!');
            } catch (e) {
                console.warn('BaqdDB.syncAll error:', e.message);
            }
        },

        /** 🔥 FULL SYSTEM RESET (CLEAR ALL USER DATA, ORDERS, LOGS) 🚀 */
        async wipeCompleteSystem(auto = false) {
            if (!_db) return;

            if (!auto) {
                const isConfirmed = confirm('⚠️ تـنـبـيـه: هـذا سـيـقوم بـمـسـح كـافـة مـعـلـومـات الـمـسـتـخـدمـيـن، الـطـلـبـات، وجـلـسـات الـدخـول نـهـائـيـاً!\n\nهـل أنـت مـتـأكـد؟');
                if (!isConfirmed) return;
            }

            console.log('🚨 FRESH START INITIATED...');

            try {
                const nodes = [
                    'users', 'orders', 'login_logs', 'complaints', 'transfers',
                    'presence', 'auction', 'notifications', 'broadcast_notifications',
                    'email_to_uid', 'deleted_users', 'rejected_proofs', 'nanaa_unknown', 'biometrics'
                ];
                await Promise.all(nodes.map(n => _db.ref(n).remove()));

                // Clear LS but preserve critical flags to avoid infinite loops and maintain identity
                const fp = localStorage.getItem('baqdouns_fp');
                const adminAuthId = localStorage.getItem('baqdouns_admin_auth_id');
                const wipeFlag = localStorage.getItem('baqdouns_fw_wipe_final');

                localStorage.clear();

                if (fp) localStorage.setItem('baqdouns_fp', fp);
                if (adminAuthId) localStorage.setItem('baqdouns_admin_auth_id', adminAuthId);
                if (wipeFlag) localStorage.setItem('baqdouns_fw_wipe_final', wipeFlag);

                window.location.reload();
            } catch (e) {
                console.error('Wipe Failed:', e);
            }
        },

        // Internal helpers accessible for login.html
        _enc, _dec
    };

    // ── AUTO-WIPE TRIGGER (EXECUTED ONCE TO RESET EVERYTHING) ──
    BaqdDB.onReady(() => {
        if (!localStorage.getItem('baqdouns_fw_wipe_final')) {
            localStorage.setItem('baqdouns_fw_wipe_final', 'true');
            BaqdDB.wipeCompleteSystem(true);
        }
    });

    // ── Secret URL Trigger: #SYSTEM_WIPE_FORCE ──────────────────
    if (window.location.hash === '#SYSTEM_WIPE_FORCE') {
        setTimeout(() => {
            if (window.BaqdDB) BaqdDB.wipeCompleteSystem();
        }, 3000);
    }

    // ── Expose globally ────────────────────────────────────────
    window.BaqdDB = BaqdDB;

    // ── Auto-initialize ────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }

})();
