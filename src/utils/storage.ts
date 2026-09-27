import { supabaseDb, isSupabaseConfigured } from './supabase';
import {
  Article,
  DocumentItem,
  LectureItem,
  SiteConfig,
  UncleHoQuote,
  UncleHoSettings,
  User,
} from '../types';

// Synchronous safe memory / localStorage store with try-catch
// IMPORTANT: ARTICLES ARE NEVER STORED IN LOCALSTORAGE TO PREVENT QUOTA EXCEEDED (5MB limit)
export const safeStore = {
  get: <T>(key: string, fallback: T): T => {
    if (key === 'mangyang_articles' || key.startsWith('mangyang_article_')) {
      return fallback;
    }
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    // Strictly prevent writing articles to localStorage
    if (key === 'mangyang_articles' || key.startsWith('mangyang_article_')) {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save skipped/failed for key:', key, e);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage remove failed:', e);
    }
  },
};

// Re-export utilities
export { isSupabaseConfigured, supabaseDb };

// Database-First Cloud Storage Manager connecting exclusively to Supabase
export const cloudStorage = {
  // Check whether cloud sync is active
  isCloudActive: () => isSupabaseConfigured(),

  // =========================================================================
  // 1. ARTICLES & TIN TỨC (DATABASE-FIRST EXCLUSIVELY VIA SUPABASE)
  // =========================================================================
  async loadArticles(fallback: Article[] = []): Promise<Article[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchArticles();
        if (remote !== null) {
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadArticles error:', e);
      }
    }
    return fallback;
  },

  async saveArticle(article: Article): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertArticle(article);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error || 'Lỗi lưu vào Supabase' };
    }
    return { success: true };
  },

  async deleteArticle(articleId: number): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteArticle(articleId);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error || 'Lỗi xóa khỏi Supabase' };
    }
    return { success: true };
  },

  async incrementViews(articleId: number, currentViews: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.incrementArticleViews(articleId, currentViews);
    }
  },

  // =========================================================================
  // 2. USERS / QUÂN NHÂN
  // =========================================================================
  async loadUsers(fallback: User[]): Promise<User[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchUsers();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_users', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadUsers error:', e);
      }
    }
    return safeStore.get('mangyang_users', fallback);
  },

  async saveUser(user: User): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertUser(user);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi lưu tài khoản' };
      }
    }

    const currentList = safeStore.get<User[]>('mangyang_users', []);
    const exists = currentList.some((u) => u.id === user.id);
    const updated = exists
      ? currentList.map((u) => (u.id === user.id ? user : u))
      : [user, ...currentList];
    safeStore.set('mangyang_users', updated);

    return { success: true };
  },

  async deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteUser(userId);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi xóa tài khoản' };
      }
    }

    const currentList = safeStore.get<User[]>('mangyang_users', []);
    const updated = currentList.filter((u) => u.id !== userId);
    safeStore.set('mangyang_users', updated);

    return { success: true };
  },

  // =========================================================================
  // 3. DOCUMENTS / VĂN BẢN
  // =========================================================================
  async loadDocuments(fallback: DocumentItem[] = []): Promise<DocumentItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchDocuments();
        if (remote !== null) {
          safeStore.set('mangyang_documents', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadDocuments error:', e);
      }
    }
    return safeStore.get('mangyang_documents', fallback);
  },

  async saveDocument(doc: DocumentItem): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertDocument(doc);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi lưu văn bản' };
      }
    }

    const current = safeStore.get<DocumentItem[]>('mangyang_documents', []);
    const exists = current.some((d) => d.id === doc.id);
    const updated = exists ? current.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...current];
    safeStore.set('mangyang_documents', updated);

    return { success: true };
  },

  async deleteDocument(docId: number): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteDocument(docId);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi xóa văn bản' };
      }
    }

    const current = safeStore.get<DocumentItem[]>('mangyang_documents', []);
    const updated = current.filter((d) => d.id !== docId);
    safeStore.set('mangyang_documents', updated);

    return { success: true };
  },

  // =========================================================================
  // 4. LECTURES / BÀI GIẢNG ĐIỆN TỬ
  // =========================================================================
  async loadLectures(fallback: LectureItem[] = []): Promise<LectureItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchLectures();
        if (remote !== null) {
          safeStore.set('mangyang_lectures', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadLectures error:', e);
      }
    }
    return safeStore.get('mangyang_lectures', fallback);
  },

  async saveLecture(lecture: LectureItem): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertLecture(lecture);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi lưu bài giảng' };
      }
    }

    const current = safeStore.get<LectureItem[]>('mangyang_lectures', []);
    const exists = current.some((l) => l.id === lecture.id);
    const updated = exists
      ? current.map((l) => (l.id === lecture.id ? lecture : l))
      : [lecture, ...current];
    safeStore.set('mangyang_lectures', updated);

    return { success: true };
  },

  async deleteLecture(lectureId: number): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteLecture(lectureId);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi xóa bài giảng' };
      }
    }

    const current = safeStore.get<LectureItem[]>('mangyang_lectures', []);
    const updated = current.filter((l) => l.id !== lectureId);
    safeStore.set('mangyang_lectures', updated);

    return { success: true };
  },

  // =========================================================================
  // 5. SITE CONFIG & CẤU HÌNH GIAO DIỆN
  // =========================================================================
  async loadSiteConfig(fallback: SiteConfig): Promise<SiteConfig> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchSiteConfig();
        if (remote !== null && typeof remote === 'object') {
          const merged: SiteConfig = {
            ...fallback,
            ...remote,
            sections: {
              ...fallback.sections,
              ...(remote.sections || {}),
            },
          };
          safeStore.set('mangyang_site_config', merged);
          return merged;
        }
      } catch (e) {
        console.warn('Supabase loadSiteConfig error:', e);
      }
    }
    return safeStore.get('mangyang_site_config', fallback);
  },

  async saveSiteConfig(config: SiteConfig): Promise<{ success: boolean; error?: string }> {
    try {
      safeStore.set('mangyang_site_config', config);
      if (isSupabaseConfigured()) {
        await supabaseDb.upsertSiteConfig(config);
      }
      return { success: true };
    } catch (err: any) {
      console.warn('saveSiteConfig fallback to local store:', err);
      return { success: true };
    }
  },

  // =========================================================================
  // 6. BÁC HỒ & LỜI DẠY
  // =========================================================================
  async loadUncleHoQuotes(fallback: UncleHoQuote[]): Promise<UncleHoQuote[]> {
    return safeStore.get('mangyang_uncle_ho_quotes', fallback);
  },

  async saveUncleHoQuotes(quotes: UncleHoQuote[]): Promise<void> {
    safeStore.set('mangyang_uncle_ho_quotes', quotes);
  },

  async loadUncleHoSettings(fallback: UncleHoSettings): Promise<UncleHoSettings> {
    return safeStore.get('mangyang_uncle_ho_settings', fallback);
  },

  async saveUncleHoSettings(settings: UncleHoSettings): Promise<void> {
    safeStore.set('mangyang_uncle_ho_settings', settings);
  },

  // =========================================================================
  // 7. GLOBAL REALTIME SUBSCRIPTION (EXCLUSIVELY SUPABASE)
  // =========================================================================
  subscribeAll(callbacks: {
    onArticlesChange?: (articles: Article[]) => void;
    onArticleInsert?: (article: Article) => void;
    onArticleUpdate?: (article: Article) => void;
    onArticleDelete?: (articleId: number) => void;
    onDocumentsChange?: (docs: DocumentItem[]) => void;
    onLecturesChange?: (lectures: LectureItem[]) => void;
    onSiteConfigChange?: (config: SiteConfig) => void;
    onUsersChange?: (users: User[]) => void;
  }): (() => void) | null {
    if (isSupabaseConfigured()) {
      return supabaseDb.subscribeAllChanges(callbacks);
    }
    return null;
  },
};
