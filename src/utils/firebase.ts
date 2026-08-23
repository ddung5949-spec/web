import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
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

// Load config from firebase-applet-config.json or environment variables
let firebaseConfig: Record<string, string> = {};

try {
  // Try importing or falling back
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBL4KnlyJtCUl7qcMdZP1GF6Pm8iT9KjM4',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'modern-program-0q6d2.firebaseapp.com',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'modern-program-0q6d2',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'modern-program-0q6d2.firebasestorage.app',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1081328282123',
    appId: env.VITE_FIREBASE_APP_ID || '1:1081328282123:web:b0b79acac086148218f50e',
    firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-web95-e6373b51-4fa1-45e9-beb6-22404ec54f93',
  };
} catch {
  // Fallback
}

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (appInstance) return appInstance;
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(firebaseConfig);
    }
    return appInstance;
  } catch (e) {
    console.warn('Firebase init error:', e);
    return null;
  }
}

export function getFirebaseDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const dbId = firebaseConfig.firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      firestoreInstance = getFirestore(app, dbId);
    } else {
      firestoreInstance = getFirestore(app);
    }
    return firestoreInstance;
  } catch (e) {
    console.warn('Firestore init error:', e);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    authInstance = getAuth(app);
    return authInstance;
  } catch (e) {
    console.warn('Firebase Auth init error:', e);
    return null;
  }
}

// Helper to recursively strip undefined properties before sending to Firestore
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

/* =========================================================================
   FIRESTORE DATABASE SERVICES
   ========================================================================= */

export const firestoreDb = {
  // -------------------------------------------------------------
  // 1. HỒ SƠ QUÂN NHÂN & TÀI KHOẢN (Collection: users)
  // -------------------------------------------------------------
  async fetchUsers(): Promise<User[] | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'users');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const list: User[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        list.push({
          id: Number(d.id ?? docSnap.id),
          username: d.username,
          password: d.password,
          fullName: d.fullName,
          birthDate: d.birthDate || '',
          rank: d.rank || '',
          position: d.position || '',
          rankUnit: d.rankUnit,
          avatar: d.avatar,
          role: d.role,
          canViewDoc: d.canViewDoc ?? true,
          canUploadDoc: d.canUploadDoc ?? false,
          canJoinPartyMeeting: d.canJoinPartyMeeting ?? false,
          canUploadMeetingDoc: d.canUploadMeetingDoc ?? (d.role === 'admin'),
          canDeleteMeetingDoc: d.canDeleteMeetingDoc ?? (d.role === 'admin'),
        });
      });
      return list.sort((a, b) => a.id - b.id);
    } catch (err) {
      console.warn('Firestore fetchUsers error:', err);
      return null;
    }
  },

  async upsertUser(user: User): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'users', String(user.id));
      await setDoc(docRef, cleanForFirestore({ ...user }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertUser error:', err);
      return false;
    }
  },

  async deleteUser(userId: number): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'users', String(userId));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore deleteUser error:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 2. BÀI VIẾT & TIN TỨC (Collection: articles)
  // -------------------------------------------------------------
  async fetchArticles(): Promise<Article[] | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'articles');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const list: Article[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        list.push({
          id: Number(d.id ?? docSnap.id),
          title: d.title || '',
          category: d.category || '',
          author: d.author || '',
          date: d.date || '',
          image: d.image || '',
          images: Array.isArray(d.images) ? d.images : undefined,
          excerpt: d.excerpt || '',
          content: d.content || '',
          embedCode: d.embedCode || undefined,
          status: d.status === 'pending' ? 'pending' : 'approved',
          views: d.views || 0,
          sectionKey: d.sectionKey || d.section_key || 'ctd',
        });
      });
      return list.sort((a, b) => b.id - a.id);
    } catch (err) {
      console.warn('Firestore fetchArticles error:', err);
      return null;
    }
  },

  subscribeArticles(onUpdate: (articles: Article[]) => void): Unsubscribe | null {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'articles');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: Article[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data() as any;
            list.push({
              id: Number(d.id ?? docSnap.id),
              title: d.title || '',
              category: d.category || '',
              author: d.author || '',
              date: d.date || '',
              image: d.image || '',
              images: Array.isArray(d.images) ? d.images : undefined,
              excerpt: d.excerpt || '',
              content: d.content || '',
              embedCode: d.embedCode || undefined,
              status: d.status === 'pending' ? 'pending' : 'approved',
              views: d.views || 0,
              sectionKey: d.sectionKey || d.section_key || 'ctd',
            });
          });
          const sorted = list.sort((a, b) => b.id - a.id);
          onUpdate(sorted);
        },
        (error) => {
          console.warn('Firestore real-time articles listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeArticles error:', err);
      return null;
    }
  },

  async upsertArticle(article: Article): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'articles', String(article.id));
      await setDoc(docRef, cleanForFirestore({ ...article }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertArticle error:', err);
      return false;
    }
  },

  async deleteArticle(articleId: number): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'articles', String(articleId));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore deleteArticle error:', err);
      return false;
    }
  },

  async incrementArticleViews(articleId: number, currentViews: number): Promise<void> {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const docRef = doc(db, 'articles', String(articleId));
      await updateDoc(docRef, { views: (currentViews || 0) + 1 });
    } catch (err) {
      console.warn('Firestore incrementArticleViews error:', err);
    }
  },

  // -------------------------------------------------------------
  // 3. KHO VĂN BẢN (Collection: documents)
  // -------------------------------------------------------------
  async fetchDocuments(): Promise<DocumentItem[] | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'documents');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const list: DocumentItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        list.push({
          id: Number(d.id ?? docSnap.id),
          code: d.code || '',
          title: d.title || '',
          category: d.category || '',
          issuer: d.issuer || '',
          date: d.date || '',
          type: d.type || 'pdf',
          description: d.description || undefined,
          fileName: d.fileName || d.filename || undefined,
          fileSize: d.fileSize || d.filesize || undefined,
          fileUrl: d.fileUrl || d.file_url || undefined,
          downloads: d.downloads || 0,
          secretLevel: d.secretLevel || d.secret_level || 'normal',
        });
      });
      return list.sort((a, b) => b.id - a.id);
    } catch (err) {
      console.warn('Firestore fetchDocuments error:', err);
      return null;
    }
  },

  subscribeDocuments(onUpdate: (documents: DocumentItem[]) => void): Unsubscribe | null {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'documents');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: DocumentItem[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data() as any;
            list.push({
              id: Number(d.id ?? docSnap.id),
              code: d.code || '',
              title: d.title || '',
              category: d.category || '',
              issuer: d.issuer || '',
              date: d.date || '',
              type: d.type || 'pdf',
              description: d.description || undefined,
              fileName: d.fileName || d.filename || undefined,
              fileSize: d.fileSize || d.filesize || undefined,
              fileUrl: d.fileUrl || d.file_url || undefined,
              downloads: d.downloads || 0,
              secretLevel: d.secretLevel || d.secret_level || 'normal',
            });
          });
          onUpdate(list.sort((a, b) => b.id - a.id));
        },
        (error) => {
          console.warn('Firestore real-time documents listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeDocuments error:', err);
      return null;
    }
  },

  async upsertDocument(documentItem: DocumentItem): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'documents', String(documentItem.id));
      await setDoc(docRef, cleanForFirestore({ ...documentItem }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertDocument error:', err);
      return false;
    }
  },

  async deleteDocument(docId: number): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'documents', String(docId));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore deleteDocument error:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 4. BÀI GIẢNG ĐIỆN TỬ (Collection: lectures)
  // -------------------------------------------------------------
  async fetchLectures(): Promise<LectureItem[] | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'lectures');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const list: LectureItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as any;
        list.push({
          id: Number(d.id ?? docSnap.id),
          title: d.title || '',
          target: d.target || '',
          author: d.author || '',
          desc: d.desc || '',
          date: d.date || '',
          fileType: d.fileType || 'powerpoint',
          fileName: d.fileName || '',
          fileSize: d.fileSize || '',
          fileUrl: d.fileUrl || '',
          downloads: d.downloads || 0,
        });
      });
      return list.sort((a, b) => b.id - a.id);
    } catch (err) {
      console.warn('Firestore fetchLectures error:', err);
      return null;
    }
  },

  subscribeLectures(onUpdate: (lectures: LectureItem[]) => void): Unsubscribe | null {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'lectures');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: LectureItem[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data() as any;
            list.push({
              id: Number(d.id ?? docSnap.id),
              title: d.title || '',
              target: d.target || '',
              author: d.author || '',
              desc: d.desc || '',
              date: d.date || '',
              fileType: d.fileType || 'powerpoint',
              fileName: d.fileName || '',
              fileSize: d.fileSize || '',
              fileUrl: d.fileUrl || '',
              downloads: d.downloads || 0,
            });
          });
          onUpdate(list.sort((a, b) => b.id - a.id));
        },
        (error) => {
          console.warn('Firestore real-time lectures listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeLectures error:', err);
      return null;
    }
  },

  async upsertLecture(lecture: LectureItem): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'lectures', String(lecture.id));
      await setDoc(docRef, cleanForFirestore({ ...lecture }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertLecture error:', err);
      return false;
    }
  },

  async deleteLecture(lectureId: number): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'lectures', String(lectureId));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore deleteLecture error:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 5. CẤU HÌNH GIAO DIỆN (Collection: configs, Doc: site_config)
  // -------------------------------------------------------------
  async fetchSiteConfig(): Promise<SiteConfig | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const docRef = doc(db, 'configs', 'site_config');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docSnap.data() as SiteConfig;
    } catch (err) {
      console.warn('Firestore fetchSiteConfig error:', err);
      return null;
    }
  },

  subscribeSiteConfig(onUpdate: (config: SiteConfig) => void): Unsubscribe | null {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const docRef = doc(db, 'configs', 'site_config');
      return onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            onUpdate(docSnap.data() as SiteConfig);
          }
        },
        (error) => {
          console.warn('Firestore real-time site_config listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeSiteConfig error:', err);
      return null;
    }
  },

  async upsertSiteConfig(config: SiteConfig): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'configs', 'site_config');
      await setDoc(docRef, cleanForFirestore({ ...config }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertSiteConfig error:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 6. PHÒNG HỌP & TÀI LIỆU CUỘC HỌP (Collection: meeting_rooms, meeting_docs)
  // -------------------------------------------------------------
  async fetchMeetingRooms(): Promise<MeetingRoomItem[] | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'meeting_rooms');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const list: MeetingRoomItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as MeetingRoomItem);
      });
      return list;
    } catch (err) {
      console.warn('Firestore fetchMeetingRooms error:', err);
      return null;
    }
  },

  subscribeMeetingRooms(onUpdate: (rooms: MeetingRoomItem[]) => void): Unsubscribe | null {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'meeting_rooms');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: MeetingRoomItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as MeetingRoomItem);
          });
          onUpdate(list);
        },
        (error) => {
          console.warn('Firestore real-time meeting_rooms listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeMeetingRooms error:', err);
      return null;
    }
  },

  async upsertMeetingRoom(room: MeetingRoomItem): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'meeting_rooms', room.id);
      await setDoc(docRef, cleanForFirestore({ ...room }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertMeetingRoom error:', err);
      return false;
    }
  },

  async deleteMeetingRoom(roomId: string): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'meeting_rooms', roomId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore deleteMeetingRoom error:', err);
      return false;
    }
  },

  async fetchMeetingDocuments(): Promise<MeetingDocumentItem[] | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'meeting_documents');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      const list: MeetingDocumentItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as MeetingDocumentItem);
      });
      return list.sort((a, b) => a.id - b.id);
    } catch (err) {
      console.warn('Firestore fetchMeetingDocuments error:', err);
      return null;
    }
  },

  subscribeMeetingDocuments(onUpdate: (docs: MeetingDocumentItem[]) => void): Unsubscribe | null {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const colRef = collection(db, 'meeting_documents');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: MeetingDocumentItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as MeetingDocumentItem);
          });
          onUpdate(list.sort((a, b) => a.id - b.id));
        },
        (error) => {
          console.warn('Firestore real-time meeting_documents listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeMeetingDocuments error:', err);
      return null;
    }
  },

  async upsertMeetingDocument(docItem: MeetingDocumentItem): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'meeting_documents', String(docItem.id));
      await setDoc(docRef, cleanForFirestore({ ...docItem }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertMeetingDocument error:', err);
      return false;
    }
  },

  async deleteMeetingDocument(docId: number): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'meeting_documents', String(docId));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firestore deleteMeetingDocument error:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 7. LỜI BÁC DẠY & CẤU HÌNH BÁC HỒ
  // -------------------------------------------------------------
  async fetchUncleHoQuotes(): Promise<UncleHoQuote[] | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const docRef = doc(db, 'configs', 'uncle_ho_quotes');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return (data?.quotes as UncleHoQuote[]) || [];
    } catch (err) {
      console.warn('Firestore fetchUncleHoQuotes error:', err);
      return null;
    }
  },

  async upsertUncleHoQuotes(quotes: UncleHoQuote[]): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'configs', 'uncle_ho_quotes');
      await setDoc(docRef, cleanForFirestore({ quotes, updatedAt: Date.now() }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertUncleHoQuotes error:', err);
      return false;
    }
  },

  async fetchUncleHoSettings(): Promise<UncleHoSettings | null> {
    const db = getFirebaseDb();
    if (!db) return null;
    try {
      const docRef = doc(db, 'configs', 'uncle_ho_settings');
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return (docSnap.data() as UncleHoSettings) || null;
    } catch (err) {
      console.warn('Firestore fetchUncleHoSettings error:', err);
      return null;
    }
  },

  async upsertUncleHoSettings(settings: UncleHoSettings): Promise<boolean> {
    const db = getFirebaseDb();
    if (!db) return false;
    try {
      const docRef = doc(db, 'configs', 'uncle_ho_settings');
      await setDoc(docRef, cleanForFirestore({ ...settings, updatedAt: Date.now() }), { merge: true });
      return true;
    } catch (err) {
      console.warn('Firestore upsertUncleHoSettings error:', err);
      return false;
    }
  },
};
