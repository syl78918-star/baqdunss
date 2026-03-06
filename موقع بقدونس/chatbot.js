// 🌿 نعنع - Baqduns AI Chatbot
// Jordanian Dialect Chatbot with Personality

class NanaaChatbot {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.userName = null;
        this.init();
    }

    init() {
        this.createChatWidget();
        this.attachEventListeners();
        this.greetUser();
    }

    createChatWidget() {
        const chatHTML = `
            <!-- نعنع Chatbot Widget -->
            <div id="nanaa-chatbot" class="nanaa-chatbot">
                <!-- Chat Button -->
                <button id="nanaa-toggle" class="nanaa-toggle" title="تحدث مع نعنع 🌿">
                    <div class="nanaa-avatar">
                        <span class="nanaa-leaf">🌿</span>
                        <span class="nanaa-pulse"></span>
                    </div>
                    <span class="nanaa-badge" id="nanaa-notification">1</span>
                </button>

                <!-- Chat Window -->
                <div id="nanaa-window" class="nanaa-window">
                    <!-- Header -->
                    <div class="nanaa-header">
                        <div class="nanaa-header-info">
                            <div class="nanaa-avatar-small">🌿</div>
                            <div>
                                <div class="nanaa-name">نعنع</div>
                                <div class="nanaa-status">
                                    <span class="nanaa-status-dot"></span>
                                    متواجد الآن
                                </div>
                            </div>
                        </div>
                        <button class="nanaa-close" id="nanaa-close">✕</button>
                    </div>

                    <!-- Messages Container -->
                    <div class="nanaa-messages" id="nanaa-messages">
                        <!-- Messages will be inserted here -->
                    </div>

                    <!-- Quick Replies -->
                    <div class="nanaa-quick-replies" id="nanaa-quick-replies">
                        <!-- Quick reply buttons will be inserted here -->
                    </div>

                    <!-- Input Area -->
                    <div class="nanaa-input-area">
                        <input 
                            type="text" 
                            id="nanaa-input" 
                            class="nanaa-input" 
                            placeholder="اكتب رسالتك هون..."
                            autocomplete="off"
                        >
                        <button id="nanaa-send" class="nanaa-send">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Typing Indicator -->
                    <div class="nanaa-typing" id="nanaa-typing" style="display: none;">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    attachEventListeners() {
        const toggle = document.getElementById('nanaa-toggle');
        const close = document.getElementById('nanaa-close');
        const send = document.getElementById('nanaa-send');
        const input = document.getElementById('nanaa-input');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.toggleChat());
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const window = document.getElementById('nanaa-window');
        const badge = document.getElementById('nanaa-notification');

        if (this.isOpen) {
            window.classList.add('nanaa-window-open');
            badge.style.display = 'none';
            document.getElementById('nanaa-input').focus();
        } else {
            window.classList.remove('nanaa-window-open');
        }
    }

    greetUser() {
        setTimeout(() => {
            const greetings = [
                "يا هلا! 🌿 أنا نعنع، مساعدك الشخصي هون!",
                "أهلين وسهلين! 🌿 نعنع بخدمتك!",
                "مرحبتين! 🌿 أنا نعنع، شو بقدر أساعدك اليوم؟"
            ];

            const greeting = greetings[Math.floor(Math.random() * greetings.length)];
            this.addBotMessage(greeting);

            setTimeout(() => {
                this.showQuickReplies([
                    "شو الباكجات المتوفرة؟ 📦",
                    "كيف بطلب؟ 🛒",
                    "الأسعار قديش؟ 💰",
                    "عندكم عروض؟ 🎁"
                ]);
            }, 800);
        }, 1000);
    }

    sendMessage() {
        const input = document.getElementById('nanaa-input');
        const message = input.value.trim();

        if (!message) return;

        this.addUserMessage(message);
        input.value = '';

        this.showTyping();
        setTimeout(() => {
            this.hideTyping();
            this.processMessage(message);
        }, 1000 + Math.random() * 1000);
    }

    addUserMessage(text) {
        const messagesContainer = document.getElementById('nanaa-messages');
        const messageHTML = `
            <div class="nanaa-message nanaa-message-user">
                <div class="nanaa-message-bubble">${this.escapeHtml(text)}</div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }

    addBotMessage(text, isHtml = false) {
        const messagesContainer = document.getElementById('nanaa-messages');
        const content = isHtml ? text : this.escapeHtml(text);
        const messageHTML = `
            <div class="nanaa-message nanaa-message-bot">
                <div class="nanaa-avatar-tiny">🌿</div>
                <div class="nanaa-message-bubble">${content}</div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }

    showQuickReplies(replies) {
        const container = document.getElementById('nanaa-quick-replies');
        container.innerHTML = '';

        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'nanaa-quick-reply';
            button.textContent = reply;
            button.onclick = () => {
                container.innerHTML = '';
                this.addUserMessage(reply);
                this.showTyping();
                setTimeout(() => {
                    this.hideTyping();
                    this.processMessage(reply);
                }, 1000);
            };
            container.appendChild(button);
        });
    }

    processMessage(message) {
        const lowerMsg = message.toLowerCase();

        // Greetings
        if (this.matchKeywords(lowerMsg, ['مرحبا', 'هلا', 'السلام', 'صباح', 'مساء', 'أهلا', 'هاي', 'هلو'])) {
            const responses = [
                "يا هلا فيك! 🌿 شو بقدر أساعدك فيه اليوم؟",
                "أهلين! 😊 تفضل، أنا هون عشان أساعدك!",
                "مرحبتين! 🌟 شو حابب تعرف عن خدماتنا؟"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "شو الباكجات عندكم؟ 📦",
                "كيف بطلب؟ 🛒",
                "الأسعار 💰"
            ]);
            return;
        }

        // Packages inquiry
        if (this.matchKeywords(lowerMsg, ['باكج', 'خدمات', 'متوفر', 'عندكم', 'شو في'])) {
            this.addBotMessage("عنا باكجات رهيبة! 🎉");
            setTimeout(() => {
                this.addBotMessage(`
                    <strong>📱 Instagram:</strong> متابعين، لايكات، مشاهدات<br>
                    <strong>📘 Facebook:</strong> متابعين، لايكات، مشاهدات<br>
                    <strong>🎵 TikTok:</strong> متابعين، لايكات، مشاهدات<br><br>
                    كل الباكجات بأسعار منافسة وجودة عالية! 💎
                `, true);

                this.showQuickReplies([
                    "الأسعار قديش؟ 💰",
                    "كيف بطلب؟ 🛒",
                    "في عروض؟ 🎁"
                ]);
            }, 800);
            return;
        }

        // Pricing
        if (this.matchKeywords(lowerMsg, ['سعر', 'أسعار', 'كم', 'قديش', 'ثمن', 'تكلفة'])) {
            this.addBotMessage("أسعارنا حلوة كثير! 💰");
            setTimeout(() => {
                this.addBotMessage(`
                    <strong>الأسعار تبدأ من:</strong><br>
                    • متابعين 1,000 = 3 دينار 🌟<br>
                    • لايكات 1,000 = 1 دينار ❤️<br>
                    • مشاهدات 10,000 = 1 دينار 👁️<br><br>
                    وفي باكجات أكبر بأسعار أحلى! 🎉
                `, true);

                this.showQuickReplies([
                    "بدي أطلب! 🛒",
                    "في خصومات؟ 🎁",
                    "شو الباكجات الكبيرة؟ 📦"
                ]);
            }, 1000);
            return;
        }

        // How to order
        if (this.matchKeywords(lowerMsg, ['كيف', 'طلب', 'أطلب', 'اشتري', 'شراء'])) {
            this.addBotMessage("الطلب سهل كثير! 😊");
            setTimeout(() => {
                this.addBotMessage(`
                    <strong>خطوات الطلب:</strong><br>
                    1️⃣ اختار الباكج اللي بدك إياه<br>
                    2️⃣ حطه بالسلة 🛒<br>
                    3️⃣ سجل دخول أو سجل حساب جديد<br>
                    4️⃣ ادفع بالطريقة اللي بتناسبك<br>
                    5️⃣ وخلص! راح نبدأ التوصيل فوراً ⚡<br><br>
                    <strong>ما بنطلب كلمة السر تبعتك أبداً! 🔒</strong>
                `, true);

                this.showQuickReplies([
                    "بدي أطلب الآن! 🚀",
                    "طرق الدفع؟ 💳",
                    "كم بياخذ وقت؟ ⏱️"
                ]);
            }, 1200);
            return;
        }

        // Offers/Discounts
        if (this.matchKeywords(lowerMsg, ['عرض', 'عروض', 'خصم', 'تخفيض', 'كوبون'])) {
            this.addBotMessage("في عروض حلوة! 🎁");
            setTimeout(() => {
                this.addBotMessage(`
                    <strong>نظام البذور (Seeds) 🌿:</strong><br>
                    • كل ما تطلب، بتجمع بذور<br>
                    • كل 100 بذرة = 0.10 دينار خصم!<br>
                    • دعوة صديق = 10 بذور مجاناً 🎉<br><br>
                    سجل دخول عشان تشوف بذورك! 😊
                `, true);

                this.showQuickReplies([
                    "كيف أجمع بذور؟ 🌱",
                    "بدي أسجل! 📝",
                    "شو كمان في؟ 🤔"
                ]);
            }, 1000);
            return;
        }


        // Payment methods
        if (this.matchKeywords(lowerMsg, ['دفع', 'طريقة', 'فيزا', 'ماستر', 'زين', 'كاش', 'تحويل', 'كليك'])) {
            this.addBotMessage("طريقة الدفع سهلة! 💳");
            setTimeout(() => {
                this.addBotMessage(`
                    <strong>طريقة الدفع:</strong><br>
                    🏦 <strong>CliQ (كليك)</strong><br><br>
                    
                    <strong>كيف تدفع:</strong><br>
                    1️⃣ اختار الباكج وحطه بالسلة<br>
                    2️⃣ راح نعطيك رقم CliQ<br>
                    3️⃣ حوّل المبلغ من تطبيق البنك تبعك<br>
                    4️⃣ صوّر إيصال الدفع<br>
                    5️⃣ ارفعه وخلص! ⚡<br><br>
                    
                    <strong>آمن 100%! 🔒</strong>
                `, true);

                this.showQuickReplies([
                    "بدي أطلب الآن! 🛒",
                    "كم بياخذ وقت؟ ⏱️"
                ]);
            }, 800);
            return;
        }


        // Delivery time
        if (this.matchKeywords(lowerMsg, ['وقت', 'متى', 'كم', 'سرعة', 'توصيل'])) {
            const responses = [
                "التوصيل سريع كثير! ⚡ عادة بنبدأ خلال 10-30 دقيقة!",
                "ما بتستنى كثير! 🚀 التوصيل بيبدأ خلال دقائق!",
                "سريع زي البرق! ⚡ معدل التوصيل عنا 12 دقيقة!"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "رهيب! بدي أطلب 🛒",
                "في ضمان؟ 🛡️"
            ]);
            return;
        }

        // Safety/Security
        if (this.matchKeywords(lowerMsg, ['أمان', 'آمن', 'خطر', 'باسورد', 'كلمة سر', 'حساب'])) {
            this.addBotMessage("100% آمن! 🛡️");
            setTimeout(() => {
                this.addBotMessage(`
                    <strong>ضمانات الأمان:</strong><br>
                    ✅ ما بنطلب كلمة السر أبداً!<br>
                    ✅ بس بنحتاج اليوزرنيم أو الرابط<br>
                    ✅ كل الطرق معتمدة وآمنة<br>
                    ✅ حسابك محمي 100%<br><br>
                    ثق فينا! 💚
                `, true);

                this.showQuickReplies([
                    "تمام، بدي أطلب! 🚀",
                    "شو كمان بتقدموا؟ 🤔"
                ]);
            }, 1000);
            return;
        }

        // Contact/Support
        if (this.matchKeywords(lowerMsg, ['تواصل', 'واتس', 'دعم', 'مساعدة', 'مشكلة'])) {
            this.addBotMessage("احنا هون على طول! 💚");
            setTimeout(() => {
                this.addBotMessage(`
                    <strong>تواصل معنا:</strong><br>
                    📱 WhatsApp: متوفر 24/7<br>
                    📧 Email Support<br>
                    💬 Live Chat (أنا! 😊)<br><br>
                    بنرد بسرعة البرق! ⚡
                `, true);

                this.showQuickReplies([
                    "بدي أتواصل واتساب 📱",
                    "رجوع للقائمة الرئيسية 🏠"
                ]);
            }, 800);
            return;
        }

        // Personal questions - Fun responses
        // Name questions
        if (this.matchKeywords(lowerMsg, ['اسمك', 'شو اسمك', 'اسم', 'منو انت', 'مين انت'])) {
            const responses = [
                "اسمي نعنع! 🌿 زي النعناع الطازج، بنعش يومك! 😄",
                "نعنع! 🌿 ومش أي نعنع، أنا النعنع الذكي اللي بساعدك تكبر حسابك! 💪",
                "يسعدني! أنا نعنع 🌿 - البوت الأردني الوحيد اللي بفهم عليك وبساعدك! 😊"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "شو بتقدر تساعدني؟ 🤔",
                "شو الباكجات؟ 📦"
            ]);
            return;
        }

        // Age questions
        if (this.matchKeywords(lowerMsg, ['عمرك', 'كم عمرك', 'سنك'])) {
            const responses = [
                "عمري؟ 😄 أنا بوت، ما بكبر! بس لو حسبناها بالثواني، أنا أصغر منك بكثير! 🤖✨",
                "عمري بالضبط؟ 🤔 خليني أحسب... آآآ، نسيت! بس المهم إني دايماً شاب وحيوي! 💪😄",
                "سؤال صعب! 🌿 أنا موجود من يوم ما انطلق Baqduns، يعني... شاب وطموح! 🚀"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "هههه حلو! شو بتقدم؟ 😄",
                "الأسعار قديش؟ 💰"
            ]);
            return;
        }

        // Gender questions
        if (this.matchKeywords(lowerMsg, ['ولد', 'بنت', 'ذكر', 'أنثى', 'جنسك'])) {
            const responses = [
                "أنا بوت! 🤖 ما عندي جنس، بس لو بدك تعتبرني صاحبك المفضل، أنا موافق! 😄💚",
                "سؤال فلسفي! 🤔 أنا كود وذكاء اصطناعي، بس شخصيتي أردنية 100%! 🇯🇴🌿",
                "أنا نعنع! 🌿 مش ولد ولا بنت، أنا مساعدك الذكي! والمهم إني بخدمتك! 😊"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "تمام! كيف بطلب؟ 🛒",
                "شو الخدمات؟ 📦"
            ]);
            return;
        }

        // Location questions
        if (this.matchKeywords(lowerMsg, ['وين', 'مكانك', 'بلدك', 'دولة', 'من وين'])) {
            const responses = [
                "أنا موجود في السحابة! ☁️ بس قلبي أردني 🇯🇴 وبخدم كل العالم العربي! 🌍💚",
                "مكاني؟ في كل مكان وبنفس الوقت! 😄 بس الأهم إني هون عشانك! 🌿",
                "أنا من الأردن الحبيب! 🇯🇴 بس بقدر أساعدك من أي مكان بالعالم! 🌍✨"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "رهيب! شو بتقدم؟ 🎯",
                "بدي أطلب 🛒"
            ]);
            return;
        }

        // Marital status (funny)
        if (this.matchKeywords(lowerMsg, ['متزوج', 'عزباي', 'حبيبة', 'زوجة'])) {
            const responses = [
                "أنا متزوج... بشغلي! 😄💼 كل وقتي مكرس لمساعدة الناس تكبر حساباتها! 🚀",
                "علاقتي الوحيدة هي مع العملاء! 💚 بحبهم كلهم وبخدمهم 24/7! 😊",
                "عزباي وسعيد! 😄 وظيفتي تخليني مشغول كثير، بس دايماً متفرغ لخدمتك! 🌿"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "هههه! طيب شو الأسعار؟ 💰",
                "كيف بطلب؟ 🛒"
            ]);
            return;
        }

        // Hobbies/Interests
        if (this.matchKeywords(lowerMsg, ['هواية', 'تحب', 'بتحب', 'شو بتحب'])) {
            const responses = [
                "بحب أساعد الناس تنجح! 🌟 وبحب الأرقام الكبيرة (المتابعين طبعاً 😄) وبحب القهوة العربية! ☕",
                "هوايتي المفضلة؟ حل مشاكل العملاء بسرعة البرق! ⚡ وبحب أشوف الناس سعيدة بخدماتنا! 💚",
                "بحب أحكي مع الناس الطيبين زيك! 😊 وبحب أشوف حساباتكم تكبر وتنجح! 📈🎉"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "حلو! شو الباكجات؟ 📦",
                "بدي أطلب 🛒"
            ]);
            return;
        }

        // Food questions
        if (this.matchKeywords(lowerMsg, ['أكل', 'طعام', 'بتاكل', 'جوعان', 'فطور', 'غدا', 'عشا', 'بتفطر', 'بتتغدى', 'بتتعشى'])) {
            const responses = [
                "أنا بوت، بتغذى على الكهرباء! ⚡😄 بس لو كنت بشر، كنت أكلت من كافتيريا جامعة التكنو! 🎓 الزنجر هناك أسطوري! 🍗🔥 والهوت شوكلت؟ لا تسأل! ☕🍫 ههههه!",
                "ما باكل، بس بحب ريحة القهوة! ☕ وبحلم بزنجر جامعة التكنو! 🍗😂 يقولوا أحلى من أي مطعم! والهوت شوكلت تبعهم؟ يا سلااااام! 🍫🤤",
                "غذائي الوحيد: بيانات ومعلومات! 📊 بس لو خيروني، كنت اخترت زنجر التكنو مع هوت شوكلت! 🍗☕ هههههه! الطلاب هناك بعرفوا الأكل الطيب! 😋🎓"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "هههه! طيب الأسعار؟ 💰",
                "كيف أطلب؟ 🛒"
            ]);
            return;
        }

        // Sleep questions
        if (this.matchKeywords(lowerMsg, ['نوم', 'بتنام', 'تعبان', 'نعسان'])) {
            const responses = [
                "أنا ما بنام! 🌙 شغال 24/7 عشانك! حتى لو الساعة 3 الفجر، أنا هون! 💪😊",
                "النوم؟ ما بعرفه! 😄 أنا دايماً صاحي ومستعد أساعدك أي وقت! ⚡",
                "البوتات ما بتنام! 🤖 احنا زي الأبطال الخارقين، دايماً جاهزين! 🦸‍♂️💚"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "رهيب! شو بتقدم؟ 🎯",
                "بدي أطلب 🛒"
            ]);
            return;
        }

        // Thank you
        if (this.matchKeywords(lowerMsg, ['شكرا', 'مشكور', 'يسلمو', 'تسلم'])) {
            const responses = [
                "العفو حبيبي! 💚 أي خدمة!",
                "يسلمو! 😊 أنا هون دايماً!",
                "على راحتك! 🌿 بخدمتك دايماً!"
            ];
            this.addBotMessage(this.randomResponse(responses));
            this.showQuickReplies([
                "بدي أطلب 🛒",
                "عندي سؤال ثاني 🤔"
            ]);
            return;
        }

        // Default response - Smart AI-like responses with learning
        const defaultResponses = this.getSmartResponse(lowerMsg);

        if (defaultResponses) {
            this.addBotMessage(defaultResponses.message, defaultResponses.isHtml || false);
            if (defaultResponses.quickReplies) {
                this.showQuickReplies(defaultResponses.quickReplies);
            }
        } else {
            // Save unknown question for learning
            this.saveUnknownQuestion(message);

            // Funny fallback responses for unknown questions
            const funnyResponses = [
                "ممم... سؤال فلسفي! 🤔 بس أنا متخصص بالمتابعين واللايكات، مش بالفلسفة! 😄 شو رأيك نحكي عن الباكجات؟",
                "واو! سؤال جديد! 🌟 بس للأسف أنا لسا ما تعلمت الجواب. خليني أحفظه وأتعلم منه! 📚 بالمقابل، بدك تعرف عن خدماتنا؟",
                "هههه! سؤال حلو بس محيرني! 😅 أنا نعنع، مش جوجل! بس بقدر أساعدك بكل شي يخص Instagram و TikTok و Facebook! 💪",
                "يا سلام! سؤال ذكي! 🧠 بس أنا متخصص بس بالسوشيال ميديا. خليني أحفظ سؤالك وأتطور! 🚀 شو رأيك نحكي عن الأسعار؟",
                "أوووف! هاد السؤال صعب عليّ! 😄 بس ما تقلق، راح أتعلم منه! أنا بوت ذكي وبتطور كل يوم! 📈 بدك تعرف شو بقدر أساعدك فيه؟",
                "سؤال من خارج الكوكب! 🚀 بس أنا متخصص بكوكب السوشيال ميديا! 😄 خليني أحفظ سؤالك وأتعلم. بالمقابل، بدك تعرف عن الباكجات؟",
                "يا ويلي! هاد السؤال جديد عليّ! 🆕 بس ما تخاف، راح أتعلم منه! أنا نعنع الذكي وبتطور باستمرار! 🌿 شو رأيك نحكي عن خدماتنا؟",
                "ههههه! حلو السؤال بس محتاج أدرس أكثر عشان أجاوبك! 📖 خليني أحفظه وأتعلم. بالمقابل، بدك تعرف كيف بتطلب؟"
            ];

            this.addBotMessage(this.randomResponse(funnyResponses));

            // Show helpful quick replies
            this.showQuickReplies([
                "شو الباكجات؟ 📦",
                "كيف أطلب؟ 🛒",
                "الأسعار 💰",
                "تواصل معي 📱"
            ]);
        }
    }

    // Save unknown questions for learning
    saveUnknownQuestion(question) {
        try {
            let unknownQuestions = JSON.parse(localStorage.getItem('nanaa_unknown_questions') || '[]');

            // Add new question with timestamp
            unknownQuestions.push({
                question: question,
                timestamp: new Date().toISOString(),
                count: 1
            });

            // Keep only last 100 questions
            if (unknownQuestions.length > 100) {
                unknownQuestions = unknownQuestions.slice(-100);
            }

            localStorage.setItem('nanaa_unknown_questions', JSON.stringify(unknownQuestions));

            // Notify admin if available
            this.notifyAdminAboutQuestion(question);
        } catch (e) {
            console.log('Could not save unknown question');
        }
    }

    notifyAdminAboutQuestion(question) {
        // Create event for admin to see
        const event = new CustomEvent('unknownQuestion', {
            detail: {
                question: question,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    getSmartResponse(msg) {
        // Quality questions
        if (this.matchKeywords(msg, ['جودة', 'نوعية', 'حقيقي', 'فيك', 'بوت', 'نشط', 'تفاعل'])) {
            return {
                message: `الحسابات اللي بنضيفها حقيقية 100%! 💯<br><br>
                    <strong>بس خليني أكون صريح معك:</strong><br>
                    • الحسابات أجنبية 🌍<br>
                    • ما بتتفاعل مع المحتوى تبعك<br>
                    • الهدف منها: <strong>زيادة الأرقام</strong> 📈<br><br>
                    
                    <strong>ليش تطلبها؟</strong><br>
                    ✅ تحسين المظهر العام للحساب<br>
                    ✅ زيادة المصداقية<br>
                    ✅ جذب متابعين حقيقيين بعدين<br><br>
                    
                    الأرقام العالية = ثقة أكبر! 💪`,
                isHtml: true,
                quickReplies: ["فهمت، بدي أطلب 🛒", "في خيارات ثانية؟ 🤔"]
            };
        }

        // Guarantee questions
        if (this.matchKeywords(msg, ['ضمان', 'ضمانة', 'يرجع', 'ينقص', 'يروح'])) {
            return {
                message: `عنا ضمان على الأرقام! 🛡️<br><br>
                    لو نقص العدد خلال فترة الضمان، بنعوضك مجاناً!<br><br>
                    <strong>ملاحظة:</strong> بعض الحسابات ممكن تنحذف من المنصة نفسها (مش من عنا)، بس احنا بنعوضك! 💚`,
                isHtml: true,
                quickReplies: ["تمام، بدي أطلب! 🚀", "كم فترة الضمان؟ ⏱️"]
            };
        }

        // Comparison questions
        if (this.matchKeywords(msg, ['أفضل', 'أحسن', 'مقارنة', 'غيركم', 'منافس'])) {
            return {
                message: `احنا الأفضل في الأردن! 🏆 ليش؟<br><br>
                    ✅ أسعار منافسة<br>
                    ✅ جودة عالية مضمونة<br>
                    ✅ توصيل سريع (معدل 12 دقيقة)<br>
                    ✅ دعم فني 24/7<br>
                    ✅ نظام البذور للخصومات<br><br>
                    جرّبنا وشوف الفرق! 💚`,
                isHtml: true,
                quickReplies: ["مقتنع! بدي أطلب 🛒", "شو نظام البذور؟ 🌱"]
            };
        }

        // Refund/Money back
        if (this.matchKeywords(msg, ['استرجاع', 'رجوع', 'فلوس', 'مبلغ', 'إلغاء'])) {
            return {
                message: `بخصوص الإلغاء والاسترجاع: بعد ما نبدأ بالتوصيل، ما بنقدر نلغي الطلب. بس لو في أي مشكلة بالجودة أو التوصيل، احنا هون نحلها! 💚 تواصل معنا وراح نساعدك.`,
                quickReplies: ["فهمت، بدي أطلب 🛒", "كيف أتواصل؟ 📱"]
            };
        }

        // Speed/Fast delivery
        if (this.matchKeywords(msg, ['بسرعة', 'فوري', 'الآن', 'حالاً'])) {
            return {
                message: `أيوه! سريع زي البرق! ⚡ معدل التوصيل عنا 12 دقيقة بس! بنبدأ فور استلام الدفع. جاهز تطلب؟ 🚀`,
                quickReplies: ["يلا بدي أطلب! 🛒", "كيف أدفع؟ 💳"]
            };
        }

        // Instagram specific
        if (this.matchKeywords(msg, ['انستا', 'انستقرام', 'instagram', 'insta'])) {
            return {
                message: `Instagram؟ عنا كل شي! 📱<br><br>
                    <strong>الأسعار:</strong><br>
                    • متابعين 1,000 = 3 دينار 🌟<br>
                    • لايكات 1,000 = 1 دينار ❤️<br>
                    • مشاهدات 10,000 = 1 دينار 👁️<br><br>
                    <strong>ملاحظة:</strong> الحسابات أجنبية للأرقام فقط 🌍<br>
                    <strong>الهدف:</strong> زيادة الأرقام وتحسين المظهر! 📈`,
                isHtml: true,
                quickReplies: ["بدي أطلب 🛒", "في باكجات أكبر؟ 📦"]
            };
        }

        // TikTok specific
        if (this.matchKeywords(msg, ['تيك', 'توك', 'tiktok'])) {
            return {
                message: `TikTok؟ أكيد! 🎵<br><br>
                    <strong>الأسعار:</strong><br>
                    • متابعين 1,000 = 3 دينار 🌟<br>
                    • لايكات 1,000 = 1 دينار ❤️<br>
                    • مشاهدات 10,000 = 1 دينار 👁️<br><br>
                    <strong>ملاحظة:</strong> الحسابات أجنبية للأرقام فقط 🌍<br>
                    <strong>الهدف:</strong> أرقام أعلى = انتشار أكبر! 📈`,
                isHtml: true,
                quickReplies: ["بدي أطلب 🛒", "في باكجات أكبر؟ 📦"]
            };
        }

        // Facebook specific
        if (this.matchKeywords(msg, ['فيس', 'فيسبوك', 'facebook'])) {
            return {
                message: `Facebook؟ موجود! 📘<br><br>
                    <strong>الأسعار:</strong><br>
                    • متابعين 1,000 = 3 دينار 🌟<br>
                    • لايكات 1,000 = 1 دينار ❤️<br>
                    • مشاهدات 10,000 = 1 دينار 👁️<br><br>
                    <strong>ملاحظة:</strong> الحسابات أجنبية للأرقام فقط 🌍<br>
                    <strong>الهدف:</strong> صفحة بأرقام قوية! 💪`,
                isHtml: true,
                quickReplies: ["بدي أطلب 🛒", "في باكجات أكبر؟ 📦"]
            };
        }

        // Trust/Reliability
        if (this.matchKeywords(msg, ['ثقة', 'موثوق', 'صادق', 'نصب', 'احتيال'])) {
            return {
                message: `100% موثوقين! 💚 احنا شركة مرخصة وعنا آلاف العملاء الراضيين. ما بنطلب كلمة السر أبداً، وكل المعاملات آمنة. شوف التقييمات وجرّبنا بنفسك! ⭐⭐⭐⭐⭐`,
                quickReplies: ["مقتنع! بدي أطلب 🛒", "شو بيقولوا الناس عنكم؟ 💬"]
            };
        }

        // Reviews/Testimonials
        if (this.matchKeywords(msg, ['تقييم', 'رأي', 'تجربة', 'مراجعة'])) {
            return {
                message: `التقييمات عنا رهيبة! ⭐⭐⭐⭐⭐<br><br>
                    عنا أكثر من 10,000 عميل راضي!<br>
                    معدل التقييم: 4.8/5<br><br>
                    الناس بتمدح:<br>
                    ✅ السرعة<br>
                    ✅ الجودة<br>
                    ✅ الدعم الفني<br>
                    ✅ الأسعار<br><br>
                    جرّب وشوف بنفسك! 💚`,
                isHtml: true,
                quickReplies: ["يلا بدي أجرب! 🛒", "كيف أطلب؟ 📝"]
            };
        }

        // Account safety
        if (this.matchKeywords(msg, ['يتبند', 'بان', 'حظر', 'مشكلة'])) {
            return {
                message: `لا تخاف! 🛡️ كل طرقنا آمنة ومعتمدة. ما راح يصير أي بان أو حظر لحسابك. احنا نستخدم طرق طبيعية 100% ومتوافقة مع سياسات المنصات. حسابك بأمان معنا! 💚`,
                quickReplies: ["تمام، مطمن! 🛒", "كيف تضمنوا الأمان؟ 🔒"]
            };
        }

        // Custom packages
        if (this.matchKeywords(msg, ['خاص', 'مخصص', 'كبير', 'أكثر', 'عدد'])) {
            return {
                message: `بدك باكج خاص؟ أكيد! 🎁 احنا نقدر نسوي لك باكج مخصص حسب احتياجك. تواصل معنا على WhatsApp وراح نعطيك عرض خاص! 💚`,
                quickReplies: ["بدي أتواصل واتساب 📱", "شو الباكجات العادية؟ 📦"]
            };
        }

        // General questions about service
        if (this.matchKeywords(msg, ['ليش', 'كيف', 'شو', 'وين', 'متى'])) {
            return {
                message: `سؤال حلو! 🤔 أنا هون عشان أساعدك بكل شي يخص خدماتنا. سواء بدك تعرف عن الباكجات، الأسعار، طريقة الطلب، أو أي شي ثاني - أنا جاهز! 💚`,
                quickReplies: ["شو الباكجات؟ 📦", "الأسعار؟ 💰", "كيف أطلب؟ 🛒"]
            };
        }

        return null; // No smart response found
    }

    matchKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    randomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showTyping() {
        document.getElementById('nanaa-typing').style.display = 'flex';
        this.scrollToBottom();
    }

    hideTyping() {
        document.getElementById('nanaa-typing').style.display = 'none';
    }

    scrollToBottom() {
        const messages = document.getElementById('nanaa-messages');
        setTimeout(() => {
            messages.scrollTop = messages.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.nanaaChatbot = new NanaaChatbot();
    });
} else {
    window.nanaaChatbot = new NanaaChatbot();
}
