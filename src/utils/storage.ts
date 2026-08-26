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
  RoomPresenceItem,
  CollabDocData,
  RoomBroadcastAction,
} from '../types';

// Synchronous local storage caching (solely for instant offline cache and snappy UI rendering)
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

// Database-First Cloud Storage Manager connecting Supabase & Firestore
export const cloudStorage = {
  // Check whether cloud sync is active
  isCloudActive: () => isSupabaseConfigured() || isFirebaseConfigured(),

  // =========================================================================
  // 1. ARTICLES & TIN TỨC (DATABASE-FIRST)
  // =========================================================================
  async loadArticles(fallback: Article[]): Promise<Article[]> {
    // 1. Primary: Supabase
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchArticles();
        if (remote !== null) {
          safeStore.set('mangyang_articles', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadArticles error:', e);
      }
    }

    // 2. Secondary: Firestore
    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchArticles();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_articles', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadArticles error:', e);
      }
    }

    return safeStore.get('mangyang_articles', fallback);
  },

  async saveArticle(article: Article): Promise<{ success: boolean; error?: string }> {
    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertArticle(article);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu vào Supabase';
    }

    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.upsertArticle(article);
      if (fbRes) saved = true;
    }

    // Update local cache
    const currentList = safeStore.get<Article[]>('mangyang_articles', []);
    const existsIdx = currentList.findIndex((a) => a.id === article.id);
    let updatedList: Article[];
    if (existsIdx >= 0) {
      updatedList = currentList.map((a) => (a.id === article.id ? article : a));
    } else {
      updatedList = [article, ...currentList];
    }
    safeStore.set('mangyang_articles', updatedList);

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg || 'Lỗi lưu bài viết vào Cơ sở dữ liệu' };
  },

  async deleteArticle(articleId: number): Promise<{ success: boolean; error?: string }> {
    let deleted = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteArticle(articleId);
      if (res.success) deleted = true;
      else errorMsg = res.error || 'Lỗi xóa khỏi Supabase';
    }

    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.deleteArticle(articleId);
      if (fbRes) deleted = true;
    }

    const currentList = safeStore.get<Article[]>('mangyang_articles', []);
    const filtered = currentList.filter((a) => a.id !== articleId);
    safeStore.set('mangyang_articles', filtered);

    if (deleted || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg || 'Lỗi khi xóa bài viết' };
  },

  async incrementViews(articleId: number, currentViews: number): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseDb.incrementArticleViews(articleId, currentViews);
    }
    if (isFirebaseConfigured()) {
      await firestoreDb.incrementArticleViews(articleId, currentViews);
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

    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchUsers();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_users', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadUsers error:', e);
      }
    }

    return safeStore.get('mangyang_users', fallback);
  },

  async saveUser(user: User): Promise<{ success: boolean; error?: string }> {
    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertUser(user);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu tài khoản';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.upsertUser(user);
      if (fbRes) saved = true;
    }

    const currentList = safeStore.get<User[]>('mangyang_users', []);
    const exists = currentList.some((u) => u.id === user.id);
    const updated = exists
      ? currentList.map((u) => (u.id === user.id ? user : u))
      : [user, ...currentList];
    safeStore.set('mangyang_users', updated);

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  async deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
    let deleted = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteUser(userId);
      if (res.success) deleted = true;
      else errorMsg = res.error || 'Lỗi xóa tài khoản';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.deleteUser(userId);
      if (fbRes) deleted = true;
    }

    const currentList = safeStore.get<User[]>('mangyang_users', []);
    const updated = currentList.filter((u) => u.id !== userId);
    safeStore.set('mangyang_users', updated);

    if (deleted || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  // =========================================================================
  // 3. DOCUMENTS / VĂN BẢN
  // =========================================================================
  async loadDocuments(fallback: DocumentItem[]): Promise<DocumentItem[]> {
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

    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchDocuments();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_documents', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadDocuments error:', e);
      }
    }

    return safeStore.get('mangyang_documents', fallback);
  },

  async saveDocument(doc: DocumentItem): Promise<{ success: boolean; error?: string }> {
    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertDocument(doc);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu văn bản vào Supabase';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.upsertDocument(doc);
      if (fbRes) saved = true;
    }

    const currentList = safeStore.get<DocumentItem[]>('mangyang_documents', []);
    const exists = currentList.some((d) => d.id === doc.id);
    const updatedList = exists
      ? currentList.map((d) => (d.id === doc.id ? doc : d))
      : [doc, ...currentList];
    safeStore.set('mangyang_documents', updatedList);

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  async deleteDocument(docId: number): Promise<{ success: boolean; error?: string }> {
    let deleted = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteDocument(docId);
      if (res.success) deleted = true;
      else errorMsg = res.error || 'Lỗi xóa văn bản khỏi Supabase';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.deleteDocument(docId);
      if (fbRes) deleted = true;
    }

    const currentList = safeStore.get<DocumentItem[]>('mangyang_documents', []);
    const filtered = currentList.filter((d) => d.id !== docId);
    safeStore.set('mangyang_documents', filtered);

    if (deleted || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  // =========================================================================
  // 4. LECTURES / BÀI GIẢNG ĐIỆN TỬ
  // =========================================================================
  async loadLectures(fallback: LectureItem[]): Promise<LectureItem[]> {
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

    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchLectures();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_lectures', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadLectures error:', e);
      }
    }

    return safeStore.get('mangyang_lectures', fallback);
  },

  async saveLecture(lecture: LectureItem): Promise<{ success: boolean; error?: string }> {
    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertLecture(lecture);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu bài giảng vào Supabase';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.upsertLecture(lecture);
      if (fbRes) saved = true;
    }

    const currentList = safeStore.get<LectureItem[]>('mangyang_lectures', []);
    const exists = currentList.some((l) => l.id === lecture.id);
    const updatedList = exists
      ? currentList.map((l) => (l.id === lecture.id ? lecture : l))
      : [lecture, ...currentList];
    safeStore.set('mangyang_lectures', updatedList);

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  async deleteLecture(lectureId: number): Promise<{ success: boolean; error?: string }> {
    let deleted = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteLecture(lectureId);
      if (res.success) deleted = true;
      else errorMsg = res.error || 'Lỗi xóa bài giảng';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.deleteLecture(lectureId);
      if (fbRes) deleted = true;
    }

    const currentList = safeStore.get<LectureItem[]>('mangyang_lectures', []);
    const filtered = currentList.filter((l) => l.id !== lectureId);
    safeStore.set('mangyang_lectures', filtered);

    if (deleted || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  // =========================================================================
  // 5. MEETING VOTES
  // =========================================================================
  async loadMeetingVotes(fallback: Record<number, MeetingVote>): Promise<Record<number, MeetingVote>> {
    if (isSupabaseConfigured()) {
      const remote = await supabaseDb.fetchMeetingVotes();
      if (remote !== null) {
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
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchMeetingDocuments();
        if (remote !== null) {
          safeStore.set('mangyang_meeting_docs', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadMeetingDocuments error:', e);
      }
    }

    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchMeetingDocuments();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_meeting_docs', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadMeetingDocuments error:', e);
      }
    }

    return safeStore.get('mangyang_meeting_docs', fallback);
  },

  async saveMeetingDocument(doc: MeetingDocumentItem): Promise<{ success: boolean; error?: string }> {
    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertMeetingDocument(doc);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu tài liệu phòng họp';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.upsertMeetingDocument(doc);
      if (fbRes) saved = true;
    }

    const currentList = safeStore.get<MeetingDocumentItem[]>('mangyang_meeting_docs', []);
    const exists = currentList.some((d) => d.id === doc.id);
    const updated = exists ? currentList.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...currentList];
    safeStore.set('mangyang_meeting_docs', updated);

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  async deleteMeetingDocument(docId: number): Promise<{ success: boolean; error?: string }> {
    let deleted = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteMeetingDocument(docId);
      if (res.success) deleted = true;
      else errorMsg = res.error || 'Lỗi xóa tài liệu họp';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.deleteMeetingDocument(docId);
      if (fbRes) deleted = true;
    }

    const currentList = safeStore.get<MeetingDocumentItem[]>('mangyang_meeting_docs', []);
    const updated = currentList.filter((d) => d.id !== docId);
    safeStore.set('mangyang_meeting_docs', updated);

    if (deleted || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  // =========================================================================
  // 7. MEETING SETTINGS & PASSWORD
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
    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertMeetingSettings(settings);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu cấu hình phòng họp';
    }

    safeStore.set('mangyang_meeting_settings', settings);

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  // =========================================================================
  // 8. MULTI-MEETING ROOMS
  // =========================================================================
  async loadMeetingRooms(fallback: MeetingRoomItem[]): Promise<MeetingRoomItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await supabaseDb.fetchMeetingRooms();
        if (remote !== null) {
          safeStore.set('mangyang_meeting_rooms', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Supabase loadMeetingRooms error:', e);
      }
    }

    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchMeetingRooms();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_meeting_rooms', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadMeetingRooms error:', e);
      }
    }

    return safeStore.get('mangyang_meeting_rooms', fallback);
  },

  async saveMeetingRooms(rooms: MeetingRoomItem[]): Promise<void> {
    safeStore.set('mangyang_meeting_rooms', rooms.slice(0, 30));
    if (isSupabaseConfigured()) {
      rooms.forEach((r) => supabaseDb.upsertMeetingRoom(r));
    }
    if (isFirebaseConfigured()) {
      rooms.forEach((r) => firestoreDb.upsertMeetingRoom(r));
    }
  },

  async saveMeetingRoom(room: MeetingRoomItem, currentRooms?: MeetingRoomItem[]): Promise<{ success: boolean; error?: string; updatedRooms: MeetingRoomItem[] }> {
    const list = currentRooms || safeStore.get('mangyang_meeting_rooms', []);
    const exists = list.some((r: MeetingRoomItem) => r.id === room.id);
    let updated: MeetingRoomItem[];
    if (exists) {
      updated = list.map((r: MeetingRoomItem) => (r.id === room.id ? room : r));
    } else {
      updated = [room, ...list].slice(0, 30);
    }
    safeStore.set('mangyang_meeting_rooms', updated);

    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertMeetingRoom(room);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu phòng họp';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.upsertMeetingRoom(room);
      if (fbRes) saved = true;
    }

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true, updatedRooms: updated };
    }
    return { success: false, error: errorMsg, updatedRooms: updated };
  },

  async deleteMeetingRoom(roomId: string, currentRooms?: MeetingRoomItem[]): Promise<{ success: boolean; error?: string; updatedRooms: MeetingRoomItem[] }> {
    const list = currentRooms || safeStore.get('mangyang_meeting_rooms', []);
    const updated = list.filter((r: MeetingRoomItem) => r.id !== roomId);
    safeStore.set('mangyang_meeting_rooms', updated);

    let deleted = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.deleteMeetingRoom(roomId);
      if (res.success) deleted = true;
      else errorMsg = res.error || 'Lỗi xóa phòng họp';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.deleteMeetingRoom(roomId);
      if (fbRes) deleted = true;
    }

    if (deleted || !cloudStorage.isCloudActive()) {
      return { success: true, updatedRooms: updated };
    }
    return { success: false, error: errorMsg, updatedRooms: updated };
  },

  // =========================================================================
  // 8.1. REAL-TIME COLLABORATIVE PRESENCE & LIVE SYNC (Firebase/Supabase)
  // =========================================================================
  subscribeRoomPresence(roomId: string, onUpdate: (presenceList: RoomPresenceItem[]) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      return firestoreDb.subscribeRoomPresence(roomId, onUpdate);
    }
    return null;
  },

  async updateRoomPresence(presence: RoomPresenceItem): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.updateRoomPresence(presence);
    }
  },

  async removeRoomPresence(roomId: string, userId: number): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.removeRoomPresence(roomId, userId);
    }
  },

  subscribeCollabDoc(roomId: string, docId: number, onUpdate: (docData: CollabDocData) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      return firestoreDb.subscribeCollabDoc(roomId, docId, onUpdate);
    }
    return null;
  },

  async saveCollabDoc(roomId: string, docId: number, docData: Partial<CollabDocData>): Promise<void> {
    const key = `collab_doc_${roomId}_${docId}`;
    safeStore.set(key, docData);
    if (isFirebaseConfigured()) {
      await firestoreDb.upsertCollabDoc(roomId, docId, docData);
    }
  },

  subscribeRoomActions(roomId: string, onUpdate: (actions: RoomBroadcastAction[]) => void): (() => void) | null {
    if (isFirebaseConfigured()) {
      return firestoreDb.subscribeRoomActions(roomId, onUpdate);
    }
    return null;
  },

  async broadcastRoomAction(action: RoomBroadcastAction): Promise<void> {
    if (isFirebaseConfigured()) {
      await firestoreDb.broadcastRoomAction(action);
    }
  },

  // =========================================================================
  // 9. SITE CONFIG
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

    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchSiteConfig();
        if (remote !== null) {
          safeStore.set('mangyang_site_config', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadSiteConfig error:', e);
      }
    }

    return safeStore.get('mangyang_site_config', fallback);
  },

  async saveSiteConfig(config: SiteConfig): Promise<{ success: boolean; error?: string }> {
    let saved = false;
    let errorMsg = '';

    if (isSupabaseConfigured()) {
      const res = await supabaseDb.upsertSiteConfig(config);
      if (res.success) saved = true;
      else errorMsg = res.error || 'Lỗi lưu cấu hình vào Supabase';
    }
    if (isFirebaseConfigured()) {
      const fbRes = await firestoreDb.upsertSiteConfig(config);
      if (fbRes) saved = true;
    }

    safeStore.set('mangyang_site_config', config);

    if (saved || !cloudStorage.isCloudActive()) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  },

  // =========================================================================
  // 10. UNCLE HO QUOTES & SETTINGS
  // =========================================================================
  async loadUncleHoQuotes(fallback: UncleHoQuote[]): Promise<UncleHoQuote[]> {
    if (isFirebaseConfigured()) {
      try {
        const remote = await firestoreDb.fetchUncleHoQuotes();
        if (remote !== null && remote.length > 0) {
          safeStore.set('mangyang_uncle_ho_quotes', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadUncleHoQuotes error:', e);
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
      try {
        const remote = await firestoreDb.fetchUncleHoSettings();
        if (remote !== null) {
          safeStore.set('mangyang_uncle_ho_settings', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore loadUncleHoSettings error:', e);
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

  // =========================================================================
  // 11. GLOBAL REALTIME SUBSCRIPTION (SUPABASE & FIRESTORE)
  // =========================================================================
  subscribeAll(callbacks: {
    onArticlesChange?: (articles: Article[]) => void;
    onDocumentsChange?: (docs: DocumentItem[]) => void;
    onLecturesChange?: (lectures: LectureItem[]) => void;
    onMeetingSettingsChange?: (settings: MeetingRoomSettings) => void;
    onMeetingDocumentsChange?: (docs: MeetingDocumentItem[]) => void;
    onMeetingRoomsChange?: (rooms: MeetingRoomItem[]) => void;
    onSiteConfigChange?: (config: SiteConfig) => void;
    onUsersChange?: (users: User[]) => void;
  }): (() => void) | null {
    const unsubs: Array<(() => void) | null> = [];

    if (isSupabaseConfigured()) {
      const unsubSupa = supabaseDb.subscribeAllChanges(callbacks);
      if (unsubSupa) unsubs.push(unsubSupa);
    }

    if (isFirebaseConfigured()) {
      if (callbacks.onArticlesChange) unsubs.push(firestoreDb.subscribeArticles(callbacks.onArticlesChange));
      if (callbacks.onDocumentsChange) unsubs.push(firestoreDb.subscribeDocuments(callbacks.onDocumentsChange));
      if (callbacks.onLecturesChange) unsubs.push(firestoreDb.subscribeLectures(callbacks.onLecturesChange));
      if (callbacks.onMeetingRoomsChange) unsubs.push(firestoreDb.subscribeMeetingRooms(callbacks.onMeetingRoomsChange));
      if (callbacks.onMeetingDocumentsChange) unsubs.push(firestoreDb.subscribeMeetingDocuments(callbacks.onMeetingDocumentsChange));
      if (callbacks.onSiteConfigChange) unsubs.push(firestoreDb.subscribeSiteConfig(callbacks.onSiteConfigChange));
    }

    return () => {
      unsubs.forEach((u) => {
        if (u) {
          try {
            u();
          } catch (e) {
            // ignore
          }
        }
      });
    };
  },
};
