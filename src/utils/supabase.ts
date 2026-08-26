import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Article, DocumentItem, LectureItem, MeetingDocumentItem, MeetingRoomItem, MeetingRoomSettings, MeetingVote, SectionType, SiteConfig, User } from '../types';

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
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
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
   DATABASE-FIRST SUPABASE SERVICES (Tin bài, Văn bản, Bài giảng, Phòng họp...)
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
        avatar: item.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: item.role || 'user',
        canViewDoc: item.can_view_doc ?? item.canViewDoc ?? true,
        canUploadDoc: item.can_upload_doc ?? item.canUploadDoc ?? false,
        canJoinPartyMeeting: item.can_join_party_meeting ?? item.canJoinPartyMeeting ?? false,
        canUploadMeetingDoc: item.can_upload_meeting_doc ?? item.canUploadMeetingDoc ?? (item.role === 'admin'),
        canDeleteMeetingDoc: item.can_delete_meeting_doc ?? item.canDeleteMeetingDoc ?? (item.role === 'admin'),
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
        can_join_party_meeting: user.canJoinPartyMeeting,
        can_upload_meeting_doc: user.canUploadMeetingDoc,
        can_delete_meeting_doc: user.canDeleteMeetingDoc,
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
  async fetchArticles(): Promise<Article[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Helper to map DB row to Article with robust sectionKey and category detection
    const mapRowToArticle = (item: any): Article => {
      let secKey: SectionType = 'ctd';
      const rawSec = item.section_key || item.sectionKey || item.tab_type || item.tabType;
      if (rawSec === 'hl' || rawSec === 'huan_luyen') secKey = 'hl';
      else if (rawSec === 'bac' || rawSec === 'hoc_tap_bac' || rawSec === 'bac_ho') secKey = 'bac';
      else if (rawSec === 'ctd') secKey = 'ctd';
      else {
        // Fallback guess from category name if missing
        const cat = (item.category || '').toLowerCase();
        if (cat.includes('huấn luyện') || cat.includes('sẵn sàng') || cat.includes('thao trường') || cat.includes('khí tài')) {
          secKey = 'hl';
        } else if (cat.includes('bác') || cat.includes('hồ chí minh') || cat.includes('tư tưởng')) {
          secKey = 'bac';
        } else {
          secKey = 'ctd';
        }
      }

      return {
        id: Number(item.id),
        title: item.title || '',
        category: (item.category || 'Tin tức hoạt động').trim(),
        author: item.author || 'Cán bộ - Chiến sĩ',
        date: item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '26/08/2026'),
        image: item.image || item.thumbnail || '',
        images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : undefined,
        excerpt: item.excerpt || item.summary || '',
        summary: item.summary || item.excerpt || '',
        content: item.content || '',
        embedCode: item.embed_code || item.embedCode || undefined,
        status: (item.status === 'pending' || item.status === 'draft') ? 'pending' : 'approved',
        views: Number(item.views || 0),
        sectionKey: secKey,
      };
    };

    try {
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('id', { ascending: false });

      if (articlesError) {
        console.warn('Supabase fetchArticles from articles table error:', articlesError.message);
        return null;
      }

      if (articlesData) {
        return articlesData.map(mapRowToArticle);
      }
    } catch (e) {
      console.warn('Supabase fetchArticles failed:', e);
    }

    return null;
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
        // If error might be due to non-existent tab_type column, try upserting without tab_type
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

    try {
      await supabase.from('articles').update({ views: currentViews + 1 }).eq('id', articleId);
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

      if (error) {
        console.warn('Supabase fetchDocuments error:', error.message);
        return null;
      }
      if (!data) return null;

      return data.map((item: any) => ({
        id: Number(item.id),
        code: item.code || '',
        title: item.title || '',
        category: item.category || 'Văn bản chỉ đạo',
        issuer: item.issuer || 'Trung đoàn 95',
        date: item.date || '26/08/2026',
        type: item.type || 'Quyết định',
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
      const payload: any = {
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
      if (error) {
        console.error('Supabase upsertDocument error:', error);
        return { success: false, error: error.message };
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
        title: item.title || '',
        category: item.category || 'Giáo dục chính trị',
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
        title: lecture.title,
        category: lecture.category || 'Giáo dục chính trị',
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
  // 5. CẤU HÌNH PHÒNG HỌP & MẬT KHẨU (Bảng: meeting_settings)
  // -------------------------------------------------------------
  async fetchMeetingSettings(): Promise<MeetingRoomSettings | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('meeting_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.warn('Supabase fetchMeetingSettings error:', error.message);
        return null;
      }
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

  async upsertMeetingSettings(settings: MeetingRoomSettings): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const payload: any = {
        id: 1,
        password_required: settings.passwordRequired,
        room_password: settings.roomPassword,
        meeting_title: settings.meetingTitle,
        meeting_session_number: settings.meetingSessionNumber,
        chair_person: settings.chairPerson,
        secretary: settings.secretary,
      };

      const { error } = await supabase.from('meeting_settings').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertMeetingSettings error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertMeetingSettings failed:', err);
      return { success: false, error: err?.message };
    }
  },

  // -------------------------------------------------------------
  // 6. TÀI LIỆU PHÒNG HỌP (Bảng: meeting_documents)
  // -------------------------------------------------------------
  async fetchMeetingDocuments(): Promise<MeetingDocumentItem[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('meeting_documents')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('Supabase fetchMeetingDocuments error:', error.message);
        return null;
      }
      if (!data) return null;

      return data.map((item: any) => ({
        id: Number(item.id),
        code: item.code || '',
        title: item.title || '',
        category: item.category || 'Nghị quyết',
        contentHtml: item.content_html || item.contentHtml || '',
        fileType: item.file_type || item.fileType || 'word',
        fileName: item.file_name || item.fileName || '',
        fileSize: item.file_size || item.fileSize || '',
        fileUrl: item.file_url || item.fileUrl || '',
        uploadedBy: item.uploaded_by || item.uploadedBy || 'Đảng ủy',
        date: item.date || '26/08/2026',
        isSecret: item.is_secret ?? item.isSecret ?? false,
      }));
    } catch (err) {
      console.warn('Supabase fetchMeetingDocuments failed:', err);
      return null;
    }
  },

  async upsertMeetingDocument(doc: MeetingDocumentItem): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const payload: any = {
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
      if (error) {
        console.error('Supabase upsertMeetingDocument error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertMeetingDocument failed:', err);
      return { success: false, error: err?.message };
    }
  },

  async deleteMeetingDocument(docId: number): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const { error } = await supabase.from('meeting_documents').delete().eq('id', docId);
      if (error) {
        console.error('Supabase deleteMeetingDocument error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase deleteMeetingDocument failed:', err);
      return { success: false, error: err?.message };
    }
  },

  // -------------------------------------------------------------
  // 7. PHÒNG HỌP TRỰC TUYẾN ĐA KỲ HỌP (Bảng: meeting_rooms)
  // -------------------------------------------------------------
  async fetchMeetingRooms(): Promise<MeetingRoomItem[] | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('meeting_rooms')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.warn('Supabase fetchMeetingRooms error:', error.message);
        return null;
      }
      if (!data) return null;

      return data.map((item: any) => ({
        id: String(item.id),
        roomCode: item.room_code || item.roomCode || `PH-${String(item.id).slice(-4)}`,
        title: item.title || 'Kỳ họp Đảng ủy',
        sessionNumber: item.session_number || item.sessionNumber || 'Kỳ họp định kỳ',
        chairPerson: item.chair_person || item.chairPerson || '',
        secretary: item.secretary || '',
        description: item.description || '',
        unitTarget: item.unit_target || item.unitTarget || 'Đảng ủy Trung đoàn 95',
        passwordRequired: item.password_required ?? item.passwordRequired ?? true,
        roomPassword: item.room_password || item.roomPassword || '1945',
        createdByUserId: item.created_by_user_id || item.createdByUserId || 1,
        createdByUserName: item.created_by_user_name || item.createdByUserName || 'Đảng ủy',
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        status: (item.status === 'in_progress' || item.status === 'ended') ? item.status : 'scheduled',
        startTime: item.start_time || item.startTime || '08:00 26/08/2026',
        endTime: item.end_time || item.endTime || '11:30 26/08/2026',
        totalDurationMinutes: Number(item.total_duration_minutes || item.totalDurationMinutes || 0),
        documents: item.documents ? (typeof item.documents === 'string' ? JSON.parse(item.documents) : item.documents) : [],
        votes: item.votes ? (typeof item.votes === 'string' ? JSON.parse(item.votes) : item.votes) : {},
      }));
    } catch (err) {
      console.warn('Supabase fetchMeetingRooms failed:', err);
      return null;
    }
  },

  async upsertMeetingRoom(room: MeetingRoomItem): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const payload: any = {
        id: room.id,
        room_code: room.roomCode,
        title: room.title,
        session_number: room.sessionNumber,
        chair_person: room.chairPerson,
        secretary: room.secretary,
        description: room.description || '',
        unit_target: room.unitTarget || '',
        password_required: room.passwordRequired,
        room_password: room.roomPassword || '1945',
        created_by_user_id: room.createdByUserId,
        created_by_user_name: room.createdByUserName,
        created_at: room.createdAt,
        status: room.status,
        start_time: room.startTime,
        end_time: room.endTime,
        total_duration_minutes: room.totalDurationMinutes,
        documents: JSON.stringify(room.documents || []),
        votes: JSON.stringify(room.votes || {}),
      };

      const { error } = await supabase.from('meeting_rooms').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertMeetingRoom error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertMeetingRoom failed:', err);
      return { success: false, error: err?.message };
    }
  },

  async deleteMeetingRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const { error } = await supabase.from('meeting_rooms').delete().eq('id', roomId);
      if (error) {
        console.error('Supabase deleteMeetingRoom error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase deleteMeetingRoom failed:', err);
      return { success: false, error: err?.message };
    }
  },

  // -------------------------------------------------------------
  // 8. BIỂU QUYẾT (Bảng: meeting_votes)
  // -------------------------------------------------------------
  async fetchMeetingVotes(): Promise<Record<number, MeetingVote> | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('meeting_votes').select('*');
      if (error) {
        console.warn('Supabase fetchMeetingVotes error:', error.message);
        return null;
      }
      if (!data) return null;

      const votesMap: Record<number, MeetingVote> = {};
      data.forEach((v: any) => {
        const uid = Number(v.user_id || v.userId);
        if (uid) {
          votesMap[uid] = {
            userId: uid,
            voterName: v.voter_name || v.voterName || 'Đại biểu',
            rankUnit: v.rank_unit || v.rankUnit || '',
            choice: v.choice,
            time: v.time,
            docId: v.doc_id || v.docId,
          };
        }
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
      const payload: any = {
        user_id: vote.userId,
        voter_name: vote.voterName,
        rank_unit: vote.rankUnit,
        choice: vote.choice,
        time: vote.time,
        doc_id: vote.docId || null,
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
  // 9. CẤU HÌNH GIAO DIỆN & TOÀN HỆ THỐNG (Bảng: site_config)
  // -------------------------------------------------------------
  async fetchSiteConfig(): Promise<SiteConfig | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('site_config').select('*').limit(1).single();
      if (error) {
        console.warn('Supabase fetchSiteConfig error:', error.message);
        return null;
      }
      if (data) {
        if (data.config_json) {
          return typeof data.config_json === 'string' ? JSON.parse(data.config_json) : data.config_json;
        }
        return data as SiteConfig;
      }
      return null;
    } catch (err) {
      console.warn('Supabase fetchSiteConfig failed:', err);
      return null;
    }
  },

  async upsertSiteConfig(config: SiteConfig): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Chưa kết nối Supabase' };

    try {
      const payload: any = {
        id: 1,
        config_json: config,
        title: config.title,
        subtitle: config.subtitle,
        unit_name: config.footerUnitName || config.title,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('site_config').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsertSiteConfig error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('Supabase upsertSiteConfig failed:', err);
      return { success: false, error: err?.message };
    }
  },

  // -------------------------------------------------------------
  // 10. REALTIME DATABASE-FIRST SUBSCRIPTION (supabase.channel('public:db-changes'))
  // -------------------------------------------------------------
  subscribeAllChanges(callbacks: {
    onArticlesChange?: (articles: Article[]) => void;
    onDocumentsChange?: (docs: DocumentItem[]) => void;
    onLecturesChange?: (lectures: LectureItem[]) => void;
    onMeetingSettingsChange?: (settings: MeetingRoomSettings) => void;
    onMeetingDocumentsChange?: (docs: MeetingDocumentItem[]) => void;
    onMeetingRoomsChange?: (rooms: MeetingRoomItem[]) => void;
    onSiteConfigChange?: (config: SiteConfig) => void;
    onUsersChange?: (users: User[]) => void;
  }): (() => void) | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const channel = supabase
        .channel('public:db-changes')
        // 1. Articles
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, async () => {
          if (callbacks.onArticlesChange) {
            const fresh = await supabaseDb.fetchArticles();
            if (fresh !== null) callbacks.onArticlesChange(fresh);
          }
        })
        // 2. Documents
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, async () => {
          if (callbacks.onDocumentsChange) {
            const fresh = await supabaseDb.fetchDocuments();
            if (fresh !== null) callbacks.onDocumentsChange(fresh);
          }
        })
        // 3. Lectures
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lectures' }, async () => {
          if (callbacks.onLecturesChange) {
            const fresh = await supabaseDb.fetchLectures();
            if (fresh !== null) callbacks.onLecturesChange(fresh);
          }
        })
        // 4. Meeting Settings
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_settings' }, async () => {
          if (callbacks.onMeetingSettingsChange) {
            const fresh = await supabaseDb.fetchMeetingSettings();
            if (fresh !== null) callbacks.onMeetingSettingsChange(fresh);
          }
        })
        // 5. Meeting Documents
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_documents' }, async () => {
          if (callbacks.onMeetingDocumentsChange) {
            const fresh = await supabaseDb.fetchMeetingDocuments();
            if (fresh !== null) callbacks.onMeetingDocumentsChange(fresh);
          }
        })
        // 6. Meeting Rooms
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_rooms' }, async () => {
          if (callbacks.onMeetingRoomsChange) {
            const fresh = await supabaseDb.fetchMeetingRooms();
            if (fresh !== null) callbacks.onMeetingRoomsChange(fresh);
          }
        })
        // 7. Site Config & Categories
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, async () => {
          if (callbacks.onSiteConfigChange) {
            const fresh = await supabaseDb.fetchSiteConfig();
            if (fresh !== null) callbacks.onSiteConfigChange(fresh);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
          if (callbacks.onSiteConfigChange) {
            const fresh = await supabaseDb.fetchSiteConfig();
            if (fresh !== null) callbacks.onSiteConfigChange(fresh);
          }
        })
        // 8. Users
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
          if (callbacks.onUsersChange) {
            const fresh = await supabaseDb.fetchUsers();
            if (fresh !== null) callbacks.onUsersChange(fresh);
          }
        })
        .subscribe((status) => {
          console.log('[Supabase Realtime Channel status]:', status);
        });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore
        }
      };
    } catch (e) {
      console.warn('Supabase subscribeAllChanges failed:', e);
      return null;
    }
  },
};
