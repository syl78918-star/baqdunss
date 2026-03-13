
(function () {
    const targetEmail = "wlaeedabutouima@gmail.com";
    const targetKey = "wlaeedabutouima___gmail,com";

    console.log(`🕵️ Diagnostic: Searching for ${targetEmail} / ${targetKey}`);

    BaqdDB.onReady(async () => {
        const db = firebase.database();

        // Check users node directly
        const userSnap = await db.ref(`users/${targetKey}`).get();
        if (userSnap.exists()) {
            console.log("✅ FOUND in users node:", userSnap.val());
        } else {
            console.log("❌ NOT FOUND in users node.");
        }

        // Check logs node
        const logsSnap = await db.ref('login_logs').get();
        if (logsSnap.exists()) {
            const logs = logsSnap.val();
            let foundInLogs = false;
            Object.entries(logs).forEach(([id, log]) => {
                const logEmail = log.email || (id.includes('___') ? BaqdDB.decodeEmail(id) : null);
                if (logEmail && logEmail.toLowerCase().includes("wlaeedabutouima")) {
                    console.log("✅ FOUND in login_logs:", id, log);
                    foundInLogs = true;
                }
            });
            if (!foundInLogs) console.log("❌ NOT FOUND in login_logs.");
        }

        // Check email_to_uid
        const mappingSnap = await db.ref(`email_to_uid/${targetKey}`).get();
        if (mappingSnap.exists()) {
            console.log("✅ FOUND in email_to_uid mapping:", mappingSnap.val());
        } else {
            console.log("❌ NOT FOUND in email_to_uid mapping.");
        }
    });
})();
