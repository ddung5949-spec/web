import { safeStore as baseStore } from './storage';
import { supabaseDb, isSupabaseConfigured, getSupabase } from './supabase';
import { Article, DocumentItem, LectureItem, MeetingDocumentItem, MeetingRoomItem, MeetingRoomSettings, MeetingVote, SiteConfig, UncleHoQuote, UncleHoSettings, User } from '../types';

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

// Re-export Supabase utilities
export { isSupabaseConfigured, getSupabase, supabaseDb };

// Hybrid cloud storage manager
export const cloudStorage = {
  // Check whether cloud sync is active
  isCloudActive: () => isSupabaseConfigured(),

  // Articles
  async loadArticles(fallback: Article[]): Promise<Article[]> {
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchArticles();
      if (remote && remote.length > 0) {
        safeStore.set('mangyang_articles', remote);
        return remote;
      } else if (remote && remote.length === 0 && fallback.length > 0) {
        // Table exists but empty, seed default articles
        fallback.forEach((art) => supabaseDb.upsertArticle(art));
      }
    }
    return safeStore.get('mangyang_articles', fallback);
  },

  async saveArticle(article: Article): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertArticle(article);
    }
  },

  async deleteArticle(articleId: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteArticle(articleId);
    }
  },

  async incrementViews(articleId: number, currentViews: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.incrementArticleViews(articleId, currentViews);
    }
  },

  // Users / Quân nhân
  async loadUsers(fallback: User[]): Promise<User[]> {
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
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertUser(user);
    }
  },

  async deleteUser(userId: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteUser(userId);
    }
  },

  // Documents
  async loadDocuments(fallback: DocumentItem[]): Promise<DocumentItem[]> {
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
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertDocument(doc);
    }
  },

  async deleteDocument(docId: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteDocument(docId);
    }
  },

  // Lectures
  async loadLectures(fallback: LectureItem[]): Promise<LectureItem[]> {
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
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertLecture(lecture);
    }
  },

  async deleteLecture(lectureId: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteLecture(lectureId);
    }
  },

  // Meeting Votes
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

  // Meeting Documents
  async loadMeetingDocuments(fallback: MeetingDocumentItem[]): Promise<MeetingDocumentItem[]> {
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
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertMeetingDocument(doc);
    }
  },

  async deleteMeetingDocument(docId: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.deleteMeetingDocument(docId);
    }
  },

  // Meeting Settings & Password
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

  // Multi-Meeting Rooms (up to 30 rooms)
  async loadMeetingRooms(fallback: MeetingRoomItem[]): Promise<MeetingRoomItem[]> {
    return safeStore.get('mangyang_meeting_rooms', fallback);
  },

  async saveMeetingRooms(rooms: MeetingRoomItem[]): Promise<void> {
    safeStore.set('mangyang_meeting_rooms', rooms.slice(0, 30));
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
    return updated;
  },

  async deleteMeetingRoom(roomId: string, currentRooms?: MeetingRoomItem[]): Promise<MeetingRoomItem[]> {
    const list = currentRooms || safeStore.get('mangyang_meeting_rooms', []);
    const updated = list.filter((r: MeetingRoomItem) => r.id !== roomId);
    safeStore.set('mangyang_meeting_rooms', updated);
    return updated;
  },

  // Site Config
  async loadSiteConfig(fallback: SiteConfig): Promise<SiteConfig> {
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
    if (isSupabaseConfigured()) {
      await supabaseDb.upsertSiteConfig(config);
    }
  },

  // Uncle Ho Quotes & Settings
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
};
