// ================================================================
// 🚀 SUPABASE DATA MIGRATION ENGINE v3 (Full Data Transfer)
// ================================================================

(function () {
    'use strict';

    async function startMigration() {
        if (!window.BaqdDB || !window.BaqdSupabase) {
            setTimeout(startMigration, 2000);
            return;
        }

        window.BaqdSupabase.onReady(async () => {
            console.log("🚀 Starting Full Migration (Users + Orders + Logs)...");

            try {
                // 1. نقل المستخدمين
                const users = await window.BaqdDB.getUsers();
                if (users && users.length > 0) {
                    console.log(`👤 Syncing ${users.length} users...`);
                    await processUsers(users);
                }

                // 2. نقل الطلبات
                if (window.BaqdDB.getOrders) {
                    const orders = await window.BaqdDB.getOrders();
                    if (orders && orders.length > 0) {
                        console.log(`📦 Syncing ${orders.length} orders...`);
                        await processOrders(orders);
                    }
                }

                console.log("✨ All data has been synchronized to Supabase!");
                localStorage.setItem('baqduns_full_migration_done', 'true');

            } catch (err) {
                console.error("❌ Migration Error:", err);
            }
        });
    }

    async function processUsers(users) {
        for (const u of users) {
            let email = u.email || (u.id && u.id.includes('___') ? window.BaqdDB.decodeEmail(u.id) : null);
            if (email && email.includes('@')) {
                await window.BaqdSupabase.saveUser({
                    email: email.toLowerCase().trim(),
                    name: u.name || u.displayName || 'User',
                    points: parseInt(u.points) || 0,
                    isVerified: u.isVerified || false,
                    isBanned: u.isBanned || false
                });
            }
        }
    }

    async function processOrders(orders) {
        for (const o of orders) {
            let email = o.email || o.userEmail;
            // محاولة تنظيف الإيميل إذا كان معطوباً في الطلب
            if (!email || email === 'undefined') {
                // ابحث عن الإيميل في بيانات العميل إذا لزم الأمر
            }

            if (email && email.includes('@')) {
                await window.BaqdSupabase.addOrder({
                    id: o.id,
                    email: email.toLowerCase().trim(),
                    customer: o.customer || o.customerName,
                    items: o.items || [],
                    total: parseFloat(o.total) || 0,
                    status: o.status || 'Pending',
                    timestamp: o.timestamp || Date.now()
                });
            }
        }
    }

    // تشغيل الهجرة
    startMigration();

})();
