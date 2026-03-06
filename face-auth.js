/**
 * 🎭 BAQDUNS FACE AUTH — FAST + SAFE
 * مُغلَّف بـ try-catch شامل — أي خطأ لن يؤثر على الصفحة أبداً
 */

try {

    window.BaqdunseFaceAuth = (function () {
        'use strict';

        const STORAGE_KEY = 'baqdouns_face_descriptor';
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        const THRESHOLD = 0.47;
        const INPUT_SIZE = 128;    // أسرع من 224
        const SCORE_THR = 0.3;
        const TICK_MS = 150;    // كل 150ms

        let _ready = false;
        let _loading = false;

        // ── تحميل مسبق (صامت تماماً) ──────────────────────────
        async function _preload() {
            if (_ready || _loading) return;
            _loading = true;
            try {
                await _loadScript('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js');
                // نستخدم faceLandmark68Net (الموثوق) بدل التيني
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                _ready = true;
                console.log('✅ FaceAuth: نماذج جاهزة');
            } catch (e) {
                console.warn('FaceAuth preload silent error:', e.message);
                _loading = false; // نسمح بإعادة المحاولة
            } finally {
                if (_ready) _loading = false;
            }
        }

        function _loadScript(src) {
            if (window.faceapi) return Promise.resolve();
            return new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = src; s.onload = res;
                s.onerror = () => rej(new Error('فشل تحميل مكتبة الوجه — تأكد من الاتصال بالإنترنت'));
                document.head.appendChild(s);
            });
        }

        // ── فتح الكاميرا ─────────────────────────────────────
        async function _startCam(video) {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 320, height: 240 }
            });
            video.srcObject = stream;
            video.play();
            await new Promise(r => (video.onloadedmetadata = r));
            return stream;
        }

        function _stopCam(stream) {
            try { stream?.getTracks().forEach(t => t.stop()); } catch (e) { }
        }

        // ── واجهة الكاميرا ───────────────────────────────────
        function _showUI(title, sub, showCapture) {
            document.getElementById('face-auth-overlay')?.remove();
            const div = document.createElement('div');
            div.id = 'face-auth-overlay';
            div.style.cssText = `
            position:fixed;inset:0;z-index:999999;
            background:rgba(4,30,66,0.97);
            display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            font-family:Roboto,Cairo,sans-serif;
        `;
            div.innerHTML = `
            <style>
                @keyframes scan{0%,100%{top:10%}50%{top:85%}}
                @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(197,160,89,.6)}50%{box-shadow:0 0 0 18px rgba(197,160,89,0)}}
            </style>
            <div style="color:#C5A059;font-size:1.4rem;font-weight:bold;margin-bottom:8px;">${title}</div>
            <div id="fa-sub" style="color:#aaa;font-size:.85rem;margin-bottom:20px;">${sub}</div>

            <div style="position:relative;width:260px;height:260px;">
                <div style="position:absolute;inset:0;border-radius:50%;overflow:hidden;border:4px solid #C5A059;box-shadow:0 0 30px rgba(197,160,89,.4);">
                    <video id="fa-video" autoplay muted playsinline
                        style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);border-radius:50%;"></video>
                    <div id="fa-scan" style="position:absolute;left:0;right:0;height:2px;
                        background:linear-gradient(90deg,transparent,#C5A059,transparent);
                        top:40%;animation:scan 1.4s ease-in-out infinite;
                        box-shadow:0 0 8px #C5A059;"></div>
                </div>
                <div style="position:absolute;inset:-5px;border-radius:50%;border:3px solid #C5A059;animation:glow 1.8s ease-in-out infinite;pointer-events:none;"></div>
            </div>

            <div id="fa-status" style="margin-top:18px;font-size:.88rem;color:#aaa;min-height:22px;text-align:center;"></div>
            <div style="width:260px;height:3px;background:rgba(255,255,255,.1);border-radius:2px;margin-top:12px;overflow:hidden;">
                <div id="fa-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#C5A059,#f0d080);border-radius:2px;transition:width .3s ease;"></div>
            </div>

            <div style="display:flex;gap:12px;margin-top:22px;">
                ${showCapture ? `<button id="fa-cap" style="background:#C5A059;color:#041E42;border:none;padding:11px 26px;border-radius:28px;font-weight:bold;cursor:pointer;font-size:.9rem;">📸 التقاط</button>` : ''}
                <button id="fa-cancel" style="background:rgba(255,255,255,.1);color:white;border:1px solid rgba(255,255,255,.2);padding:11px 22px;border-radius:28px;cursor:pointer;font-size:.85rem;">إلغاء</button>
            </div>
        `;
            document.body.appendChild(div);
            return div;
        }

        const _st = (m, c = '#aaa') => { try { const e = document.getElementById('fa-status'); if (e) { e.textContent = m; e.style.color = c; } } catch (e) { } };
        const _sub = (m) => { try { const e = document.getElementById('fa-sub'); if (e) e.textContent = m; } catch (e) { } };
        const _bar = (p) => { try { const e = document.getElementById('fa-bar'); if (e) e.style.width = p + '%'; } catch (e) { } };
        const _rm = () => { try { document.getElementById('face-auth-overlay')?.remove(); } catch (e) { } };
        const _opts = () => new faceapi.TinyFaceDetectorOptions({ inputSize: INPUT_SIZE, scoreThreshold: SCORE_THR });

        // ── استخراج بصمة الوجه ───────────────────────────────
        async function _getDesc(video, tries = 6) {
            for (let i = 0; i < tries; i++) {
                await new Promise(r => setTimeout(r, 200));
                try {
                    const d = await faceapi.detectSingleFace(video, _opts())
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                    if (d) return d.descriptor;
                } catch (e) { /* تجاهل أخطاء الإطارات الفردية */ }
            }
            return null;
        }

        // ─────────────────────────────────────────────────────
        // PUBLIC API
        // ─────────────────────────────────────────────────────
        // ── المزامنة السحابية الذكية (Smart Cloud Sync) ────────────────
        async function _syncWithCloud() {
            if (!window.BaqdDB) return;
            try {
                // ننتظر اتصال قاعدة البيانات أو نحاول الجلب فوراً إذا كانت جاهزة
                const doSync = async () => {
                    const cloudDesc = await BaqdDB.getSetting('face_descriptor');
                    if (cloudDesc && Array.isArray(cloudDesc)) {
                        const cloudStr = JSON.stringify(cloudDesc);
                        const local = localStorage.getItem(STORAGE_KEY);

                        if (local !== cloudStr) {
                            localStorage.setItem(STORAGE_KEY, cloudStr);
                            console.log('✨ [FaceAuth] تم مزامنة بصمة الوجه من السحابة بنجاح');

                            // نحدث الـ UI لو كان موجود
                            const hint = document.getElementById('face-reg-hint');
                            if (hint) hint.style.display = 'none';
                            const dot = document.getElementById('face-login-dot');
                            if (dot) dot.style.background = '#C5A059';
                        }
                    }
                };

                BaqdDB.onReady(doSync);
                // محاولة إضافية بعد فترة قصيرة لضمان التحميل
                setTimeout(doSync, 2000);
            } catch (e) { }
        }

        // ─────────────────────────────────────────────────────
        // PUBLIC API
        // ─────────────────────────────────────────────────────
        const API = {

            isRegistered: () => {
                try {
                    const local = !!localStorage.getItem(STORAGE_KEY);
                    // If shared settings are loaded in memory, check them too
                    const cloud = window._fbSettings && window._fbSettings.face_descriptor;
                    // Proactive check: if we know it's in cloud, we are registered
                    return local || !!cloud;
                } catch (e) { return false; }
            },

            /** تسجيل وجه الأدمن */
            registerFace() {
                return new Promise(async (resolve, reject) => {
                    let stream = null;
                    try {
                        _showUI('🎭 تسجيل بصمة الوجه', 'ضع وجهك في المنتصف ثم اضغط التقاط', true);
                        _st('⏳ جاري التحضير...', '#f39c12'); _bar(10);

                        if (!_ready) { _st('⏳ تحميل AI... (مرة واحدة فقط)', '#f39c12'); await _preload(); }
                        if (!_ready) throw new Error('فشل تحميل نظام الذكاء الاصطناعي — تأكد من الاتصال بالإنترنت');

                        _st('📷 فتح الكاميرا...', '#f39c12'); _bar(40);
                        const video = document.getElementById('fa-video');
                        stream = await _startCam(video);
                        _st('✅ جاهز — اضغط التقاط', '#27ae60'); _bar(70);

                        document.getElementById('fa-cap').onclick = async () => {
                            _st('🔍 تحليل الوجه...', '#C5A059'); _bar(85);
                            const desc = await _getDesc(video);
                            if (!desc) { _st('❌ لم يُكشف وجه — تأكد من الإضاءة وقرّب وجهك', '#e74c3c'); return; }

                            const descArray = Array.from(desc);
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(descArray));

                            // ✅ Sync to Firebase (Laptop + Phone sync)
                            if (window.BaqdDB) {
                                BaqdDB.setSetting('face_descriptor', descArray);
                            }

                            _bar(100); _st('✅ تم الحفظ! 🎉', '#27ae60'); _sub('يمكنك الآن الدخول ببصمة الوجه');
                            _stopCam(stream); stream = null;
                            document.getElementById('fa-cap').style.display = 'none';
                            setTimeout(() => { _rm(); resolve(true); }, 1600);
                        };

                        document.getElementById('fa-cancel').onclick = () => {
                            _stopCam(stream); _rm(); reject(new Error('تم الإلغاء'));
                        };
                    } catch (err) {
                        _stopCam(stream); _rm(); reject(err);
                    }
                });
            },

            /** التحقق من الوجه لتسجيل الدخول */
            verifyFace() {
                return new Promise(async (resolve, reject) => {
                    let stream = null;
                    try {
                        let raw = localStorage.getItem(STORAGE_KEY);

                        // ✅ Try Firebase Fallback if local is missing (Deep Fetch)
                        if (!raw && window.BaqdDB) {
                            _showUI('🎭 التحقق من الهوية', 'جاري جلب البصمة السحابية...', false);
                            _st('☁️ جاري جلب البصمة من السحابة...', '#3498db');
                            // We force a refresh from server
                            await new Promise(r => setTimeout(r, 1000)); // Small wait for connection
                            const cloudDesc = await BaqdDB.getSetting('face_descriptor');
                            if (cloudDesc && Array.isArray(cloudDesc)) {
                                raw = JSON.stringify(cloudDesc);
                                localStorage.setItem(STORAGE_KEY, raw);
                                _st('✅ تم العثور على البصمة!', '#27ae60');
                            }
                        }

                        if (!raw) {
                            _rm();
                            reject(new Error('لم يتم تسجيل وجه الأدمن على هذا الجهاز أو السحابة. يرجى الدخول بكلمة السر أولاً وتسجيل الوجه.'));
                            return;
                        }

                        _showUI('🎭 التحقق من الهوية', 'ضع وجهك — سيتم التعرف عليك تلقائياً', false);
                        _st('⏳ تحضير...', '#f39c12'); _bar(10);

                        if (!_ready) { _st('⏳ تحميل AI...', '#f39c12'); await _preload(); }
                        if (!_ready) throw new Error('فشل تحميل AI — تأكد من الاتصال بالإنترنت');

                        _st('📷 فتح الكاميرا...', '#f39c12'); _bar(30);
                        const video = document.getElementById('fa-video');
                        stream = await _startCam(video);
                        _bar(50); _st('👀 جاري التعرف...', '#3498db');

                        const stored = new Float32Array(JSON.parse(raw));
                        let n = 0;
                        const MAX = 20; // زيادة وقت المحاولة لـ 3 ثواني

                        const timer = setInterval(async () => {
                            n++;
                            _bar(50 + (n / MAX) * 45);

                            if (n > MAX) {
                                clearInterval(timer); _stopCam(stream);
                                _st('❌ انتهى الوقت — حاول مجدداً', '#e74c3c'); _bar(100);
                                setTimeout(() => { _rm(); reject(new Error('لم يتم التعرف على الوجه')); }, 1500);
                                return;
                            }

                            try {
                                const d = await faceapi.detectSingleFace(video, _opts())
                                    .withFaceLandmarks()
                                    .withFaceDescriptor();

                                if (!d) { _st(`👀 بحث... (${n}/${MAX})`, '#3498db'); return; }

                                const dist = faceapi.euclideanDistance(stored, d.descriptor);

                                if (dist < THRESHOLD) {
                                    clearInterval(timer); _stopCam(stream);
                                    _bar(100);
                                    _st('✅ مرحباً أيها الأدمن! 👋', '#27ae60'); _sub('🎉 تم التحقق');
                                    const sc = document.getElementById('fa-scan');
                                    if (sc) { sc.style.animation = 'none'; sc.style.top = '0'; sc.style.height = '100%'; sc.style.background = 'rgba(39,174,96,0.3)'; }
                                    setTimeout(() => { _rm(); resolve(true); }, 1400);
                                } else {
                                    _st(`🔍 وجه مكتشف — (${Math.round((1 - dist) * 100)}% مطابقة)`, '#f39c12');
                                }
                            } catch (e) { /* تجاهل أخطاء الإطارات */ }

                        }, TICK_MS);

                        document.getElementById('fa-cancel').onclick = () => {
                            clearInterval(timer); _stopCam(stream); _rm();
                            reject(new Error('تم الإلغاء'));
                        };
                    } catch (err) {
                        _stopCam(stream); _rm(); reject(err);
                    }
                });
            },

            deleteFace: () => {
                try {
                    localStorage.removeItem(STORAGE_KEY);
                    if (window.BaqdDB) BaqdDB.setSetting('face_descriptor', null);
                } catch (e) { }
            }
        };

        // ── تحميل مسبق هادئ (لا يعيق الصفحة) ───────────────
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                _preload().catch(() => { });
                _syncWithCloud().catch(() => { });
            });
        } else {
            setTimeout(() => {
                _preload().catch(() => { });
                _syncWithCloud().catch(() => { });
            }, 500);
        }

        return API;
    })();

} catch (faceAuthCriticalError) {
    // أي خطأ كارثي في face-auth.js لن يؤثر على الصفحة
    console.warn('FaceAuth module failed to load:', faceAuthCriticalError.message);
    window.BaqdunseFaceAuth = {
        isRegistered: () => false,
        registerFace: () => Promise.reject(new Error('نظام الوجه غير متاح حالياً')),
        verifyFace: () => Promise.reject(new Error('نظام الوجه غير متاح حالياً')),
        deleteFace: () => { }
    };
}
