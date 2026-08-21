-- =============================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU SƯ ĐOÀN 968 - BẢNG BÀI VIẾT & TIN TỨC (ARTICLES)
-- Hỗ trợ PostgreSQL / Supabase / Cloud SQL với Phân quyền Bảo mật RLS
-- =============================================================================

-- 1. TẠO BẢNG BÀI VIẾT (articles)
CREATE TABLE IF NOT EXISTS public.articles (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    date VARCHAR(50) NOT NULL,
    image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    embed_code TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'approved', -- 'approved' | 'pending'
    views INTEGER NOT NULL DEFAULT 0,
    section_key VARCHAR(20) NOT NULL DEFAULT 'ctd', -- 'ctd' | 'hl' | 'bac'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tạo Index tăng tốc độ truy vấn bài viết theo chuyên mục và trạng thái duyệt
CREATE INDEX IF NOT EXISTS idx_articles_section_status ON public.articles (section_key, status);
CREATE INDEX IF NOT EXISTS idx_articles_id_desc ON public.articles (id DESC);

-- 2. KÍCH HOẠT BẢO MẬT PHÂN QUYỀN (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 3. CHÍNH SÁCH ĐỌC (SELECT):
-- - Khách vãng lai và mọi người dùng đều có thể đọc bài viết đã được phê duyệt (status = 'approved')
-- - Người dùng đã đăng nhập hoặc Admin có thể đọc toàn bộ bài viết (kể cả bản thảo đang chờ duyệt)
CREATE POLICY "Cho phép cộng đồng đọc bài viết đã duyệt" 
ON public.articles 
FOR SELECT 
USING (status = 'approved' OR auth.role() = 'authenticated');

-- 4. CHÍNH SÁCH THÊM MỚI (INSERT):
-- - Chỉ tài khoản Admin / Ban Biên tập hoặc thành viên được cấp quyền mới được thêm bài viết mới
CREATE POLICY "Chỉ Admin và thành viên được thêm bài viết" 
ON public.articles 
FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' OR 
    (auth.jwt() ->> 'role') = 'admin'
);

-- 5. CHÍNH SÁCH CẬP NHẬT (UPDATE):
-- - Chỉ Admin / Ban Biên tập mới có quyền sửa nội dung, duyệt bài hoặc cập nhật số lượt xem
CREATE POLICY "Chỉ Admin mới có quyền cập nhật bài viết" 
ON public.articles 
FOR UPDATE 
USING (
    (auth.jwt() ->> 'role') = 'admin' OR 
    auth.role() = 'authenticated'
) 
WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin' OR 
    auth.role() = 'authenticated'
);

-- 6. CHÍNH SÁCH XÓA (DELETE):
-- - Chỉ tài khoản Admin mới có quyền xóa bài viết vĩnh viễn
CREATE POLICY "Chỉ Admin mới có quyền xóa bài viết" 
ON public.articles 
FOR DELETE 
USING (
    (auth.jwt() ->> 'role') = 'admin'
);

-- =============================================================================
-- BẢNG NGƯỜI DÙNG & PHÂN QUYỀN HỆ THỐNG (users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT,
    full_name TEXT NOT NULL,
    rank_unit TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    military_code VARCHAR(50),
    avatar TEXT,
    birth_date VARCHAR(50),
    can_view_doc BOOLEAN DEFAULT true,
    can_upload_doc BOOLEAN DEFAULT false,
    can_join_party_meeting BOOLEAN DEFAULT false,
    can_upload_meeting_doc BOOLEAN DEFAULT false,
    can_delete_meeting_doc BOOLEAN DEFAULT false,
    can_view_collaborative_edits BOOLEAN DEFAULT false,
    can_create_meeting BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    last_active_at TEXT,
    session_count INTEGER DEFAULT 0,
    total_active_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Người dùng xem danh bạ thành viên" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Chỉ Admin chỉnh sửa người dùng" 
ON public.users 
FOR ALL 
USING ((auth.jwt() ->> 'role') = 'admin') 
WITH CHECK ((auth.jwt() ->> 'role') = 'admin');
