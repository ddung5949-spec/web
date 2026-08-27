import { supabaseDb, isSupabaseConfigured } from './supabase';
import {
  Article,
  DocumentItem,
  LectureItem,
  MeetingDocumentItem,
  MeetingRoomItem,
  MeetingRoomSettings,
  MeetingVote,
  SiteConfig,
  UncleHoQuote,
  UncleHoSettings,
  User,
  RoomPresenceItem,
  CollabDocData,
  RoomBroadcastAction,
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
  async loadArticles(fallback: Article[]): Promise<Article[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchArticles();
        if (remote !== null && remote.length > 0) {
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
  async loadDocuments(fallback: DocumentItem[]): Promise<DocumentItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchDocuments();
        if (remote !== null && remote.length > 0) {
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
  async loadLectures(fallback: LectureItem[]): Promise<LectureItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchLectures();
        if (remote !== null && remote.length > 0) {
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
        if (remote !== null) {
          safeStore.set('mangyang_site_config', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadSiteConfig error:', e);
      }
    }
    return safeStore.get('mangyang_site_config', fallback);
  },

  async saveSiteConfig(config: SiteConfig): Promise<{ success: boolean; error?: string }> {
    safeStore.set('mangyang_site_config', config);
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertSiteConfig(config);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi lưu cấu hình giao diện' };
      }
    }
    return { success: true };
  },

  // =========================================================================
  // 6. MEETING ROOMS & THIẾT LẬP PHÒNG HỌP CHI BỘ
  // =========================================================================
  async loadMeetingRooms(fallback: MeetingRoomItem[]): Promise<MeetingRoomItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchMeetingRooms();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_meeting_rooms', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadMeetingRooms error:', e);
      }
    }
    return safeStore.get('mangyang_meeting_rooms', fallback);
  },

  async saveMeetingRoom(room: MeetingRoomItem, _updatedList?: MeetingRoomItem[]): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertMeetingRoom(room);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi lưu phòng họp' };
      }
    }

    const current = safeStore.get<MeetingRoomItem[]>('mangyang_meeting_rooms', []);
    const exists = current.some((r) => r.id === room.id);
    const updated = exists ? current.map((r) => (r.id === room.id ? room : r)) : [room, ...current];
    safeStore.set('mangyang_meeting_rooms', updated);

    return { success: true };
  },

  async saveMeetingRooms(rooms: MeetingRoomItem[]): Promise<void> {
    safeStore.set('mangyang_meeting_rooms', rooms);
    if (isSupabaseConfigured()) {
      for (const r of rooms) {
        await supabaseDb.upsertMeetingRoom(r);
      }
    }
  },

  async deleteMeetingRoom(roomId: string, _updatedList?: MeetingRoomItem[]): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteMeetingRoom(roomId);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi xóa phòng họp' };
      }
    }

    const current = safeStore.get<MeetingRoomItem[]>('mangyang_meeting_rooms', []);
    const updated = current.filter((r) => r.id !== roomId);
    safeStore.set('mangyang_meeting_rooms', updated);

    return { success: true };
  },

  // =========================================================================
  // 7. MEETING DOCUMENTS / TÀI LIỆU CUỘC HỌP
  // =========================================================================
  async loadMeetingDocuments(fallback: MeetingDocumentItem[]): Promise<MeetingDocumentItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchMeetingDocuments();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_meeting_documents', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadMeetingDocuments error:', e);
      }
    }
    return safeStore.get('mangyang_meeting_documents', fallback);
  },

  async saveMeetingDocument(doc: MeetingDocumentItem): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertMeetingDocument(doc);
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi lưu tài liệu họp' };
      }
    }

    const current = safeStore.get<MeetingDocumentItem[]>('mangyang_meeting_documents', []);
    const exists = current.some((d) => d.id === doc.id);
    const updated = exists ? current.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...current];
    safeStore.set('mangyang_meeting_documents', updated);

    return { success: true };
  },

  async deleteMeetingDocument(docId: number | string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteMeetingDocument(Number(docId));
      if (!res.success) {
        return { success: false, error: res.error || 'Lỗi xóa tài liệu họp' };
      }
    }

    const current = safeStore.get<MeetingDocumentItem[]>('mangyang_meeting_documents', []);
    const updated = current.filter((d) => String(d.id) !== String(docId));
    safeStore.set('mangyang_meeting_documents', updated);

    return { success: true };
  },

  // =========================================================================
  // 8. MEETING SETTINGS / CẤU HÌNH PHÒNG HỌP
  // =========================================================================
  async loadMeetingSettings(fallback: MeetingRoomSettings): Promise<MeetingRoomSettings> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchMeetingSettings();
        if (remote !== null) {
          safeStore.set('mangyang_meeting_settings', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadMeetingSettings error:', e);
      }
    }
    return safeStore.get('mangyang_meeting_settings', fallback);
  },

  async saveMeetingSettings(settings: MeetingRoomSettings): Promise<{ success: boolean; error?: string }> {
    safeStore.set('mangyang_meeting_settings', settings);
    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertMeetingSettings(settings);
      return res;
    }
    return { success: true };
  },

  // =========================================================================
  // 9. MEETING VOTES / BIỂU QUYẾT
  // =========================================================================
  async loadMeetingVotes(fallback: Record<string, MeetingVote>): Promise<Record<string, MeetingVote>> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchMeetingVotes();
        if (remote && Object.keys(remote).length > 0) {
          safeStore.set('mangyang_meeting_votes', remote as any);
          return remote as any;
        }
      } catch (e) {
        console.warn('Supabase loadMeetingVotes error:', e);
      }
    }
    return safeStore.get('mangyang_meeting_votes', fallback);
  },

  async saveMeetingVote(vote: MeetingVote): Promise<void> {
    const current = safeStore.get<Record<string, MeetingVote>>('mangyang_meeting_votes', {});
    current[vote.userId] = vote;
    safeStore.set('mangyang_meeting_votes', current);

    if (isSupabaseConfigured()) {
      await supabaseDb.upsertMeetingVote(vote);
    }
  },

  async resetMeetingVotes(): Promise<void> {
    safeStore.set('mangyang_meeting_votes', {});
    if (isSupabaseConfigured()) {
      await supabaseDb.clearMeetingVotes();
    }
  },

  // =========================================================================
  // 10. BÁC HỒ & LỜI DẠY
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
  // 11. COLLABORATION WORKSPACE METHODS (SAFE NO-OP / IN-MEMORY)
  // =========================================================================
  subscribeRoomPresence: (_roomId: string, _callback: (list: RoomPresenceItem[]) => void) => () => {},
  subscribeCollabDoc: (_roomId: string, _docId: number, _callback: (doc: CollabDocData | null) => void) => () => {},
  subscribeRoomActions: (_roomId: string, _callback: (actions: RoomBroadcastAction[]) => void) => () => {},
  updateRoomPresence: async (_userOrRoom: RoomPresenceItem | string, _user?: RoomPresenceItem) => {},
  removeRoomPresence: async (_roomId: string, _userId: number) => {},
  saveCollabDoc: async (_roomId: string, _docId: number, _docData: CollabDocData) => {},
  broadcastRoomAction: async (_actionOrRoom: RoomBroadcastAction | string, _action?: RoomBroadcastAction) => {},

  // =========================================================================
  // 12. GLOBAL REALTIME SUBSCRIPTION (EXCLUSIVELY SUPABASE)
  // =========================================================================
  subscribeAll(callbacks: {
    onArticlesChange?: (articles: Article[]) => void;
    onArticleInsert?: (article: Article) => void;
    onArticleUpdate?: (article: Article) => void;
    onArticleDelete?: (articleId: number) => void;
    onDocumentsChange?: (docs: DocumentItem[]) => void;
    onLecturesChange?: (lectures: LectureItem[]) => void;
    onMeetingSettingsChange?: (settings: MeetingRoomSettings) => void;
    onMeetingDocumentsChange?: (docs: MeetingDocumentItem[]) => void;
    onMeetingRoomsChange?: (rooms: MeetingRoomItem[]) => void;
    onSiteConfigChange?: (config: SiteConfig) => void;
    onUsersChange?: (users: User[]) => void;
  }): (() => void) | null {
    if (isSupabaseConfigured()) {
      return supabaseDb.subscribeAllChanges(callbacks);
    }
    return null;
  },
};
