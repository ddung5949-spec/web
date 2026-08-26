import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Article, DocumentItem, LectureItem, MeetingVote, SiteConfig, User } from '../types';

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

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Lỗi khởi tạo Supabase Client:', err);
      return null;
    }
  }
  return clientInstance;
};

/* =========================================================================
   SUPABASE DATABASE SERVICES (Bài viết, Quân nhân / Người dùng, Tài liệu...)
   ========================================================================= */

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

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data.map((item) => ({
        id: item.id,
        username: item.username,
        password: item.password,
        fullName: item.full_name || item.fullName,
        birthDate: item.birth_date || item.birthDate || '',
        rank: item.rank || '',
        position: item.position || '',
        rankUnit: item.rank_unit || item.rankUnit,
        avatar: item.avatar,
        role: item.role,
        canViewDoc: item.can_view_doc ?? item.canViewDoc ?? true,
        canUploadDoc: item.can_upload_doc ?? item.canUploadDoc ?? false,
        canJoinPartyMeeting: item.can_join_party_meeting ?? item.canJoinPartyMeeting ?? false,
        canUploadMeetingDoc: item.can_upload_meeting_doc ?? item.canUploadMeetingDoc ?? (item.role === 'admin'),
        canDeleteMeetingDoc: item.can_delete_meeting_doc ?? item.canDeleteMeetingDoc ?? (item.role === 'admin'),
      }));
    } catch (err) {
      console.warn('Supabase fetchUsers failed:', err);
      return null;
    }
  },

  async upsertUser(user: User): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        id: user.id,
        username: user.username,
        password: user.password,
        full_name: user.fullName,
        birth_date: user.birthDate || '',
        rank: user.rank || '',
        position: user.position || '',
        rank_unit: user.rankUnit,
        avatar: user.avatar || '',
        role: user.role,
        can_view_doc: user.canViewDoc,
        can_upload_doc: user.canUploadDoc,
        can_join_party_meeting: user.canJoinPartyMeeting,
        can_upload_meeting_doc: user.canUploadMeetingDoc,
        can_delete_meeting_doc: user.canDeleteMeetingDoc,
      };

      const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertUser failed:', err);
      return false;
    }
  },

  async deleteUser(userId: number): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteUser failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 2. BÀI VIẾT & TIN TỨC (Bảng: articles)
  // -------------------------------------------------------------
  async fetchArticles(): Promise<Article[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        author: item.author,
        date: item.date,
        image: item.image,
        excerpt: item.excerpt,
        content: item.content,
        status: item.status,
        views: item.views || 0,
        sectionKey: item.section_key || item.sectionKey,
      }));
    } catch (err) {
      console.warn('Supabase fetchArticles failed:', err);
      return null;
    }
  },

  async upsertArticle(article: Article): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        id: article.id,
        title: article.title,
        category: article.category,
        author: article.author,
        date: article.date,
        image: article.image || '',
        excerpt: article.excerpt,
        content: article.content,
        status: article.status,
        views: article.views || 0,
        section_key: article.sectionKey,
      };

      const { error } = await supabase.from('articles').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertArticle failed:', err);
      return false;
    }
  },

  async deleteArticle(articleId: number): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('articles').delete().eq('id', articleId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteArticle failed:', err);
      return false;
    }
  },

  async incrementArticleViews(articleId: number, currentViews: number): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase
        .from('articles')
        .update({ views: currentViews + 1 })
        .eq('id', articleId);
    } catch (err) {
      console.warn('Supabase incrementArticleViews failed:', err);
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

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data.map((item) => ({
        id: item.id,
        code: item.code,
        title: item.title,
        category: item.category,
        issuer: item.issuer,
        date: item.date,
        type: item.type,
        description: item.description || undefined,
        fileName: item.file_name || item.fileName || undefined,
        fileSize: item.file_size || item.fileSize || undefined,
        fileUrl: item.file_url || item.fileUrl || undefined,
        downloads: item.downloads || 0,
        secretLevel: item.secret_level || item.secretLevel || 'normal',
      }));
    } catch (err) {
      console.warn('Supabase fetchDocuments failed:', err);
      return null;
    }
  },

  async upsertDocument(doc: DocumentItem): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        id: doc.id,
        code: doc.code,
        title: doc.title,
        category: doc.category || '',
        issuer: doc.issuer,
        date: doc.date,
        type: doc.type,
        description: doc.description || '',
        file_name: doc.fileName || '',
        file_size: doc.fileSize || '',
        file_url: doc.fileUrl || '',
        downloads: doc.downloads || 0,
        secret_level: doc.secretLevel || 'normal',
      };

      const { error } = await supabase.from('documents').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertDocument failed:', err);
      return false;
    }
  },

  async deleteDocument(docId: number): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteDocument failed:', err);
      return false;
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

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data.map((item) => ({
        id: item.id,
        title: item.title,
        target: item.target,
        author: item.author,
        desc: item.desc,
        date: item.date,
        fileType: item.file_type || item.fileType || 'powerpoint',
        fileName: item.file_name || item.fileName || 'Tai_lieu_bai_giang.pptx',
        fileSize: item.file_size || item.fileSize || '10.5 MB',
        fileUrl: item.file_url || item.fileUrl || '',
        downloads: item.downloads || 0,
      }));
    } catch (err) {
      console.warn('Supabase fetchLectures failed:', err);
      return null;
    }
  },

  async upsertLecture(lecture: LectureItem): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        id: lecture.id,
        title: lecture.title,
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

      const { error } = await supabase.from('lectures').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertLecture failed:', err);
      return false;
    }
  },

  async deleteLecture(lectureId: number): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('lectures').delete().eq('id', lectureId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteLecture failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 5. BIỂU QUYẾT PHÒNG HỌP ĐẢNG ỦY (Bảng: meeting_votes)
  // -------------------------------------------------------------
  async fetchMeetingVotes(): Promise<Record<number, MeetingVote> | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('meeting_votes').select('*');
      if (error) throw error;
      if (!data) return null;

      const votesMap: Record<number, MeetingVote> = {};
      data.forEach((v) => {
        votesMap[v.user_id] = {
          userId: v.user_id,
          voterName: v.voter_name || v.voterName,
          rankUnit: v.rank_unit || v.rankUnit,
          choice: v.choice,
          time: v.time,
        };
      });
      return votesMap;
    } catch (err) {
      console.warn('Supabase fetchMeetingVotes failed:', err);
      return null;
    }
  },

  async upsertMeetingVote(vote: MeetingVote): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        user_id: vote.userId,
        voter_name: vote.voterName,
        rank_unit: vote.rankUnit,
        choice: vote.choice,
        time: vote.time,
      };

      const { error } = await supabase.from('meeting_votes').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertMeetingVote failed:', err);
      return false;
    }
  },

  async clearMeetingVotes(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('meeting_votes').delete().neq('user_id', 0);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase clearMeetingVotes failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 6. TÀI LIỆU PHÒNG HỌP ĐẢNG ỦY (Bảng: meeting_documents)
  // -------------------------------------------------------------
  async fetchMeetingDocuments(): Promise<any[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('meeting_documents')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data.map((item) => ({
        id: item.id,
        code: item.code || '',
        title: item.title,
        category: item.category || 'Nghị quyết',
        contentHtml: item.content_html || item.contentHtml || '',
        fileType: item.file_type || item.fileType || 'word',
        fileName: item.file_name || item.fileName || '',
        fileSize: item.file_size || item.fileSize || '',
        fileUrl: item.file_url || item.fileUrl || '',
        uploadedBy: item.uploaded_by || item.uploadedBy || 'Đảng ủy',
        date: item.date,
        isSecret: item.is_secret ?? item.isSecret ?? false,
      }));
    } catch (err) {
      console.warn('Supabase fetchMeetingDocuments failed (falling back to local cache):', err);
      return null;
    }
  },

  async upsertMeetingDocument(doc: any): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        id: doc.id,
        code: doc.code || '',
        title: doc.title,
        category: doc.category || 'Nghị quyết',
        content_html: doc.contentHtml || '',
        file_type: doc.fileType || 'word',
        file_name: doc.fileName || '',
        file_size: doc.fileSize || '',
        file_url: doc.fileUrl || '',
        uploaded_by: doc.uploadedBy || '',
        date: doc.date,
        is_secret: doc.isSecret ?? false,
      };

      const { error } = await supabase.from('meeting_documents').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertMeetingDocument failed:', err);
      return false;
    }
  },

  async deleteMeetingDocument(docId: number): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('meeting_documents').delete().eq('id', docId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteMeetingDocument failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 7. CẤU HÌNH PHÒNG HỌP & MẬT KHẨU (Bảng: meeting_settings)
  // -------------------------------------------------------------
  async fetchMeetingSettings(): Promise<any | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('meeting_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        passwordRequired: data.password_required ?? data.passwordRequired ?? true,
        roomPassword: data.room_password || data.roomPassword || '1945',
        meetingTitle: data.meeting_title || data.meetingTitle,
        meetingSessionNumber: data.meeting_session_number || data.meetingSessionNumber,
        chairPerson: data.chair_person || data.chairPerson,
        secretary: data.secretary,
      };
    } catch (err) {
      console.warn('Supabase fetchMeetingSettings failed:', err);
      return null;
    }
  },

  async upsertMeetingSettings(settings: any): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        id: 1,
        password_required: settings.passwordRequired,
        room_password: settings.roomPassword,
        meeting_title: settings.meetingTitle,
        meeting_session_number: settings.meetingSessionNumber,
        chair_person: settings.chairPerson,
        secretary: settings.secretary,
      };

      const { error } = await supabase.from('meeting_settings').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertMeetingSettings failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 8. TÙY BIẾN GIAO DIỆN HỆ THỐNG (Bảng: site_config)
  // -------------------------------------------------------------
  async fetchSiteConfig(): Promise<SiteConfig | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('site_config').select('config_json').eq('id', 1).single();
      if (error) throw error;
      if (data && data.config_json) {
        return typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json;
      }
      return null;
    } catch (err) {
      console.warn('Supabase fetchSiteConfig failed:', err);
      return null;
    }
  },

  async upsertSiteConfig(config: SiteConfig): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const payload = {
        id: 1,
        config_json: config,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('site_config').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase upsertSiteConfig failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // 9. REALTIME SUBSCRIPTIONS
  // -------------------------------------------------------------
  subscribeArticles(onUpdate: (articles: Article[]) => void): (() => void) | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const channel = supabase
        .channel('realtime_articles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, async () => {
          const fresh = await supabaseDb.fetchArticles();
          if (fresh && fresh.length > 0) {
            onUpdate(fresh);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Supabase subscribeArticles failed:', e);
      return null;
    }
  },

  subscribeDocuments(onUpdate: (docs: DocumentItem[]) => void): (() => void) | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const channel = supabase
        .channel('realtime_documents')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, async () => {
          const fresh = await supabaseDb.fetchDocuments();
          if (fresh && fresh.length > 0) {
            onUpdate(fresh);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Supabase subscribeDocuments failed:', e);
      return null;
    }
  },

  subscribeLectures(onUpdate: (lectures: LectureItem[]) => void): (() => void) | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const channel = supabase
        .channel('realtime_lectures')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lectures' }, async () => {
          const fresh = await supabaseDb.fetchLectures();
          if (fresh && fresh.length > 0) {
            onUpdate(fresh);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Supabase subscribeLectures failed:', e);
      return null;
    }
  },
};

