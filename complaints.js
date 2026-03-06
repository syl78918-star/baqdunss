// 📢 Complaints System - Send to Admin
class ComplaintsSystem {
    constructor() {
        this.init();
    }

    init() {
        this.createComplaintsWidget();
        this.attachEventListeners();
    }

    createComplaintsWidget() {
        const html = `
            <!-- Complaints FAB -->
            <div class="complaints-fab">
                <button class="complaints-button" id="complaints-btn" title="تقديم شكوى">
                    📢
                </button>
            </div>

            <!-- Complaints Modal -->
            <div class="complaints-modal" id="complaints-modal">
                <div class="complaints-content">
                    <div class="complaints-header">
                        <h2>📢 تقديم شكوى</h2>
                        <button class="complaints-close" id="close-complaints">✕</button>
                    </div>

                    <div class="complaints-body">
                        <!-- Info Box -->
                        <div class="complaints-info">
                            💡 <strong>ملاحظة:</strong> شكواك راح توصل مباشرة للإدارة. راح نرد عليك في أقرب وقت!
                        </div>

                        <!-- Complaint Form -->
                        <form class="complaint-form" id="complaint-form">
                            <div class="form-group">
                                <label for="complaint-name">الاسم الكامل *</label>
                                <input 
                                    type="text" 
                                    id="complaint-name" 
                                    placeholder="أدخل اسمك الكامل"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label for="complaint-email">البريد الإلكتروني *</label>
                                <input 
                                    type="email" 
                                    id="complaint-email" 
                                    placeholder="example@email.com"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label for="complaint-order">رقم الطلب (اختياري)</label>
                                <input 
                                    type="text" 
                                    id="complaint-order" 
                                    placeholder="مثال: ORD-12345"
                                >
                            </div>

                            <div class="form-group">
                                <label for="complaint-type">نوع الشكوى *</label>
                                <select id="complaint-type" required>
                                    <option value="">-- اختر نوع الشكوى --</option>
                                    <option value="delivery">تأخير في التوصيل</option>
                                    <option value="quality">مشكلة في الجودة</option>
                                    <option value="payment">مشكلة في الدفع</option>
                                    <option value="support">مشكلة في الدعم الفني</option>
                                    <option value="account">مشكلة في الحساب</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="complaint-message">تفاصيل الشكوى *</label>
                                <textarea 
                                    id="complaint-message" 
                                    placeholder="اشرح المشكلة بالتفصيل..."
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" class="submit-complaint">
                                <span>إرسال الشكوى</span>
                                <span>📤</span>
                            </button>
                        </form>

                        <!-- Success Message (Hidden) -->
                        <div class="complaint-success" id="complaint-success">
                            <div class="success-icon">✅</div>
                            <h3>تم إرسال شكواك بنجاح!</h3>
                            <p>راح نتواصل معك في أقرب وقت على البريد الإلكتروني المسجل.</p>
                            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                                <a href="my-complaints.html" class="submit-complaint" style="text-decoration: none;">
                                    <span>شاهد شكاويي</span>
                                    <span>📋</span>
                                </a>
                                <button class="submit-complaint" onclick="closeComplaintsModal()" style="background: white; color: #e74c3c; border: 2px solid #e74c3c;">
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    attachEventListeners() {
        const btn = document.getElementById('complaints-btn');
        const modal = document.getElementById('complaints-modal');
        const closeBtn = document.getElementById('close-complaints');
        const form = document.getElementById('complaint-form');

        btn.addEventListener('click', () => this.openModal());
        closeBtn.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        form.addEventListener('submit', (e) => this.submitComplaint(e));
    }

    openModal() {
        document.getElementById('complaints-modal').classList.add('active');
        // Reset form if previously submitted
        document.getElementById('complaint-form').style.display = 'flex';
        document.getElementById('complaint-success').classList.remove('active');

        // Auto-fill user data
        const currentUser = JSON.parse(localStorage.getItem('baqdouns_current_user') || 'null');
        if (currentUser) {
            const nameInput = document.getElementById('complaint-name');
            const emailInput = document.getElementById('complaint-email');

            if (nameInput && !nameInput.value) nameInput.value = currentUser.name || '';
            if (emailInput) {
                emailInput.value = currentUser.email || '';
                emailInput.readOnly = true; // Prevent changing email to ensure match
                emailInput.style.backgroundColor = '#f0f0f0';
            }
        }
    }

    closeModal() {
        document.getElementById('complaints-modal').classList.remove('active');
        document.getElementById('complaint-form').reset();
    }

    async submitComplaint(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('.submit-complaint');
        const originalText = submitBtn.innerHTML;

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>جاري الإرسال...</span> ⏳';

        // Get form data
        const formData = {
            name: document.getElementById('complaint-name').value,
            email: document.getElementById('complaint-email').value,
            orderId: document.getElementById('complaint-order').value || 'لا يوجد',
            type: document.getElementById('complaint-type').value,
            typeText: document.getElementById('complaint-type').selectedOptions[0].text,
            message: document.getElementById('complaint-message').value,
            timestamp: new Date().toLocaleString('ar-JO', {
                dateStyle: 'full',
                timeStyle: 'short'
            }),
            userAgent: navigator.userAgent
        };

        // Save to localStorage for admin
        this.saveComplaintToAdmin(formData);

        // Simulate sending (in real scenario, send to backend/email service)
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;

            // Show success message
            document.getElementById('complaint-form').style.display = 'none';
            document.getElementById('complaint-success').classList.add('active');

            // Send notification to admin (if logged in)
            this.notifyAdmin(formData);
        }, 1500);
    }

    saveComplaintToAdmin(complaint) {
        // Get existing complaints
        let complaints = JSON.parse(localStorage.getItem('baqdouns_complaints') || '[]');

        // Add new complaint with ID
        const newComplaint = {
            id: 'COMP-' + Date.now(),
            ...complaint,
            status: 'جديدة',
            createdAt: new Date().toISOString()
        };

        complaints.unshift(newComplaint);

        // Save back to localStorage
        localStorage.setItem('baqdouns_complaints', JSON.stringify(complaints));

        // Update complaint count
        // Update complaint count
        const count = complaints.filter(c => c.status === 'جديدة').length;
        localStorage.setItem('baqdouns_complaints_count', count);

        // Notify Telegram + All Devices
        if (window.BaqdNotify) {
            // Push to all open devices (RTDB + System notification + Telegram)
            BaqdNotify.newComplaint(complaint).catch(() => { });
        } else {
            // Fallback: Telegram only
            const tgMsg = `
📢 *NEW COMPLAINT RECEIVED*
-------------------------------
👤 *From:* ${complaint.name}
📧 *Email:* ${complaint.email}
📝 *Type:* ${complaint.typeText}
🆔 *Order:* ${complaint.orderId}
-------------------------------
_Check Admin Panel for details._
`;
            if (window.sendBaqdunsNotification) window.sendBaqdunsNotification(tgMsg);
        }

        // Also save to Firebase RTDB for cross-device admin panel
        if (window.firebase && firebase.database) {
            const complaint2 = { ...complaint, id: newComplaint.id, status: 'جديدة', createdAt: new Date().toISOString() };
            firebase.database().ref('complaints/' + newComplaint.id).set(complaint2).catch(() => { });
        }

    }

    notifyAdmin(complaint) {
        // Create a notification badge for admin
        const event = new CustomEvent('newComplaint', {
            detail: complaint
        });
        window.dispatchEvent(event);
    }
}

// Global function to close modal (for success button)
function closeComplaintsModal() {
    document.getElementById('complaints-modal').classList.remove('active');
    document.getElementById('complaint-form').reset();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.complaintsSystem = new ComplaintsSystem();
    });
} else {
    window.complaintsSystem = new ComplaintsSystem();
}
