import { safeStore as baseStore } from './storage';
import { supabaseDb, isSupabaseConfigured } from './supabase';
import { firestoreDb, isFirebaseConfigured } from './firebase';
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
} from '../types';

// Synchronous local storage caching
export const safeStore = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
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
export { isSupabaseConfigured, isFirebaseConfigured, firestoreDb, supabaseDb };

// Hybrid cloud storage manager connecting Firestore & Supabase directly
export const cloudStorage = {
  // Check whether cloud sync is active (Firestore or Supabase)
  isCloudActive: () => isFirebaseConfigured() || isSupabaseConfigured(),

  // =========================================================================
  // 1. ARTICLES & TIN TỨC
  // =========================================================================
  async loadArticles(fallback: Article[]): Promise<Article[]> {
    // 1. Try Firebase Firestore
    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchArticles();
        if (remote && remote.length > 0) {
          safeStore.set('mangyang_articles', remote);
          return remote;
        } else if (remote && remote.length === 0 && fallback.length > 0) {
          for (const art of fallback) {
            await firestoreDb.upsertArticle(art);
          }
          safeStore.set('mangyang_articles', fallback);
          return fallback;
        }
      } catch (e) {
        console.warn('Firestore loadArticles error:', e);
      }
    }
    // 2. Fallback to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchArticles();
        if (remote && remote.length > 0) {
          safeStore.set('mangyang_articles', remote);
          return remote;
        } else if (remote && remote.length === 0 && fallback.length > 0) {
          for (const art of fallback) {
            await supabaseDb.upsertArticle(art);
          }
          safeStore.set('mangyang_articles', fallback);
          return fallback;
        }
      } catch (e) {
        console.warn('Supabase loadArticles error:', e);
      }
    }
    return safeStore.get('mangyang_articles', fallback);
  },

  subscribeArticles(onUpdate: (articles: Article[]) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      const unsubscribe = firestoreDb.subscribeArticles(onUpdate);
      if (unsubscribe) return unsubscribe;
    }
    return null;
  },

  async saveArticle(article: Article): Promise<{ success: boolean; error?: string }> {
    let saved = false;
    let errorMsg = '';
    try {
      if (isFirebaseConfigured()) {
        const res = await firestoreDb.upsertArticle(article);
        if (res) saved = true;
      }
      if (isSupabaseConfigured()) {
        await supabaseDb.upsertArticle(article);
        saved = true;
      }
      // Keep local store synchronized as resilient offline buffer
      const currentList = safeStore.get<Article[]>('mangyang_articles', []);
      const existsIdx = currentList.findIndex((a) => a.id === article.id);
      let updatedList: Article[];
      if (existsIdx >= 0) {
        updatedList = currentList.map((a) => (a.id === article.id ? article : a));
      } else {
        updatedList = [article, ...currentList];
      }
      safeStore.set('mangyang_articles', updatedList);
      return { success: true };
    } catch (e: any) {
      console.error('Error saving article:', e);
      errorMsg = e?.message || 'Lỗi không xác định khi lưu vào Cơ sở dữ liệu';
      return { success: saved, error: errorMsg };
    }
  },

  async deleteArticle(articleId: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (isFirebaseConfigured()) {
        await firestoreDb.deleteArticle(articleId);
      }
      if (isSupabaseConfigured()) {
        await supabaseDb.deleteArticle(articleId);
      }
      const currentList = safeStore.get<Article[]>('mangyang_articles', []);
      const filtered = currentList.filter((a) => a.id !== articleId);
      safeStore.set('mangyang_articles', filtered);
      return { success: true };
    } catch (e: any) {
      console.error('Error deleting article:', e);
      return { success: false, error: e?.message || 'Lỗi khi xóa bài viết' };
    }
  },

  async incrementViews(articleId: number, currentViews: number): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.incrementArticleViews(articleId, currentViews);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.incrementArticleViews(articleId, currentViews);
    }
  },

  // =========================================================================
  // 2. USERS / QUÂN NHÂN
  // =========================================================================
  async loadUsers(fallback: User[]): Promise<User[]> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchUsers();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_users', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((u) => firestoreDb.upsertUser(u));
      }
    }
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchUsers();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_users', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((u) => supabaseDb.upsertUser(u));
      }
    }
    return safeStore.get('mangyang_users', fallback);
  },

  async saveUser(user: User): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertUser(user);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertUser(user);
    }
  },

  async deleteUser(userId: number): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.deleteUser(userId);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteUser(userId);
    }
  },

  // =========================================================================
  // 3. DOCUMENTS / VĂN BẢN
  // =========================================================================
  async loadDocuments(fallback: DocumentItem[]): Promise<DocumentItem[]> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchDocuments();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_documents', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((doc) => firestoreDb.upsertDocument(doc));
      }
    }
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchDocuments();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_documents', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((doc) => supabaseDb.upsertDocument(doc));
      }
    }
    return safeStore.get('mangyang_documents', fallback);
  },

  subscribeDocuments(onUpdate: (documents: DocumentItem[]) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      const unsubscribe = firestoreDb.subscribeDocuments(onUpdate);
      if (unsubscribe) return unsubscribe;
    }
    return null;
  },

  async saveDocument(doc: DocumentItem): Promise<{ success: boolean; error?: string }> {
    try {
      if (isFirebaseConfigured()) {
        await firestoreDb.upsertDocument(doc);
      }
      if (isSupabaseConfigured()) {
        await supabaseDb.upsertDocument(doc);
      }
      const currentList = safeStore.get<DocumentItem[]>('mangyang_documents', []);
      const exists = currentList.some((d) => d.id === doc.id);
      const updatedList = exists
        ? currentList.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...currentList];
      safeStore.set('mangyang_documents', updatedList);
      return { success: true };
    } catch (e: any) {
      console.error('Error saving document:', e);
      return { success: false, error: e?.message || 'Lỗi khi lưu văn bản' };
    }
  },

  async deleteDocument(docId: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (isFirebaseConfigured()) {
        await firestoreDb.deleteDocument(docId);
      }
      if (isSupabaseConfigured()) {
        await supabaseDb.deleteDocument(docId);
      }
      const currentList = safeStore.get<DocumentItem[]>('mangyang_documents', []);
      const filtered = currentList.filter((d) => d.id !== docId);
      safeStore.set('mangyang_documents', filtered);
      return { success: true };
    } catch (e: any) {
      console.error('Error deleting document:', e);
      return { success: false, error: e?.message || 'Lỗi khi xóa văn bản' };
    }
  },

  // =========================================================================
  // 4. LECTURES / BÀI GIẢNG ĐIỆN TỬ
  // =========================================================================
  async loadLectures(fallback: LectureItem[]): Promise<LectureItem[]> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchLectures();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_lectures', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((lec) => firestoreDb.upsertLecture(lec));
      }
    }
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchLectures();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_lectures', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((lec) => supabaseDb.upsertLecture(lec));
      }
    }
    return safeStore.get('mangyang_lectures', fallback);
  },

  subscribeLectures(onUpdate: (lectures: LectureItem[]) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      const unsubscribe = firestoreDb.subscribeLectures(onUpdate);
      if (unsubscribe) return unsubscribe;
    }
    return null;
  },

  async saveLecture(lecture: LectureItem): Promise<{ success: boolean; error?: string }> {
    try {
      if (isFirebaseConfigured()) {
        await firestoreDb.upsertLecture(lecture);
      }
      if (isSupabaseConfigured()) {
        await supabaseDb.upsertLecture(lecture);
      }
      const currentList = safeStore.get<LectureItem[]>('mangyang_lectures', []);
      const exists = currentList.some((l) => l.id === lecture.id);
      const updatedList = exists
        ? currentList.map((l) => (l.id === lecture.id ? lecture : l))
        : [lecture, ...currentList];
      safeStore.set('mangyang_lectures', updatedList);
      return { success: true };
    } catch (e: any) {
      console.error('Error saving lecture:', e);
      return { success: false, error: e?.message || 'Lỗi khi lưu bài giảng' };
    }
  },

  async deleteLecture(lectureId: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (isFirebaseConfigured()) {
        await firestoreDb.deleteLecture(lectureId);
      }
      if (isSupabaseConfigured()) {
        await supabaseDb.deleteLecture(lectureId);
      }
      const currentList = safeStore.get<LectureItem[]>('mangyang_lectures', []);
      const filtered = currentList.filter((l) => l.id !== lectureId);
      safeStore.set('mangyang_lectures', filtered);
      return { success: true };
    } catch (e: any) {
      console.error('Error deleting lecture:', e);
      return { success: false, error: e?.message || 'Lỗi khi xóa bài giảng' };
    }
  },

  // =========================================================================
  // 5. MEETING VOTES
  // =========================================================================
  async loadMeetingVotes(fallback: Record<number, MeetingVote>): Promise<Record<number, MeetingVote>> {
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchMeetingVotes();
      if (remote && Object.keys(remote).length > 0) {
        safeStore.set('mangyang_meeting_votes', remote);
        return remote;
      }
    }
    return safeStore.get('mangyang_meeting_votes', fallback);
  },

  async saveMeetingVote(vote: MeetingVote): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertMeetingVote(vote);
    }
  },

  async resetMeetingVotes(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.clearMeetingVotes();
    }
  },

  // =========================================================================
  // 6. MEETING DOCUMENTS
  // =========================================================================
  async loadMeetingDocuments(fallback: MeetingDocumentItem[]): Promise<MeetingDocumentItem[]> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchMeetingDocuments();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_meeting_docs', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((d) => firestoreDb.upsertMeetingDocument(d));
      }
    }
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchMeetingDocuments();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_meeting_docs', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((d) => supabaseDb.upsertMeetingDocument(d));
      }
    }
    return safeStore.get('mangyang_meeting_docs', fallback);
  },

  subscribeMeetingDocuments(onUpdate: (docs: MeetingDocumentItem[]) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      const unsubscribe = firestoreDb.subscribeMeetingDocuments(onUpdate);
      if (unsubscribe) return unsubscribe;
    }
    return null;
  },

  async saveMeetingDocument(doc: MeetingDocumentItem): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertMeetingDocument(doc);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertMeetingDocument(doc);
    }
  },

  async deleteMeetingDocument(docId: number): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.deleteMeetingDocument(docId);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteMeetingDocument(docId);
    }
  },

  // =========================================================================
  // 7. MEETING SETTINGS & PASSWORD
  // =========================================================================
  async loadMeetingSettings(fallback: MeetingRoomSettings): Promise<MeetingRoomSettings> {
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchMeetingSettings();
      if (remote) {
        safeStore.set('mangyang_meeting_settings', remote);
        return remote;
      } else {
        supabaseDb.upsertMeetingSettings(fallback);
      }
    }
    return safeStore.get('mangyang_meeting_settings', fallback);
  },

  async saveMeetingSettings(settings: MeetingRoomSettings): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertMeetingSettings(settings);
    }
  },

  // =========================================================================
  // 8. MULTI-MEETING ROOMS
  // =========================================================================
  async loadMeetingRooms(fallback: MeetingRoomItem[]): Promise<MeetingRoomItem[]> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchMeetingRooms();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_meeting_rooms', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((r) => firestoreDb.upsertMeetingRoom(r));
      }
    }
    return safeStore.get('mangyang_meeting_rooms', fallback);
  },

  subscribeMeetingRooms(onUpdate: (rooms: MeetingRoomItem[]) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      const unsubscribe = firestoreDb.subscribeMeetingRooms(onUpdate);
      if (unsubscribe) return unsubscribe;
    }
    return null;
  },

  async saveMeetingRooms(rooms: MeetingRoomItem[]): Promise<void> {
    safeStore.set('mangyang_meeting_rooms', rooms.slice(0, 30));
    if (isFirebaseConfigured()) {
      rooms.forEach((r) => firestoreDb.upsertMeetingRoom(r));
    }
  },

  async saveMeetingRoom(room: MeetingRoomItem, currentRooms?: MeetingRoomItem[]): Promise<MeetingRoomItem[]> {
    const list = currentRooms || safeStore.get('mangyang_meeting_rooms', []);
    const exists = list.some((r: MeetingRoomItem) => r.id === room.id);
    let updated: MeetingRoomItem[];
    if (exists) {
      updated = list.map((r: MeetingRoomItem) => (r.id === room.id ? room : r));
    } else {
      updated = [room, ...list].slice(0, 30);
    }
    safeStore.set('mangyang_meeting_rooms', updated);
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertMeetingRoom(room);
    }
    return updated;
  },

  async deleteMeetingRoom(roomId: string, currentRooms?: MeetingRoomItem[]): Promise<MeetingRoomItem[]> {
    const list = currentRooms || safeStore.get('mangyang_meeting_rooms', []);
    const updated = list.filter((r: MeetingRoomItem) => r.id !== roomId);
    safeStore.set('mangyang_meeting_rooms', updated);
    if (isFirebaseConfigured()) {
      await firestoreDb.deleteMeetingRoom(roomId);
    }
    return updated;
  },

  // =========================================================================
  // 9. SITE CONFIG
  // =========================================================================
  async loadSiteConfig(fallback: SiteConfig): Promise<SiteConfig> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchSiteConfig();
      if (remote) {
        safeStore.set('mangyang_site_config', remote);
        return remote;
      } else {
        firestoreDb.upsertSiteConfig(fallback);
      }
    }
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchSiteConfig();
      if (remote) {
        safeStore.set('mangyang_site_config', remote);
        return remote;
      } else {
        supabaseDb.upsertSiteConfig(fallback);
      }
    }
    return safeStore.get('mangyang_site_config', fallback);
  },

  subscribeSiteConfig(onUpdate: (config: SiteConfig) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      const unsubscribe = firestoreDb.subscribeSiteConfig(onUpdate);
      if (unsubscribe) return unsubscribe;
    }
    return null;
  },

  async saveSiteConfig(config: SiteConfig): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertSiteConfig(config);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertSiteConfig(config);
    }
  },

  // =========================================================================
  // 10. UNCLE HO QUOTES & SETTINGS
  // =========================================================================
  async loadUncleHoQuotes(fallback: UncleHoQuote[]): Promise<UncleHoQuote[]> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchUncleHoQuotes();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_uncle_ho_quotes', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        firestoreDb.upsertUncleHoQuotes(fallback);
      }
    }
    return safeStore.get('mangyang_uncle_ho_quotes', fallback);
  },

  async saveUncleHoQuotes(quotes: UncleHoQuote[]): Promise<void> {
    safeStore.set('mangyang_uncle_ho_quotes', quotes);
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertUncleHoQuotes(quotes);
    }
  },

  async loadUncleHoSettings(fallback: UncleHoSettings): Promise<UncleHoSettings> {
    if (isFirebaseConfigured()) {
      const remote = await firestoreDb.fetchUncleHoSettings();
      if (remote) {
        safeStore.set('mangyang_uncle_ho_settings', remote);
        return remote;
      } else {
        firestoreDb.upsertUncleHoSettings(fallback);
      }
    }
    return safeStore.get('mangyang_uncle_ho_settings', fallback);
  },

  async saveUncleHoSettings(settings: UncleHoSettings): Promise<void> {
    safeStore.set('mangyang_uncle_ho_settings', settings);
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertUncleHoSettings(settings);
    }
  },
};
