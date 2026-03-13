
(function () {
    const targetEmail = "wlaeedabutouima@gmail.com";
    const targetKey = "wlaeedabutouima___gmail,com";

    console.log(`🕵️ Target Recovery: Ensuring ${targetEmail} exists...`);

    if (window.BaqdDB) {
        BaqdDB.onReady(async () => {
            const db = firebase.database();

            try {
                // Check users node directly
                const userSnap = await db.ref(`users/${targetKey}`).get();
                if (userSnap.exists()) {
                    console.log("✅ User already exists. No action needed.");
                } else {
                    console.log("⚡ Waleed not found. Starting reconstruction...");

                    // 1. Try to find his data in logs or just create fresh
                    const logsSnap = await db.ref('login_logs').get();
                    let name = "وليد";
                    if (logsSnap.exists()) {
                        Object.values(logsSnap.val()).forEach(l => {
                            if (l.email && l.email.toLowerCase().trim() === targetEmail) {
                                name = l.name || name;
                            }
                        });
                    }

                    const newUser = {
                        email: targetEmail,
                        name: name,
                        points: 100, // Default seeds
                        joined: 'Restored (AI Fix)',
                        isVerified: true,
                        lastActive: Date.now(),
                        uid: 'temp_' + targetKey
                    };

                    // Save to user node
                    await db.ref(`users/${targetKey}`).set(newUser);

                    // Add to email_to_uid map
                    await db.ref(`email_to_uid/${targetKey}`).set(targetKey);

                    // Remove from deleted_users just in case
                    await db.ref(`deleted_users/${targetKey}`).remove();

                    console.log("✨ SUCCESS: Waleed added back to users list!");
                    if (window.showAdminToast) showAdminToast(`⚡ تم استعادة حساب ${targetEmail} تلقائياً!`, 'success');
                }
            } catch (e) {
                console.error("Target recovery error:", e);
            }
        });
    }
})();
