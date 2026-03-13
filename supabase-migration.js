// ================================================================
// 🚀 SUPABASE DATA MIGRATION ENGINE - محرك هجرة البيانات الذكي
// ================================================================
// يقوم هذا السكربت بنقل المستخدمين من Firebase إلى Supabase 
// ويضمن استرجاع أي إيميلات كانت مفقودة وربطها بشكل نهائي.

(function () {
    'use strict';

    async function startMigration() {
        console.log("🚀 Migration Engine: Checking for data to sync...");

        // الانتظار حتى تكون الأنظمة جاهزة
        if (!window.BaqdDB || !window.BaqdSupabase) {
            setTimeout(startMigration, 2000);
            return;
        }

        window.BaqdSupabase.onReady(async () => {
            try {
                // 1. جلب كافة المستخدمين من Firebase (المصدر القديم)
                const firebaseUsers = await window.BaqdDB.getUsers();
                if (!firebaseUsers || firebaseUsers.length === 0) {
                    console.log("ℹ️ Migration: No users found in Firebase.");
                    return;
                }

                console.log(`📦 Migration: Found ${firebaseUsers.length} users in Firebase. Starting sync...`);

                let syncCount = 0;
                for (const user of firebaseUsers) {
                    // التحقق من صحة الإيميل أو استرجاعه من الـ ID (الحمايو من الـ undefined)
                    let email = user.email;
                    if ((!email || email === 'undefined') && user.id && user.id.includes('___')) {
                        email = window.BaqdDB.decodeEmail(user.id);
                    }

                    if (!email || email === 'undefined') {
                        console.warn(`⚠️ Migration: Skipping user with no valid email/ID:`, user);
                        continue;
                    }

                    // تجهيز البيانات للنقل لـ Supabase
                    const cleanUser = {
                        email: email.toLowerCase().trim(),
                        name: user.name || user.displayName || 'User',
                        points: user.points || 0,
                        isVerified: user.isVerified || false,
                        isBanned: user.isBanned || false,
                        uid: user.id || user.uid
                    };

                    // الحفظ في Supabase (نظام الـ Upsert يمنع التكرار)
                    await window.BaqdSupabase.saveUser(cleanUser);
                    syncCount++;
                }

                console.log(`✅ Migration Complete: ${syncCount} users are now secured in Supabase.`);

                // إضافة وسم لـ localStorage لعدم تكرار العملية الثقيلة دائماً
                localStorage.setItem('baqduns_migration_v1_done', 'true');

            } catch (err) {
                console.error("❌ Migration Failed:", err.message);
            }
        });
    }

    // تشغيل الهجرة بمجرد تحميل الصفحة إذا لم تكن قد تمت من قبل
    if (!localStorage.getItem('baqduns_migration_v1_done')) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startMigration);
        } else {
            startMigration();
        }
    }

})();
