-- ======================================================
-- 🌿 SUPABASE SETUP SCRIPT - موقع بقدونس
-- انسخ هذا الكود والصقه في SQL Editor داخل Supabase
-- ======================================================

-- 1. جدول المستخدمين (Users)
CREATE TABLE IF NOT EXISTS public.users (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT,
    points INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    last_active BIGINT,
    joined TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_fp TEXT,
    uid TEXT -- للمطابقة مع الأنظمة الأخرى
);

-- 2. جدول الطلبات (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
    customer_name TEXT,
    items JSONB, -- حفظ تفاصيل السلة كجسم مرن
    total DECIMAL(10,2),
    status TEXT DEFAULT 'Pending',
    timestamp BIGINT,
    date_str TEXT,
    screenshot_url TEXT -- رابط الصورة في التخزين
);

-- 3. سجلات دخول الإدارة (Login Logs)
CREATE TABLE IF NOT EXISTS public.login_logs (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    method TEXT,
    device_fp TEXT,
    device_type TEXT,
    timestamp BIGINT,
    date_str TEXT,
    is_multi BOOLEAN DEFAULT FALSE
);

-- تفعيل ميزة التحديث اللحظي (Real-time) للجداول
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE login_logs;

-- إعطاء صلاحيات الوصول (مؤقتاً للتبسيط)
-- ملاحظة: للأمان العالي يفضل لاحقاً تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Access" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Access" ON orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write Access" ON login_logs FOR ALL USING (true) WITH CHECK (true);
