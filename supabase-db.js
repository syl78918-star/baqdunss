// ================================================================
// 🌿 BAQDUNS SUPABASE LAYER - بقدونس السحابي (الجيل الجديد)
// ================================================================

(function () {
    'use strict';

    let _client = null;
    let _readyQueue = [];
    let _isReady = false;

    // ── Initialize Supabase ────────────────────────────────────
    async function _init() {
        const config = window.BAQDUNS_SUPABASE_CONFIG;
        if (!config || !config.url || config.url.includes('YOUR_')) {
            console.warn('⚠️ Supabase not configured yet. Please check supabase-config.js');
            return;
        }

        try {
            // Load Supabase SDK dynamically
            if (typeof supabase === 'undefined') {
                await _loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
            }

            _client = supabase.createClient(config.url, config.apiKey);
            console.log('✅ BaqdSupabase: Connected to Cloud!');

            _isReady = true;
            _readyQueue.forEach(fn => fn());
            _readyQueue = [];

        } catch (err) {
            console.error('🔥 BaqdSupabase Init Error:', err.message);
        }
    }

    function _loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // ────────────────────────────────────────────────────────────
    // PUBLIC API
    // ────────────────────────────────────────────────────────────
    window.BaqdSupabase = {
        onReady: (fn) => {
            if (_isReady) fn();
            else _readyQueue.push(fn);
        },

        // 👤 USERS
        async saveUser(user) {
            if (!user || !user.email) return;
            const { data, error } = await _client
                .from('users')
                .upsert({
                    email: user.email.toLowerCase(),
                    name: user.name || user.displayName,
                    points: user.points || 0,
                    is_verified: user.isVerified || false,
                    is_banned: user.isBanned || false,
                    last_active: Date.now(),
                    device_fp: localStorage.getItem('baqdouns_fp')
                });
            if (error) console.error('Supabase Save User Error:', error.message);
            return data;
        },

        async getUsers() {
            const { data, error } = await _client
                .from('users')
                .select('*')
                .order('points', { ascending: false });
            return data || [];
        },

        // 📦 ORDERS
        async addOrder(order) {
            const { data, error } = await _client
                .from('orders')
                .insert({
                    id: order.id,
                    email: order.email || order.userEmail,
                    customer_name: order.customer,
                    items: order.items,
                    total: order.total,
                    status: order.status || 'Pending',
                    timestamp: order.timestamp || Date.now()
                });
            return data;
        },

        // 🔔 REAL-TIME LISTENERS
        listenUsers(callback) {
            const channel = _client
                .channel('users_realtime')
                .on('postgres_changes', { event: '*', table: 'users' }, payload => {
                    this.getUsers().then(callback);
                })
                .subscribe();

            this.getUsers().then(callback); // Initial load
            return () => _client.removeChannel(channel);
        }
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }

})();
