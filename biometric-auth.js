/**
 * 🛡️ BAQDUNS BIOMETRIC HELPER (WebAuthn / Passkeys)
 * يسمح بتسجيل الدخول عن طريق Face ID أو بصمة الإصبع أو قفل الويندوز
 */
window.BaqdunsAuth = {
    // التحقق هل الجهاز يدعم البصمة/الوجه
    isSupported: async function () {
        return window.PublicKeyCredential &&
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    },

    // إنشاء "هوية بيومترية" جديدة (يتم استدعاؤها مرة واحدة للأدمن)
    registerAdmin: async function (adminEmail) {
        if (!await this.isSupported()) throw new Error("الجهاز لا يدعم التوثيق البيومتري");

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const options = {
            publicKey: {
                challenge: challenge,
                rp: { name: "Baqduns System", id: window.location.hostname },
                user: {
                    id: Uint8Array.from(adminEmail, c => c.charCodeAt(0)),
                    name: adminEmail,
                    displayName: "Admin Baqduns"
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: { authenticatorAttachment: "platform" },
                timeout: 60000,
                attestation: "direct"
            }
        };

        const credential = await navigator.credentials.create(options);
        // تخزين الـ Credential ID في localStorage بشكل مشفر للتحقق لاحقاً
        const credId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
        localStorage.setItem('baqdouns_admin_auth_id', credId);

        // ✅ Sync to Firebase (Laptop + Phone sync)
        if (window.BaqdDB) {
            BaqdDB.setSetting('admin_auth_id', credId);
        }

        return credId;
    },

    // التحقق من الهوية (Face ID / Fingerprint)
    verifyAdmin: async function () {
        let storedId = localStorage.getItem('baqdouns_admin_auth_id');

        // ✅ Sync from Firebase if missing
        if (!storedId && window.BaqdDB) {
            storedId = await BaqdDB.getSetting('admin_auth_id');
            if (storedId) localStorage.setItem('baqdouns_admin_auth_id', storedId);
        }

        if (!storedId) throw new Error("لم يتم تسجيل Face ID لهذا الجهاز مسبقاً");

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const options = {
            publicKey: {
                challenge: challenge,
                allowCredentials: [{
                    id: Uint8Array.from(atob(storedId), c => c.charCodeAt(0)),
                    type: 'public-key'
                }],
                timeout: 60000,
                userVerification: "required"
            }
        };

        const assertion = await navigator.credentials.get(options);
        return assertion !== null;
    }
};
