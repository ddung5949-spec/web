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
      const remote = await firestoreDb.fetchArticles();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_articles', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((art) => firestoreDb.upsertArticle(art));
      }
    }
    // 2. Fallback to Supabase if configured
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchArticles();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_articles', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        fallback.forEach((art) => supabaseDb.upsertArticle(art));
      }
    }
    return safeStore.get('mangyang_articles', fallback);
  },

  async saveArticle(article: Article): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertArticle(article);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertArticle(article);
    }
  },

  async deleteArticle(articleId: number): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.deleteArticle(articleId);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteArticle(articleId);
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

  async saveDocument(doc: DocumentItem): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertDocument(doc);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertDocument(doc);
    }
  },

  async deleteDocument(docId: number): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.deleteDocument(docId);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteDocument(docId);
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

  async saveLecture(lecture: LectureItem): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertLecture(lecture);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertLecture(lecture);
    }
  },

  async deleteLecture(lectureId: number): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.deleteLecture(lectureId);
    }
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteLecture(lectureId);
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
