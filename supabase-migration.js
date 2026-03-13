// ================================================================
// 🚀 SUPABASE DATA MIGRATION ENGINE v5 (THE ULTIMATE RECOVERY)
// ================================================================

(function () {
    'use strict';

    async function startMigration() {
        if (!window.BaqdDB || !window.BaqdSupabase) {
            setTimeout(startMigration, 2000);
            return;
        }

        window.BaqdSupabase.onReady(async () => {
            console.log("🌪️ STARTING ULTIMATE RECOVERY v5 (Scanning Everything)...");

            try {
                const db = firebase.database();
                const allEmailsFound = new Set();
                const userRecords = new Map();

                // ── وظيفة مساعدة لتجميع البيانات ──
                const collect = (email, data) => {
                    if (email && email.includes('@')) {
                        const cleanEmail = email.toLowerCase().trim();
                        allEmailsFound.add(cleanEmail);

                        // نأخذ دائماً النسخة التي تحتوي على نقاط أكثر أو تحديث أحدث
                        const existing = userRecords.get(cleanEmail);
                        if (!existing || (parseInt(data.points || 0) > parseInt(existing.points || 0))) {
                            userRecords.set(cleanEmail, {
                                ...data,
                                email: cleanEmail,
                                name: data.name || data.displayName || (existing ? existing.name : cleanEmail.split('@')[0]),
                                points: parseInt(data.points || (existing ? existing.points : 0))
                            });
                        }
                    }
                };

                // 1. فحص المستخدمين الحاليين (Live)
                console.log("📡 Step 1: Scanning LIVE users...");
                const users = await window.BaqdDB.getUsers();
                users.forEach(u => {
                    let email = u.email || (u.id && u.id.includes('___') ? window.BaqdDB.decodeEmail(u.id) : null);
                    collect(email, u);
                });

                // 2. فحص صندوق "المحذوفات" (Deleted Users) - هنا قد نجد المحذوفين خطأً!
                console.log("📡 Step 2: Scanning Safety Net (deleted_users)...");
                const deletedSnap = await db.ref('deleted_users').get();
                if (deletedSnap.exists()) {
                    Object.entries(deletedSnap.val()).forEach(([key, u]) => {
                        let email = u.email || (key.includes('___') ? window.BaqdDB.decodeEmail(key) : null);
                        if (email) {
                            console.log(`♻️ Found record in deleted_users: ${email}`);
                            collect(email, { ...u, isVerified: false });
                        }
                    });
                }

                // 3. فحص سجلات الدخول (Login Logs) - لاستخراج الإيميلات من كل عملية دخول تاريخية
                console.log("📡 Step 3: Scanning Historical Login Logs...");
                const logsSnap = await db.ref('login_logs').get();
                if (logsSnap.exists()) {
                    Object.entries(logsSnap.val()).forEach(([id, l]) => {
                        let email = l.email || (id.includes('___') ? window.BaqdDB.decodeEmail(id) : null);
                        if (email) {
                            collect(email, { name: l.name });
                        }
                    });
                }

                // 4. فحص خريطة E-mail to UID (المصدر الأساسي للفهرسة)
                console.log("📡 Step 4: Scanning Email-to-UID mapping...");
                const mapSnap = await db.ref('email_to_uid').get();
                if (mapSnap.exists()) {
                    Object.keys(mapSnap.val()).forEach(key => {
                        let email = window.BaqdDB.decodeEmail(key);
                        collect(email, {});
                    });
                }

                console.log(`📊 TOTAL UNIQUE ACCOUNTS IDENTIFIED: ${allEmailsFound.size}`);

                // 5. المزامنة النهائية مع Supabase
                console.log("🛰️ Final Sync to Supabase in progress...");
                let syncCount = 0;
                for (let email of allEmailsFound) {
                    const u = userRecords.get(email);
                    await window.BaqdSupabase.saveUser({
                        email: email,
                        name: u.name || email.split('@')[0],
                        points: u.points || 0,
                        is_verified: u.isVerified || false,
                        is_banned: u.isBanned || false,
                        last_active: Date.now()
                    });
                    syncCount++;
                    if (syncCount % 10 === 0) console.log(`🔄 Synced ${syncCount} users...`);
                }

                console.log("✨ GLOBAL RECOVERY FINISHED! All accounts moved to Supabase.");
                localStorage.setItem('baqduns_global_recovery_v5_complete', 'true');

            } catch (err) {
                console.error("❌ Recovery Error:", err);
            }
        });
    }

    // التنفيذ الفوري
    startMigration();

})();
