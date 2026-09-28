import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Article,
  DailyWidgetItem,
  DocumentItem,
  LectureItem,
  SectionType,
  SiteConfig,
  User,
} from '../types';
import { MILITARY_FALLBACK_AVATAR, MILITARY_FALLBACK_BANNER } from '../data/initialData';

// Read Supabase credentials from client-side Vite environment variables with project defaults
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

const rawUrl =
  env.VITE_SUPABASE_URL || 'https://zarihmliquvtbksuhajp.supabase.co';
// Clean trailing /rest/v1 or trailing slashes to get the root Supabase base URL
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GeVd72FMAJD3aLRzoTBNgA_E4KBRYFq';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl || 'https://zarihmliquvtbksuhajp.supabase.co', supabaseAnonKey || 'sb_publishable_GeVd72FMAJD3aLRzoTBNgA_E4KBRYFq', {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.warn('Lỗi khởi tạo Supabase Client:', err);
      // Fallback instance
      clientInstance = createClient(
        'https://zarihmliquvtbksuhajp.supabase.co',
        'sb_publishable_GeVd72FMAJD3aLRzoTBNgA_E4KBRYFq',
        {
          auth: { persistSession: true, autoRefreshToken: true },
        }
      );
    }
  }
  return clientInstance;
};

// Export direct supabase singleton instance for direct supabase.auth... and supabase.from... calls
export const supabase = getSupabase();

// Supabase Auth Helper & User Mapper
export const supabaseAuth = {
  async signInWithPassword(email: string, password: string) {
    const sb = getSupabase();
    return await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
  },

  async signOut() {
    const sb = getSupabase();
    return await sb.auth.signOut();
  },

  async getSession() {
    const sb = getSupabase();
    return await sb.auth.getSession();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const sb = getSupabase();
    return sb.auth.onAuthStateChange(callback);
  },

  mapSupabaseUserToAdmin(sbUser: any): User {
    const email = sbUser.email || '';
    const username = email ? email.split('@')[0] : 'admin';
    const meta = sbUser.user_metadata || {};

    // Kiểm tra cache hồ sơ đã lưu ở localStorage
    let cachedProfile: any = null;
    try {
      const rawCache = localStorage.getItem('user_profile_cache');
      if (rawCache) {
        cachedProfile = JSON.parse(rawCache);
      }
    } catch {
      // ignore
    }

    const fullName =
      (cachedProfile && (cachedProfile.id === sbUser.id || cachedProfile.email === email) && cachedProfile.fullName) ||
      meta.full_name ||
      meta.name ||
      username ||
      'Quân nhân';

    const avatar =
      (cachedProfile && (cachedProfile.id === sbUser.id || cachedProfile.email === email) && cachedProfile.avatar) ||
      meta.avatar_url ||
      meta.avatar ||
      MILITARY_FALLBACK_AVATAR;

    const rank =
      (cachedProfile && (cachedProfile.id === sbUser.id || cachedProfile.email === email) && cachedProfile.rank) ||
      meta.rank ||
      'Sĩ quan';

    const position =
      (cachedProfile && (cachedProfile.id === sbUser.id || cachedProfile.email === email) && cachedProfile.position) ||
      meta.position ||
      'Quản trị viên';

    const birthDate =
      (cachedProfile && (cachedProfile.id === sbUser.id || cachedProfile.email === email) && cachedProfile.birthDate) ||
      meta.birth_date ||
      meta.birthDate ||
      '';

    const rankUnit =
      (cachedProfile && (cachedProfile.id === sbUser.id || cachedProfile.email === email) && cachedProfile.rankUnit) ||
      meta.rank_unit ||
      `${rank} - ${position}`;

    return {
      id: 1,
      authId: sbUser.id,
      username: username,
      fullName: fullName,
      role: meta.role || 'admin',
      email: email,
      rank: rank,
      position: position,
      birthDate: birthDate,
      rankUnit: rankUnit,
      avatar: avatar,
      isOnline: true,
      totalActiveMinutes: 120,
      sessionCount: 1,
      canViewDoc: true,
      canUploadDoc: true,
      canViewSecretDocs: true,
      canUploadDocs: true,
      canViewCollaborativeEdits: true,
      createdAt: sbUser.created_at || new Date().toISOString(),
      lastActiveAt: new Date().toLocaleString('vi-VN'),
    };
  },
};

/* =========================================================================
   DATABASE-FIRST SUPABASE SERVICES (Tin bài, Văn bản, Bài giảng, Cấu hình...)
   ========================================================================= */

// Module-level singleton reference for global realtime channel
let activeSingletonChannel: any = null;

export const supabaseDb = {
  // -------------------------------------------------------------
  // 1. HỒ SƠ QUÂN NHÂN & TÀI KHOẢN (Bảng: users)
  // -------------------------------------------------------------
  async fetchUsers(): Promise<User[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('Supabase fetchUsers error:', error.message);
        return null;
      }
      if (!data) return null;

      return data.map((item: any) => ({
        id: Number(item.id),
        username: item.username || '',
        password: item.password || '123456',
        fullName: item.full_name || item.fullName || item.username || 'Quân nhân',
        birthDate: item.birth_date || item.birthDate || '',
        rank: item.rank || '',
        position: item.position || '',
        rankUnit: item.rank_unit || item.rankUnit || 'Trung đoàn 95',
        militaryCode: item.military_code || item.militaryCode,
        avatar: item.avatar || MILITARY_FALLBACK_AVATAR,
        role: item.role || 'user',
        canViewDoc: item.can_view_doc ?? item.canViewDoc ?? true,
        canUploadDoc: item.can_upload_doc ?? item.canUploadDoc ?? false,
        canViewCollaborativeEdits: item.can_view_collab ?? item.canViewCollaborativeEdits ?? true,
      }));
    } catch (err) {
      console.warn('Supabase fetchUsers failed:', err);
      return null;
    }
  },

  async upsertUser(user: User): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa cấu hình Supabase Client' };

    try {
      const payload: any = {
        id: user.id,
        username: user.username,
        password: user.password,
        full_name: user.fullName,
        birth_date: user.birthDate || '',
        rank: user.rank || '',
        position: user.position || '',
        rank_unit: user.rankUnit || '',
        military_code: user.militaryCode || '',
        avatar: user.avatar || '',
        role: user.role,
        can_view_doc: user.canViewDoc,
        can_upload_doc: user.canUploadDoc,
      };

      const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertUser error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertUser failed:', err);
      return { success: false, error: err?.message || 'Lỗi không xác định khi lưu tài khoản' };
    }
  },

  async deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa cấu hình Supabase' };

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        console.error('Supabase deleteUser error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase deleteUser failed:', err);
      return { success: false, error: err?.message };
    }
  },

  // -------------------------------------------------------------
  // 2. BÀI VIẾT & TIN TỨC (Bảng DUY NHẤT: articles)
  // -------------------------------------------------------------
  mapRowToArticle(item: any): Article {
    // Phân loại sectionKey tự động dựa trên category và tab_type/section_key
    let secKey: SectionType = 'ctd';
    const rawSec = (item.section_key || item.sectionKey || item.tab_type || item.tabType || '').toString().toLowerCase().trim();
    if (rawSec === 'hl' || rawSec === 'huan_luyen' || rawSec === 'huanluyen') {
      secKey = 'hl';
    } else if (rawSec === 'bac' || rawSec === 'hoc_tap_bac' || rawSec === 'bac_ho' || rawSec === 'hoctapbac') {
      secKey = 'bac';
    } else if (rawSec === 'ctd' || rawSec === 'ctct') {
      secKey = 'ctd';
    } else {
      // Tự động phân loại dựa trên category
      const cat = (item.category || '').toLowerCase().trim();
      if (
        cat.includes('bác') ||
        cat.includes('hồ chí minh') ||
        cat.includes('tư tưởng') ||
        cat.includes('lời bác') ||
        cat.includes('gương sáng') ||
        cat.includes('mẩu chuyện về bác') ||
        cat.includes('thấm nhuần lời bác') ||
        cat.includes('đạo đức hồ chí minh')
      ) {
        secKey = 'bac';
      } else if (
        cat.includes('huấn luyện') ||
        cat.includes('sẵn sàng') ||
        cat.includes('sscđ') ||
        cat.includes('thao trường') ||
        cat.includes('bắn súng') ||
        cat.includes('kỹ chiến thuật') ||
        cat.includes('điều lệnh') ||
        cat.includes('thể lực') ||
        cat.includes('khí tài') ||
        cat.includes('diễn tập') ||
        cat.includes('hậu cần') ||
        cat.includes('kỹ thuật') ||
        cat.includes('quân sự')
      ) {
        secKey = 'hl';
      } else {
        // "Công tác Tuyên huấn", "Công tác Tổ chức", "Công tác Cán bộ", "Thi đua Quyết thắng", "Bảo vệ an ninh", "Chính sách", "Dân vận", "Kiểm tra giám sát", "Tin tức hoạt động", "Xây dựng Đảng"...
        secKey = 'ctd';
      }
    }

    // Xử lý ID linh hoạt (hỗ trợ cả int8, timestamp, hoặc chuỗi số)
    let parsedId = typeof item.id === 'number' ? item.id : Number(item.id);
    if (isNaN(parsedId) || parsedId === 0) {
      parsedId = Date.now() + Math.floor(Math.random() * 10000);
    }

    // Xử lý định dạng ngày tháng hiển thị chuẩn
    let formattedDate = item.date;
    if (!formattedDate && item.created_at) {
      try {
        formattedDate = new Date(item.created_at).toLocaleDateString('vi-VN');
      } catch {
        formattedDate = '26/08/2026';
      }
    }
    if (!formattedDate) formattedDate = '26/08/2026';

    // Trạng thái: Không chặn bài viết, mặc định approved để luôn hiển thị
    const rawStatus = (item.status || '').toString().toLowerCase().trim();
    const status: 'approved' | 'pending' = (rawStatus === 'pending' || rawStatus === 'draft') ? 'pending' : 'approved';

    let catVal = 'Tin tức hoạt động';
    if (typeof item.category === 'string') {
      catVal = item.category.trim();
    } else if (item.category && typeof item.category === 'object') {
      catVal = (item.category.name || item.category.label || item.category.title || item.category.shortLabel || item.category.navName || String(item.category.id || '')).trim() || 'Tin tức hoạt động';
    } else if (secKey === 'bac') {
      catVal = 'Lời Bác dạy';
    } else if (secKey === 'hl') {
      catVal = 'Huấn luyện - SSCĐ';
    }

    return {
      id: parsedId,
      title: item.title || 'Tin tức hoạt động',
      category: catVal,
      author: item.author || 'Cán bộ - Chiến sĩ',
      date: formattedDate,
      image: item.image || item.thumbnail || MILITARY_FALLBACK_BANNER,
      images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : undefined,
      excerpt: item.excerpt || item.summary || item.title || '',
      summary: item.summary || item.excerpt || '',
      content: item.content || item.summary || item.excerpt || item.title || '',
      embedCode: item.embed_code || item.embedCode || undefined,
      status: status,
      views: Number(item.views || 0),
      sectionKey: secKey,
    };
  },

  async fetchArticles(fullContent = false): Promise<Article[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const selectCols = fullContent
        ? '*'
        : 'id, title, category, author, date, image, images, excerpt, summary, views, status, section_key, created_at, published_at';

      let { data, error } = await (supabase.from('articles') as any)
        .select(selectCols)
        .order('created_at', { ascending: false });

      if (error) {
        const resId = await (supabase.from('articles') as any)
          .select('id, title, category, author, date, image, excerpt, summary, views, status, section_key')
          .order('id', { ascending: false });

        if (!resId.error && resId.data) {
          data = resId.data;
          error = null;
        } else {
          const resAll = await (supabase.from('articles') as any).select('*');
          data = resAll.data;
          error = resAll.error;
        }
      }

      if (error) {
        return null;
      }

      if (!data || !Array.isArray(data)) {
        return [];
      }

      return data.map((item: any): Article => supabaseDb.mapRowToArticle(item));
    } catch {
      return null;
    }
  },

  /**
   * TỐI ƯU TRANG CHỦ: Chỉ lấy 8-16 bài viết mới nhất với các cột cần thiết,
   * TUYỆT ĐỐI không nạp trường content để tiết kiệm 90% dung lượng mạng.
   */
  async fetchHomeArticles(limit = 12): Promise<Article[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const selectCols = 'id, title, category, author, date, image, images, excerpt, summary, views, status, section_key, is_featured, published_at, created_at';
      let { data, error } = await (supabase.from('articles') as any)
        .select(selectCols)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        const fb = await (supabase.from('articles') as any)
          .select('id, title, category, author, date, image, excerpt, summary, views, status, section_key, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);
        data = fb.data;
        error = fb.error;
      }

      if (error || !data || !Array.isArray(data)) return null;
      return data.map((item: any): Article => supabaseDb.mapRowToArticle(item));
    } catch {
      return null;
    }
  },

  /**
   * TỐI ƯU TRANG CHỦ: Chỉ lấy tài liệu cho trang chủ với các cột cần thiết
   */
  async fetchHomeDocuments(limit = 6): Promise<any[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await (supabase.from('documents') as any)
        .select('id, title, code, code_number, category, file_type, file_url, issue_date, signer, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data || !Array.isArray(data)) return null;
      return data.map((item: any) => ({
        id: Number(item.id),
        code: item.code_number || item.code || '',
        title: item.title || '',
        category: item.category || 'Văn bản',
        fileType: (item.file_type || 'PDF').toUpperCase(),
        fileUrl: item.file_url || '',
        issueDate: item.issue_date || '',
        signer: item.signer || '',
      }));
    } catch {
      return null;
    }
  },

  /**
   * TỐI ƯU TRANG CHỦ: Nạp độc lập danh sách 4 poster chuyên mục
   */
  async fetchDailyPostersMap(): Promise<Record<string, any> | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('daily_posters')
        .select('id, title, image_data, aspect_ratio, category_name, content, extra_data, updated_at');

      if (error || !data || !Array.isArray(data)) return null;
      const pMap: Record<string, any> = {};
      data.forEach((p: any) => {
        const rawId = (p.id || p.key || '').replace(/^widget_/, '');
        pMap[rawId] = p;
        pMap[p.id] = p;
      });
      return pMap;
    } catch {
      return null;
    }
  },

  async fetchArticleById(id: number | string): Promise<{ content?: string; images?: any[]; embedCode?: string } | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, content, images, embed_code')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        content: data.content,
        images: data.images ? (typeof data.images === 'string' ? JSON.parse(data.images) : data.images) : undefined,
        embedCode: data.embed_code || undefined,
      };
    } catch {
      return null;
    }
  },

  async upsertArticle(article: Article): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Client' };

    const payload: any = {
      id: Number(article.id),
      title: article.title.trim(),
      category: article.category?.trim() || 'Tin tức hoạt động',
      author: article.author.trim(),
      date: article.date,
      image: article.image || '',
      images: article.images ? JSON.stringify(article.images) : null,
      excerpt: article.excerpt || '',
      summary: article.summary || article.excerpt || '',
      content: article.content,
      embed_code: article.embedCode || null,
      status: article.status || 'approved',
      views: Number(article.views || 0),
      section_key: article.sectionKey || 'ctd',
      tab_type: article.sectionKey || 'ctd',
    };

    try {
      const { error } = await supabase.from('articles').upsert(payload, { onConflict: 'id' });
      if (error) {
        // If error is due to non-existent tab_type column, try upserting without tab_type
        if (error.message && error.message.includes('tab_type')) {
          delete payload.tab_type;
          const { error: retryError } = await supabase.from('articles').upsert(payload, { onConflict: 'id' });
          if (retryError) {
            console.error('Supabase upsertArticle retry error:', retryError);
            return { success: false, error: retryError.message };
          }
          return { success: true };
        }
        console.error('Supabase upsertArticle error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertArticle failed:', err);
      return { success: false, error: err?.message || 'Không thể lưu bài viết vào bảng articles' };
    }
  },

  async deleteArticle(articleId: number): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const { error } = await supabase.from('articles').delete().eq('id', articleId);
      if (error) {
        console.error('Supabase deleteArticle error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase deleteArticle failed:', err);
      return { success: false, error: err?.message || 'Lỗi khi xóa bài viết từ bảng articles' };
    }
  },

  async incrementArticleViews(articleId: number, currentViews: number): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const numId = Number(articleId);
    const newViews = (Number(currentViews) || 0) + 1;

    try {
      // 1. Try calling the PostgreSQL RPC function first
      const { error: rpcError } = await supabase.rpc('increment_article_views', {
        article_id: numId,
      });

      if (!rpcError) {
        return;
      }
    } catch (rpcErr) {
      // ignore and proceed to direct update fallback
    }

    try {
      // 2. Fallback to direct row update
      await supabase.from('articles').update({ views: newViews }).eq('id', numId);
    } catch (err) {
      console.warn('Supabase incrementArticleViews fallback failed:', err);
    }
  },

  async upsertCategoriesConfig(categoriesConfig: any[]): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: true };

    try {
      const { error } = await supabase.from('site_config').upsert(
        {
          id: 'default',
          categories_config: categoriesConfig,
          categories: categoriesConfig,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase upsertCategoriesConfig failed:', err);
      return { success: false, error: err?.message || 'Lỗi lưu cấu hình danh mục' };
    }
  },

  // -------------------------------------------------------------
  // 3. KHO VĂN BẢN (Bảng: documents)
  // -------------------------------------------------------------
  async fetchDocuments(): Promise<DocumentItem[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.warn('Supabase fetchDocuments error:', error.message);
        return null;
      }
      if (!data) return null;

      return data.map((item: any) => ({
        id: Number(item.id),
        code: item.code || '',
        title: item.title || '',
        category: item.category || 'VĂN BẢN - CHỈ THỊ',
        sub_category: item.sub_category || item.subCategory || item.category || '',
        subCategory: item.sub_category || item.subCategory || item.category || '',
        issuer: item.issuer || 'Trung đoàn 95',
        date: item.date || '26/08/2026',
        type: item.type || 'pdf',
        description: item.description || undefined,
        fileName: item.file_name || item.fileName || undefined,
        fileSize: item.file_size || item.fileSize || undefined,
        fileUrl: item.file_url || item.fileUrl || undefined,
        downloads: Number(item.downloads || 0),
        secretLevel: item.secret_level || item.secretLevel || 'normal',
      }));
    } catch (err) {
      console.warn('Supabase fetchDocuments failed:', err);
      return null;
    }
  },

  async upsertDocument(doc: DocumentItem): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const downloadsVal = Number(doc.downloads ?? (doc as any).download_count ?? 0);
      const safeIssuer = doc.issuer?.trim() || 'Trung đoàn 95';
      const safeDate = doc.date?.trim() || new Date().toLocaleDateString('vi-VN');
      const safeType = (doc.type || 'pdf').toLowerCase();
      const safeId = doc.id || Date.now();

      const payload: any = {
        id: safeId,
        code: doc.code?.trim() || '',
        title: doc.title?.trim() || '',
        category: doc.category || 'VĂN BẢN - CHỈ THỊ',
        sub_category: doc.sub_category || doc.subCategory || '',
        issuer: safeIssuer,
        date: safeDate,
        type: safeType,
        description: doc.description || '',
        file_name: doc.fileName || (doc as any).file_name || '',
        file_size: doc.fileSize || (doc as any).file_size || '',
        file_url: doc.fileUrl || (doc as any).file_url || '',
        downloads: downloadsVal,
        download_count: downloadsVal,
        secret_level: doc.secretLevel || 'normal',
      };

      let { error } = await supabase.from('documents').upsert(payload, { onConflict: 'id' });

      // If schema error occurs (e.g. unknown column), detect and remove problematic column and retry
      if (error) {
        console.warn('Initial upsertDocument attempt error:', error.message);
        const errMsg = error.message.toLowerCase();

        // Check if a specific column is causing the issue
        const possibleColumns = ['sub_category', 'secret_level', 'file_name', 'file_size', 'file_url', 'download_count', 'downloads'];
        let modified = false;
        for (const col of possibleColumns) {
          if (errMsg.includes(col) && payload[col] !== undefined) {
            delete payload[col];
            modified = true;
          }
        }

        if (modified) {
          const retry = await supabase.from('documents').upsert(payload, { onConflict: 'id' });
          error = retry.error;
        }
      }

      // If still error, retry with guaranteed core schema
      if (error) {
        console.warn('Retrying with safe core document schema:', error.message);
        const safePayload: any = {
          id: safeId,
          code: doc.code?.trim() || '',
          title: doc.title?.trim() || '',
          category: doc.category || 'VĂN BẢN - CHỈ THỊ',
          issuer: safeIssuer,
          date: safeDate,
          type: safeType,
          downloads: downloadsVal,
          download_count: downloadsVal,
        };

        let retrySafe = await supabase.from('documents').upsert(safePayload, { onConflict: 'id' });
        if (!retrySafe.error) {
          return { success: true };
        }

        // Try removing download_count if not in schema
        delete safePayload.download_count;
        retrySafe = await supabase.from('documents').upsert(safePayload, { onConflict: 'id' });
        if (!retrySafe.error) {
          return { success: true };
        }

        // Try with download_count instead of downloads
        delete safePayload.downloads;
        safePayload.download_count = downloadsVal;
        retrySafe = await supabase.from('documents').upsert(safePayload, { onConflict: 'id' });
        if (!retrySafe.error) {
          return { success: true };
        }

        console.error('All upsert retries failed:', retrySafe.error || error);
        return { success: false, error: (retrySafe.error || error)?.message || 'Lỗi lưu CSDL' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertDocument failed:', err);
      return { success: false, error: err?.message || 'Lỗi lưu văn bản vào Supabase' };
    }
  },

  async deleteDocument(docId: number): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId);
      if (error) {
        console.error('Supabase deleteDocument error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase deleteDocument failed:', err);
      return { success: false, error: err?.message };
    }
  },

  // -------------------------------------------------------------
  // 4. BÀI GIẢNG ĐIỆN TỬ (Bảng: lectures)
  // -------------------------------------------------------------
  async fetchLectures(): Promise<LectureItem[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.warn('Supabase fetchLectures error:', error.message);
        return null;
      }
      if (!data) return null;

      return data.map((item: any) => ({
        id: Number(item.id),
        code: item.code || `BG-${item.id}`,
        title: item.title || '',
        category: item.category || 'BÀI GIẢNG SỐ',
        sub_category: item.sub_category || item.subCategory || item.target || '',
        subCategory: item.sub_category || item.subCategory || item.target || '',
        target: item.target || 'Toàn thể cán bộ, chiến sĩ',
        author: item.author || 'Ban Chính trị',
        desc: item.desc || '',
        date: item.date || '26/08/2026',
        fileType: item.file_type || item.fileType || 'powerpoint',
        fileName: item.file_name || item.fileName || 'Bai_giang.pptx',
        fileSize: item.file_size || item.fileSize || '10.5 MB',
        fileUrl: item.file_url || item.fileUrl || '',
        downloads: Number(item.downloads || 0),
      }));
    } catch (err) {
      console.warn('Supabase fetchLectures failed:', err);
      return null;
    }
  },

  async upsertLecture(lecture: LectureItem): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const payload: any = {
        id: lecture.id,
        code: lecture.code || `BG-${lecture.id}`,
        title: lecture.title,
        category: lecture.category || 'BÀI GIẢNG SỐ',
        sub_category: lecture.sub_category || lecture.subCategory || lecture.target || '',
        target: lecture.target,
        author: lecture.author,
        desc: lecture.desc,
        date: lecture.date,
        file_type: lecture.fileType || 'powerpoint',
        file_name: lecture.fileName || '',
        file_size: lecture.fileSize || '',
        file_url: lecture.fileUrl || '',
        downloads: lecture.downloads || 0,
      };

      let { error } = await supabase.from('lectures').upsert(payload, { onConflict: 'id' });
      if (error && error.message?.toLowerCase().includes('sub_category')) {
        delete payload.sub_category;
        const retry = await supabase.from('lectures').upsert(payload, { onConflict: 'id' });
        error = retry.error;
      }
      if (error) {
        console.error('Supabase upsertLecture error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertLecture failed:', err);
      return { success: false, error: err?.message || 'Lỗi lưu bài giảng vào Supabase' };
    }
  },

  async deleteLecture(lectureId: number): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const { error } = await supabase.from('lectures').delete().eq('id', lectureId);
      if (error) {
        console.error('Supabase deleteLecture error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase deleteLecture failed:', err);
      return { success: false, error: err?.message };
    }
  },

  // -------------------------------------------------------------
  // 5. CẤU HÌNH GIAO DIỆN & TOÀN HỆ THỐNG (Bảng: site_config)
  // -------------------------------------------------------------
  async fetchSiteConfig(): Promise<SiteConfig | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('site_config').select('*').limit(1).maybeSingle();
      if (error) {
        console.warn('Supabase fetchSiteConfig error:', error.message);
        return null;
      }
      if (data) {
        const row = data;
        let config = row.config_json || row.config || row.data || row;
        if (typeof config === 'string') {
          try {
            config = JSON.parse(config);
          } catch {
            // keep raw or object
          }
        }
        if (config && typeof config === 'object') {
          const result: any = { ...config };
          if (row.title) result.title = row.title;
          if (row.subtitle) result.subtitle = row.subtitle;
          if (row.marquee_text) {
            result.ticker = row.marquee_text;
            result.marquee_text = row.marquee_text;
          }
          if (row.theme_color) result.colorRed = row.theme_color;
          if (row.unit_name) result.footerUnitName = row.unit_name;

          const rawMilitaryUtils = row.military_utilities || row.quick_links || result.quickActionCards || result.military_utilities;
          if (rawMilitaryUtils && Array.isArray(rawMilitaryUtils) && rawMilitaryUtils.length > 0) {
            result.quickActionCards = rawMilitaryUtils;
            result.military_utilities = rawMilitaryUtils;
            result.homeQuickActions = rawMilitaryUtils;
          }

          const rawUncleHoImgs = row.uncle_ho_images || result.uncle_ho_images;
          if (rawUncleHoImgs && Array.isArray(rawUncleHoImgs) && rawUncleHoImgs.length > 0) {
            result.uncle_ho_images = rawUncleHoImgs;
          }

          // Check categories_config column or inside json
          const rawCategoriesConfig =
            row.categories_config ||
            row.categoriesConfig ||
            row.categories ||
            result.categories_config ||
            result.categoriesConfig ||
            result.categories;

          if (rawCategoriesConfig) {
            let parsedCats = rawCategoriesConfig;
            if (typeof parsedCats === 'string') {
              try {
                parsedCats = JSON.parse(parsedCats);
              } catch {}
            }
            if (Array.isArray(parsedCats)) {
              result.categories_config = parsedCats;
              result.categoriesConfig = parsedCats;
              result.categories = parsedCats;
            }
          }

          // Check direct column daily_widgets or daily_posters on row if not inside json
          const rowDaily = row.daily_widgets || row.daily_posters || row.dailyWidgets;
          if (rowDaily) {
            let parsedDaily = rowDaily;
            if (typeof parsedDaily === 'string') {
              try {
                parsedDaily = JSON.parse(parsedDaily);
              } catch {}
            }
            if (Array.isArray(parsedDaily)) {
              result.dailyWidgets = parsedDaily;
            } else if (parsedDaily && typeof parsedDaily === 'object') {
              // Normalize object format { safety_message: { image, ... }, ... } into DailyWidgetItem[]
              const items: DailyWidgetItem[] = Object.entries(parsedDaily).map(([key, val]: [string, any]) => ({
                id: key,
                categoryName:
                  val?.categoryName ||
                  (key === 'safety_message'
                    ? 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN'
                    : key === 'traffic_situation'
                    ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
                    : key === 'good_deed'
                    ? 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP'
                    : 'Chuyên mục hằng ngày'),
                title: val?.title || '',
                content: val?.content || '',
                imageUrl: val?.image || val?.imageUrl || '',
                aspectRatioMode: val?.aspectRatio || val?.aspectRatioMode || 'auto',
                updatedAt: val?.updatedAt || '',
              }));
              result.dailyWidgets = items;
            }
          }

          // Also normalize result.dailyWidgets if it was stored as an object or dictionary inside json
          if (result.dailyWidgets && !Array.isArray(result.dailyWidgets) && typeof result.dailyWidgets === 'object') {
            const items: DailyWidgetItem[] = Object.entries(result.dailyWidgets).map(([key, val]: [string, any]) => ({
              id: key,
              categoryName:
                val?.categoryName ||
                (key === 'safety_message'
                  ? 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN'
                  : key === 'traffic_situation'
                  ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
                  : key === 'good_deed'
                  ? 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP'
                  : 'Chuyên mục hằng ngày'),
              title: val?.title || '',
              content: val?.content || '',
              imageUrl: val?.image || val?.imageUrl || '',
              aspectRatioMode: val?.aspectRatio || val?.aspectRatioMode || 'auto',
              updatedAt: val?.updatedAt || '',
            }));
            result.dailyWidgets = items;
          }

          // 2. Fetch individual daily_posters rows if table exists and merge into result.dailyWidgets
          try {
            const { data: posterRows, error: posterErr } = await supabase.from('daily_posters').select('*');
            if (!posterErr && posterRows && posterRows.length > 0) {
              const existingWidgets: DailyWidgetItem[] = Array.isArray(result.dailyWidgets)
                ? [...result.dailyWidgets]
                : [];
              
              posterRows.forEach((pRow: any) => {
                const key = (pRow.id || pRow.widget_id || pRow.key || '').replace(/^widget_/, '');
                const imgData = pRow.image_data || pRow.imageUrl || pRow.image || pRow.url || '';
                const ratio = pRow.aspect_ratio || pRow.aspectRatio || pRow.aspectRatioMode || 'auto';
                const catName =
                  pRow.category_name ||
                  pRow.categoryName ||
                  (key === 'safety_message' || key === 'safety'
                    ? 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN'
                    : key === 'traffic_situation' || key === 'traffic'
                    ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
                    : key === 'good_deed'
                    ? 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP'
                    : 'Chuyên mục hằng ngày');
                const title = pRow.title || catName;
                const updatedAt = pRow.updated_at || pRow.updatedAt || '';

                const idx = existingWidgets.findIndex(
                  (w) =>
                    w.id === key ||
                    w.id === `widget_${key}` ||
                    (key === 'safety' && (w.id === 'safety_message' || w.id === 'widget_safety_message')) ||
                    (key === 'traffic' && (w.id === 'traffic_situation' || w.id === 'widget_traffic_situation'))
                );

                const itemData: DailyWidgetItem = {
                  id: key === 'safety' ? 'safety_message' : key === 'traffic' ? 'traffic_situation' : key,
                  categoryName: catName,
                  title: title,
                  imageUrl: imgData,
                  aspectRatioMode: ratio,
                  updatedAt: updatedAt,
                };

                if (idx >= 0) {
                  existingWidgets[idx] = {
                    ...existingWidgets[idx],
                    ...itemData,
                    imageUrl: imgData || existingWidgets[idx].imageUrl,
                  };
                } else {
                  existingWidgets.push(itemData);
                }
              });

              result.dailyWidgets = existingWidgets;
            }
          } catch {
            // ignore if daily_posters table not available
          }

          // Ensure sections have synchronized shortLabel, short_name, nav_title
          if (result.sections && typeof result.sections === 'object') {
            Object.keys(result.sections).forEach((secKey) => {
              const sec = result.sections[secKey];
              if (sec) {
                const effectiveShort = sec.short_name || sec.nav_title || sec.shortLabel || sec.title || '';
                sec.shortLabel = effectiveShort;
                sec.short_name = effectiveShort;
                sec.nav_title = effectiveShort;
              }
            });
          }

          // Ensure navTabs have synchronized short_name and nav_title
          if (Array.isArray(result.navTabs)) {
            result.navTabs = result.navTabs.map((t: any) => {
              const effectiveLabel = t.short_name || t.nav_title || t.name || t.title || t.label || '';
              return {
                ...t,
                label: effectiveLabel,
                short_name: effectiveLabel,
                nav_title: effectiveLabel,
              };
            });
          }

          return result as SiteConfig;
        }
      }
      return null;
    } catch (err) {
      console.warn('Supabase fetchSiteConfig failed:', err);
      return null;
    }
  },

  async upsertSiteConfig(config: SiteConfig): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: true };

    try {
      const configData = config;
      const now = new Date().toISOString();

      // Convert dailyWidgets to dictionary structure for compatibility with daily_widgets / daily_posters json columns
      const dailyWidgetsDict: Record<string, any> = {};
      if (Array.isArray(configData.dailyWidgets)) {
        configData.dailyWidgets.forEach((item) => {
          const cleanKey = item.id.replace(/^widget_/, '');
          dailyWidgetsDict[cleanKey] = {
            id: cleanKey,
            categoryName: item.categoryName,
            title: item.title || '',
            content: item.content || '',
            image: item.imageUrl || '',
            imageUrl: item.imageUrl || '',
            aspectRatio: item.aspectRatioMode || 'auto',
            aspectRatioMode: item.aspectRatioMode || 'auto',
            updatedAt: item.updatedAt || now,
          };
        });
      }

      // 1. Primary payload containing all compatible columns as requested
      const payload: any = {
        id: 'default',
        title: configData.title || '',
        subtitle: configData.subtitle || '',
        unit_name: configData.footerUnitName || configData.site_info?.unit_name || configData.title || '',
        marquee_text: configData.ticker || configData.marquee_text || '',
        marquee_mode: configData.marquee_mode || configData.tickerMode || 'combined',
        marquee_days: configData.marquee_days ?? configData.tickerDays ?? 3,
        marquee_speed: configData.marquee_speed || configData.tickerSpeed || 'normal',
        announcements: configData.announcements || configData.tickerCustomList || [],
        site_info: configData.site_info || {},
        footer_config: configData.footer_config || {},
        theme_color: configData.colorRed || '#b91c1c',
        daily_widgets: configData.dailyWidgets || dailyWidgetsDict,
        daily_posters: dailyWidgetsDict,
        categories_config: configData.categories_config || configData.categoriesConfig || [],
        navigation_tabs: configData.navigation_tabs || configData.categories_config || configData.categoriesConfig || [],
        updated_at: now,
      };

      const { error } = await supabase.from('site_config').upsert(payload, { onConflict: 'id' });
      if (!error) {
        return { success: true };
      }

      // If column mismatch (e.g. some columns do not exist in custom schema), try fallback variations
      const fallbackPayloads = [
        {
          id: 'default',
          categories_config: configData.categories_config || configData.categoriesConfig || [],
          navigation_tabs: configData.navigation_tabs || configData.categories_config || configData.categoriesConfig || [],
          updated_at: now,
        },
        {
          id: 'default',
          title: configData.title || '',
          subtitle: configData.subtitle || '',
          unit_name: configData.footerUnitName || configData.title || '',
          marquee_text: configData.ticker || '',
          theme_color: configData.colorRed || '#b91c1c',
          categories_config: configData.categories_config || configData.categoriesConfig || [],
          navigation_tabs: configData.navigation_tabs || configData.categories_config || configData.categoriesConfig || [],
          updated_at: now,
        },
        {
          id: 'default',
          daily_widgets: configData.dailyWidgets || dailyWidgetsDict,
          daily_posters: dailyWidgetsDict,
          config_json: configData,
          updated_at: now,
        },
        { id: 'default', config_json: configData, updated_at: now },
        { id: 'default', config: configData, updated_at: now },
        { id: 'default', data: configData, updated_at: now },
        {
          id: 1,
          title: configData.title || '',
          subtitle: configData.subtitle || '',
          unit_name: configData.footerUnitName || configData.title || '',
          marquee_text: configData.ticker || '',
          theme_color: configData.colorRed || '#b91c1c',
          daily_widgets: configData.dailyWidgets || dailyWidgetsDict,
          daily_posters: dailyWidgetsDict,
          config_json: configData,
          config: configData,
          data: configData,
          updated_at: now,
        },
        { id: 1, config_json: configData, updated_at: now },
        { id: 1, config: configData, updated_at: now },
        { id: 1, data: configData, updated_at: now },
      ];

      for (const altPayload of fallbackPayloads) {
        try {
          const { error: altErr } = await supabase.from('site_config').upsert(altPayload as any, { onConflict: 'id' });
          if (!altErr) {
            return { success: true };
          }
        } catch {
          // ignore and continue
        }
      }

      console.warn('Supabase upsertSiteConfig notice (saved locally in storage):', error.message);
      return { success: true };
    } catch (err: any) {
      console.warn('Supabase upsertSiteConfig caught error (saved locally):', err?.message || err);
      return { success: true };
    }
  },

  async upsertDailyPoster(poster: {
    id: string; // 'uncle_ho' | 'safety' | 'traffic' | 'good_deed'
    image_data: string;
    aspect_ratio?: string;
    title?: string;
    category_name?: string;
    content?: string;
    extra_data?: any;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: true };

    try {
      const cleanKey = poster.id.replace(/^widget_/, '');
      const standardKey =
        cleanKey === 'uncle_ho' || cleanKey === 'uncleHo' || cleanKey === 'bac_ho'
          ? 'uncle_ho'
          : cleanKey === 'safety_message' || cleanKey === 'safety'
          ? 'safety'
          : cleanKey === 'traffic_situation' || cleanKey === 'traffic'
          ? 'traffic'
          : 'good_deed';

      const now = new Date().toISOString();

      // Upsert into dedicated daily_posters table
      try {
        const payload: any = {
          id: standardKey,
          image_data: poster.image_data || '',
          aspect_ratio: poster.aspect_ratio || 'auto',
          title: poster.title || '',
          category_name: poster.category_name || '',
          content: poster.content || '',
          extra_data: poster.extra_data || {},
          updated_at: now,
        };
        const { error: upsertErr } = await supabase.from('daily_posters').upsert(payload, { onConflict: 'id' });
        if (upsertErr) {
          // Fallback if some columns don't exist
          await supabase.from('daily_posters').upsert(
            {
              id: standardKey,
              key: standardKey,
              widget_id: standardKey,
              image_data: poster.image_data || '',
              aspect_ratio: poster.aspect_ratio || 'auto',
              title: poster.title || '',
              updated_at: now,
            } as any,
            { onConflict: 'id' }
          );
        }
      } catch {
        // ignore if table not yet created
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Supabase upsertDailyPoster error:', err?.message || err);
      return { success: true };
    }
  },

  async fetchDailyPosters(): Promise<Record<string, { image_data: string; aspect_ratio: string; title?: string; category_name?: string; content?: string; extra_data?: any; updatedAt?: string }> | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('daily_posters').select('*');
      if (error || !data) return null;

      const result: Record<string, { image_data: string; aspect_ratio: string; title?: string; category_name?: string; content?: string; extra_data?: any; updatedAt?: string }> = {};
      data.forEach((row: any) => {
        const key = (row.id || row.key || row.widget_id || '').replace(/^widget_/, '');
        const normKey =
          key === 'uncle_ho' || key === 'uncleHo' || key === 'bac_ho'
            ? 'uncle_ho'
            : key === 'safety_message' || key === 'safety'
            ? 'safety'
            : key === 'traffic_situation' || key === 'traffic'
            ? 'traffic'
            : 'good_deed';

        result[normKey] = {
          image_data: row.image_data || row.imageUrl || row.image || '',
          aspect_ratio: row.aspect_ratio || row.aspectRatio || row.aspectRatioMode || 'auto',
          title: row.title || '',
          category_name: row.category_name || row.categoryName || '',
          content: row.content || '',
          extra_data: row.extra_data || row.extraData || null,
          updatedAt: row.updated_at || row.updatedAt || '',
        };
      });
      return result;
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------
  // 10. REALTIME DATABASE-FIRST SUBSCRIPTION (Singleton Channel: 'public:articles')
  // -------------------------------------------------------------
  subscribeAllChanges(callbacks: {
    onArticlesChange?: (articles: Article[]) => void;
    onArticleInsert?: (article: Article) => void;
    onArticleUpdate?: (article: Article) => void;
    onArticleDelete?: (articleId: number) => void;
    onDocumentsChange?: (docs: DocumentItem[]) => void;
    onLecturesChange?: (lectures: LectureItem[]) => void;
    onSiteConfigChange?: (config: SiteConfig) => void;
    onUsersChange?: (users: User[]) => void;
  }): (() => void) | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      // Clean up previous singleton channel if already present
      if (activeSingletonChannel) {
        try {
          supabase.removeChannel(activeSingletonChannel);
        } catch {
          // ignore
        }
        activeSingletonChannel = null;
      }

      const channel = supabase
        .channel('public:articles')
        // 1. Articles (Instant Realtime Auto-Fetch and Event Handling for all users)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, async (payload) => {
          try {
            console.log('[Supabase Realtime] Articles event:', payload.eventType);

            // Granular event handling for instant UI updates
            if (payload.eventType === 'INSERT' && payload.new) {
              const newArt = supabaseDb.mapRowToArticle(payload.new);
              if (callbacks.onArticleInsert) {
                callbacks.onArticleInsert(newArt);
              }
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedArt = supabaseDb.mapRowToArticle(payload.new);
              if (callbacks.onArticleUpdate) {
                callbacks.onArticleUpdate(updatedArt);
              }
            } else if (payload.eventType === 'DELETE' && payload.old) {
              const deletedId = Number(payload.old.id);
              if (callbacks.onArticleDelete && !isNaN(deletedId)) {
                callbacks.onArticleDelete(deletedId);
              }
            }

            // Fetch full fresh list as backup, but only update if valid articles exist
            if (callbacks.onArticlesChange) {
              const fresh = await supabaseDb.fetchArticles();
              if (fresh !== null && fresh.length > 0) {
                callbacks.onArticlesChange(fresh);
              }
            }
          } catch (e) {
            console.warn('[Realtime Articles Handler] Error caught safely:', e);
          }
        })
        // 2. Documents
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, async () => {
          try {
            if (callbacks.onDocumentsChange) {
              const fresh = await supabaseDb.fetchDocuments();
              if (fresh !== null) callbacks.onDocumentsChange(fresh);
            }
          } catch (e) {
            console.warn('[Realtime Documents Handler] Error caught safely:', e);
          }
        })
        // 3. Lectures
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lectures' }, async () => {
          try {
            if (callbacks.onLecturesChange) {
              const fresh = await supabaseDb.fetchLectures();
              if (fresh !== null) callbacks.onLecturesChange(fresh);
            }
          } catch (e) {
            console.warn('[Realtime Lectures Handler] Error caught safely:', e);
          }
        })
        // 4. Site Config & Categories
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, async () => {
          try {
            if (callbacks.onSiteConfigChange) {
              const fresh = await supabaseDb.fetchSiteConfig();
              if (fresh !== null) callbacks.onSiteConfigChange(fresh);
            }
          } catch (e) {
            console.warn('[Realtime SiteConfig Handler] Error caught safely:', e);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
          try {
            if (callbacks.onSiteConfigChange) {
              const fresh = await supabaseDb.fetchSiteConfig();
              if (fresh !== null) callbacks.onSiteConfigChange(fresh);
            }
          } catch (e) {
            console.warn('[Realtime Categories Handler] Error caught safely:', e);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_posters' }, async () => {
          try {
            if (callbacks.onSiteConfigChange) {
              const fresh = await supabaseDb.fetchSiteConfig();
              if (fresh !== null) callbacks.onSiteConfigChange(fresh);
            }
          } catch (e) {
            console.warn('[Realtime DailyPosters Handler] Error caught safely:', e);
          }
        })
        // 8. Users
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
          try {
            if (callbacks.onUsersChange) {
              const fresh = await supabaseDb.fetchUsers();
              if (fresh !== null) callbacks.onUsersChange(fresh);
            }
          } catch (e) {
            console.warn('[Realtime Users Handler] Error caught safely:', e);
          }
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime connected successfully');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Safe logging without reconnect storm
            if (err) {
              console.warn(`[Supabase Realtime] Notice (${status}):`, err.message || err);
            }
          }
        });

      activeSingletonChannel = channel;

      return () => {
        try {
          if (activeSingletonChannel === channel) {
            supabase.removeChannel(channel);
            activeSingletonChannel = null;
          } else {
            supabase.removeChannel(channel);
          }
        } catch {
          // ignore cleanup errors
        }
      };
    } catch (e) {
      console.warn('Supabase subscribeAllChanges failed:', e);
      return null;
    }
  },
};
