/**
 * Firebase has been completely disabled per architectural guidelines.
 * All application persistence, realtime subscriptions, and document storage
 * are handled exclusively by Supabase.
 */

export const isFirebaseConfigured = (): boolean => false;

export const firestoreDb = {
  fetchUsers: async () => null,
  upsertUser: async () => false,
  deleteUser: async () => false,
  fetchArticles: async () => null,
  upsertArticle: async () => false,
  deleteArticle: async () => false,
  incrementArticleViews: async () => {},
  fetchDocuments: async () => null,
  upsertDocument: async () => false,
  deleteDocument: async () => false,
  fetchLectures: async () => null,
  upsertLecture: async () => false,
  deleteLecture: async () => false,
  fetchUncleHoQuotes: async () => null,
  upsertUncleHoQuote: async () => false,
  deleteUncleHoQuote: async () => false,
  fetchUncleHoSettings: async () => null,
  saveUncleHoSettings: async () => false,
  fetchSiteConfig: async () => null,
  saveSiteConfig: async () => false,
  fetchMeetingRooms: async () => null,
  upsertMeetingRoom: async () => false,
  deleteMeetingRoom: async () => false,
  fetchMeetingDocuments: async () => null,
  upsertMeetingDocument: async () => false,
  deleteMeetingDocument: async () => false,
  fetchMeetingSettings: async () => null,
  saveMeetingSettings: async () => false,
  fetchMeetingVotes: async () => ({}),
  castVote: async () => false,
  subscribeArticles: () => () => {},
  subscribeDocuments: () => () => {},
  subscribeLectures: () => () => {},
  subscribeMeetingRooms: () => () => {},
  subscribeMeetingDocuments: () => () => {},
  subscribeSiteConfig: () => () => {},
  subscribeAllChanges: () => () => {},
};

export const getFirebaseApp = () => null;
export const getFirebaseDb = () => null;
export const getFirebaseAuth = () => null;
