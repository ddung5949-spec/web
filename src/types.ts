export type UserRole = 'admin' | 'editor' | 'user' | 'commander' | string;

export interface RoleDefinition {
  id: string; // unique role identifier, e.g. 'admin', 'commander', 'editor', 'user', 'political_officer', etc.
  name: string; // Display name, e.g. 'Quản trị viên', 'Chính trị viên', 'Trợ lý Tuyên huấn'
  description?: string;
  color: string; // e.g. '#b91c1c', '#065f46', '#1e40af', '#d97706', '#7c3aed'
  textColor?: string; // default '#ffffff'
  isSystem?: boolean; // system-level roles (e.g. admin, user)
  defaultPermissions?: {
    canViewDoc?: boolean;
    canUploadDoc?: boolean;
    canJoinPartyMeeting?: boolean;
    canUploadMeetingDoc?: boolean;
    canDeleteMeetingDoc?: boolean;
    canViewCollaborativeEdits?: boolean;
    canCreateMeeting?: boolean;
  };
}

export interface MilitaryProfile {
  id: number;
  militaryCode: string; // Số hiệu quân nhân / Số quân nhân (ví dụ: SQ-10294, QN-88412, CS-66219)
  fullName: string;
  birthDate?: string; // YYYY-MM-DD
  rank: string; // Thượng úy, Đại úy, Thiếu tá, Binh nhất, v.v.
  position: string; // Chính trị viên, Đại đội trưởng, Trợ lý Tuyên huấn, Chiến sĩ...
  unit: string; // Trung đoàn 28, Trung đoàn 66, Phòng Chính trị, Đại đội 1...
  hometown?: string; // Quê quán (ví dụ: Đức Cơ, Gia Lai; Nam Đàn, Nghệ An)
  enlistmentDate?: string; // Ngày nhập ngũ (YYYY-MM-DD)
  partyJoinDate?: string; // Ngày vào Đảng
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  notes?: string;
  status: 'active' | 'leave' | 'transferred' | 'study'; // Trạng thái công tác

  // Linked User Account
  userId?: number | null; // ID của tài khoản người dùng tương ứng nếu đã tạo/liên kết
  username?: string; // Tên đăng nhập tài khoản liên kết

  // Activity & stats tracking
  totalActiveMinutes: number; // Tổng thời gian hoạt động thực tế (tính bằng phút)
  lastActiveAt?: string; // Thời điểm hoạt động gần nhất (ISO hoặc chuỗi ngày giờ)
  sessionCount: number; // Tổng số phiên / lần đăng nhập
  isOnline?: boolean;
}

export interface User {
  id: number;
  username: string;
  password?: string;
  fullName: string;
  email?: string;
  createdAt?: string;
  birthDate?: string;
  rank?: string;
  position?: string;
  rankUnit: string;
  avatar?: string;
  role: UserRole;
  militaryCode?: string; // Mã số hiệu quân nhân liên kết
  profileId?: number; // ID hồ sơ quân nhân liên kết
  totalActiveMinutes?: number; // Tổng thời gian hoạt động
  lastActiveAt?: string; // Thời điểm hoạt động gần nhất
  sessionCount?: number; // Tổng số phiên
  isOnline?: boolean;
  registeredAt?: string; // Thời điểm đăng ký tài khoản mới
  isNewRegistration?: boolean; // Cảnh báo thông báo tài khoản mới cho admin
  registrationStatus?: 'pending_approval' | 'approved' | 'rejected' | 'pending'; // Trạng thái phê duyệt
  canViewDoc?: boolean;
  canUploadDoc?: boolean;
  canUploadDocs?: boolean;
  canViewSecretDocs?: boolean;
  canJoinPartyMeeting?: boolean;
  canUploadMeetingDoc?: boolean;
  canDeleteMeetingDoc?: boolean;
  canViewCollaborativeEdits?: boolean;
  canCreateMeeting?: boolean;
}

export type SectionType = 'ctd' | 'hl' | 'bac';

export type ArticleImagePosition =
  | 'top'
  | 'middle_1'
  | 'middle_2'
  | 'bottom'
  | 'float_left'
  | 'float_right'
  | 'gallery';

export interface ArticleImage {
  id: string;
  url: string;
  caption?: string;
  position: ArticleImagePosition;
}

export interface Article {
  id: number;
  title: string;
  category: string;
  author: string;
  date: string;
  image: string;
  images?: ArticleImage[];
  excerpt: string;
  summary?: string;
  content: string;
  embedCode?: string; // Mã nhúng video/iframe/audio/bản tin từ trang khác
  status: 'approved' | 'pending';
  views: number;
  sectionKey: SectionType;
}

export interface DocumentItem {
  id: number;
  code: string;
  title: string;
  category?: string;
  issuer: string;
  date: string;
  type: 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'zip' | 'rar' | string;
  description?: string;
  fileName?: string;
  fileSize?: string;
  downloads?: number;
  fileUrl?: string;
  secretLevel?: 'normal' | 'mat' | 'toi_mat';
}

export interface LectureItem {
  id: number;
  title: string;
  category?: string;
  target: string;
  author: string;
  desc: string;
  date: string;
  fileType?: 'word' | 'powerpoint' | 'pdf' | 'excel' | 'zip' | 'rar' | string;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  downloads?: number;
}

export type VoteChoice = 'Tán thành' | 'Không tán thành' | 'Có ý kiến khác' | 'Ý kiến khác';

export interface MeetingVote {
  docId?: number;
  userId: number;
  voterName: string;
  rankUnit: string;
  choice: VoteChoice;
  time: string;
  note?: string;
}

export interface MeetingDocumentItem {
  id: number;
  code: string;
  title: string;
  category: string;
  contentHtml?: string;
  fileType?: 'word' | 'pdf' | 'excel' | 'powerpoint' | 'text' | string;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  uploadedBy: string;
  date: string;
  isSecret?: boolean;
  sections?: CollabSectionBlock[];
  version?: number;
  lastSavedAt?: string;
  lastSavedBy?: string;
  history?: CollabHistoryItem[];
}

export interface RoomPresenceItem {
  id: string; // `${roomId}_${userId}`
  roomId: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  rankUnit?: string;
  color: string; // Color assigned for cursor and badge
  activeDocId?: number;
  activeSectionId?: string;
  cursorSnippet?: string; // e.g. "Đoạn 2: Phương hướng"
  isTyping?: boolean;
  lastActive: number; // timestamp in ms
}

export interface CollabSectionBlock {
  id: string; // e.g. "sec-1", "sec-2"
  title: string; // e.g. "I. ĐÁNH GIÁ TÌNH HÌNH & KẾT QUẢ ĐẠT ĐƯỢC"
  content: string; // HTML / Rich content of this section
  lockedBy?: {
    userId: number;
    userName: string;
    userColor: string;
    timestamp: number;
  } | null;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface CollabHistoryItem {
  id: string;
  version: number;
  timestamp: string;
  authorName: string;
  authorRankUnit?: string;
  summary: string;
  contentHtml: string;
  sections?: CollabSectionBlock[];
}

export interface CollabDocData {
  roomId: string;
  docId: number;
  title: string;
  code?: string;
  category?: string;
  contentHtml: string;
  sections?: CollabSectionBlock[];
  version: number;
  lastSavedAt: string;
  lastSavedBy: string;
  history?: CollabHistoryItem[];
}

export interface RoomBroadcastAction {
  id: string;
  roomId: string;
  userId: number;
  userName: string;
  userColor?: string;
  type: 'join' | 'edit_start' | 'edit_section' | 'save' | 'vote' | 'speech_request';
  message: string;
  timestamp: number;
}

export interface MeetingRoomSettings {
  passwordRequired: boolean;
  roomPassword?: string;
  meetingTitle: string;
  meetingSessionNumber: string;
  chairPerson: string;
  secretary: string;
}

export interface MeetingRoomItem {
  id: string; // e.g. "room-1", "room-2", "room-3"
  roomCode: string; // e.g. "PH-01", "PH-ĐU-10"
  title: string; // Tên phòng họp, e.g. "Hội nghị Ban Chấp hành Đảng bộ Sư đoàn 10"
  sessionNumber?: string; // Kỳ họp số, e.g. "Kỳ họp thứ 14 (Khóa XII)"
  chairPerson: string; // Chủ trì
  secretary: string; // Thư ký
  description?: string; // Ghi chú / Mục đích
  unitTarget?: string; // e.g. "Đảng ủy Sư đoàn 10", "Đảng ủy Trung đoàn 28", ...
  passwordRequired: boolean;
  roomPassword?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string; // ISO string or format
  status: 'scheduled' | 'in_progress' | 'ended'; // Trạng thái cuộc họp
  startTime?: string; // Thời gian bắt đầu (vd: "08:00 20/08/2026")
  endTime?: string; // Thời gian kết thúc (vd: "11:30 20/08/2026")
  totalDurationMinutes?: number; // Tổng thời lượng đã họp
  documents: MeetingDocumentItem[]; // Danh sách tài liệu riêng của phòng họp này
  votes: Record<string, MeetingVote>; // key: `${docId}_${userId}`
}

export interface SectionConfigItem {
  id: SectionType | string;
  title: string;
  shortLabel: string;
  subTitle: string;
  desc: string;
  themeColor: string;
  categories: string[];
}

export interface SiteSectionsConfig {
  ctd: SectionConfigItem;
  hl: SectionConfigItem;
  bac: SectionConfigItem;
  doc: {
    title: string;
    shortLabel: string;
    subTitle?: string;
    desc: string;
    categories?: string[];
  };
  lecture: {
    title: string;
    shortLabel: string;
    subTitle?: string;
    desc: string;
    categories?: string[];
  };
  meeting: {
    title: string;
    shortLabel: string;
    subTitle?: string;
    desc: string;
  };
}

export interface CustomMenuItem {
  id: string;
  title: string;
  type: 'internal' | 'external';
  targetPage?: PageView;
  externalUrl?: string;
  openNewTab?: boolean;
}

export interface HomeAnnouncement {
  id: string;
  title: string;
  date?: string;
  link?: string;
  articleId?: number;
  highlight?: boolean;
}

export interface QuickActionCard {
  id: string;
  title: string;
  subtitle?: string;
  iconName: 'exam' | 'doc' | 'video' | 'meeting' | 'link' | 'award' | 'book' | 'lecture' | 'users' | 'shield' | 'star' | 'flag' | string;
  type: 'internal' | 'external';
  targetPage?: PageView;
  externalUrl?: string;
  openNewTab?: boolean;
  bgGradient?: string;
  borderColor?: string;
  textColor?: string;
  heightSize?: 'sm' | 'md' | 'lg';
  enabled?: boolean;
}

export interface FooterCustomLink {
  id: string;
  label: string;
  url: string;
  order?: number;
  openNewTab?: boolean;
}

export interface HomeCategoryColumn {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'category_articles' | 'embed_code';
  sectionKey?: SectionType | string;
  categoryFilter?: string;
  embedCode?: string; // Mã nhúng HTML, iframe, video, bản tin từ nguồn khác
  embedHtml?: string;
  embedUrl?: string;
  articleLimit?: number;
  headerBgColor?: string;
  headerTextColor?: string;
  iconName?: 'flag' | 'crosshair' | 'heart' | 'book' | 'shield' | 'award' | 'star' | 'code' | 'video' | 'globe' | string;
  pinnedArticleIds?: number[];
  enabled?: boolean;
  order?: number;
  colSpan?: '1' | '2' | '3' | 'full'; // Kích thước chiều rộng chuyên mục (1 cột, 2 cột, Toàn chiều rộng)
  heightMode?: 'auto' | 'compact' | 'expanded'; // Chiều cao tự động theo nội dung tin tức
}

export interface UncleHoStory {
  id: string;
  title: string;
  period?: string;
  summary: string;
  content: string;
  moralLesson: string;
  audioUrl?: string;
  imageUrl?: string;
  dateAdded?: string;
}

export interface UncleHoSoldierModel {
  id: string;
  fullName: string;
  rankUnit: string;
  titleAchievement: string;
  story: string;
  avatar: string;
  year: string;
}

export interface UncleHoSong {
  id: string;
  title: string;
  composer: string;
  performer?: string;
  audioUrl?: string;
  duration?: string;
  lyrics?: string;
}

export interface UncleHoCustomCategory {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  content?: string;
  items?: { id: string; title: string; desc: string; date?: string; link?: string; imageUrl?: string }[];
}

export type RightSidebarWidgetType =
  | 'latest_news'
  | 'quick_login'
  | 'online_exam'
  | 'document_library'
  | 'video_library'
  | 'public_survey'
  | 'custom_shortcuts';

export type SidebarWidgetId =
  | 'uncle_ho' // Khối Lời Bác dạy ngày này năm xưa
  | 'daily_widgets' // Khối gộp (legacy)
  | 'safety_message' // Khối Mỗi ngày 1 thông điệp an toàn
  | 'traffic_situation' // Khối Mỗi ngày một tình huống giao thông
  | 'good_deed' // Khối Mỗi ngày một hành động đẹp
  | 'widget_safety_message'
  | 'widget_traffic_situation'
  | 'widget_good_deed'
  | 'announcements' // Khối Thông báo & Sự kiện quan trọng
  | 'latest_news' // Khối Tin mới nhất
  | 'quick_actions'; // Khối Tiện ích quân nhân

export interface SidebarWidgetSetting {
  id: SidebarWidgetId;
  name: string;
  side: 'left' | 'right';
  order: number;
  enabled: boolean;
}

export interface DailyWidgetItem {
  id: string; // 'safety_message' | 'traffic_situation' | 'good_deed' | 'widget_safety_message' | 'widget_traffic_situation' | 'widget_good_deed'
  categoryName: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  aspectRatioMode?: 'auto' | 'portrait' | 'landscape';
  updatedAt?: string;
}

export interface NavTabItem {
  id: string; // e.g. 'home', 'ctd', 'hl', 'bac', 'doc', 'lecture', 'qdnd', 'qk5' or custom
  label: string;
  type: 'section' | 'internal' | 'external';
  targetPage?: PageView | string;
  externalUrl?: string;
  openNewTab?: boolean;
  enabled: boolean;
  order: number;
}

export interface SiteConfig {
  title: string;
  subtitle: string;
  slogan: string;
  ticker: string;
  colorRed: string;
  colorGreen: string;
  logoType?: 'official_vector' | 'custom_image';
  customLogoUrl?: string;
  enableLogoBeam?: boolean;
  enableLogoGlow?: boolean;
  logoSizePx?: number;
  footerLogoSizePx?: number;
  establishedDate?: string;
  sections: SiteSectionsConfig;
  customMenuItems?: CustomMenuItem[];
  navTabs?: NavTabItem[];
  dailyWidgets?: DailyWidgetItem[];
  dailyPosters?: DailyWidgetItem[] | Record<string, any>;
  daily_widgets?: DailyWidgetItem[] | Record<string, any>;
  daily_posters?: DailyWidgetItem[] | Record<string, any>;
  sidebarWidgets?: SidebarWidgetSetting[];
  tickerMode?: 'manual' | 'auto_today' | 'auto_days' | 'combined';
  tickerDays?: number;
  tickerCustomList?: string[];
  tickerSpeed?: 'slow' | 'normal' | 'fast';
  tickerPrefix?: string;
  homeAnnouncements?: HomeAnnouncement[];
  quickActionCards?: QuickActionCard[];
  homeQuickActions?: QuickActionCard[];
  homeCategoryColumns?: HomeCategoryColumn[];
  spotlightArticleId?: number;
  spotlightArticleIds?: number[];
  homeRightSidebarWidgets?: RightSidebarWidgetType[];
  userRoles?: RoleDefinition[];
  footerAddress?: string;
  footerHotline?: string;
  footerEmail?: string;
  footerUnitName?: string;
  footerCopyright?: string;
  footerBgColor?: string;
  footerSloganBgColor?: string;
  footerAccentColor?: string;
  footerLayout?: 'split' | 'centered' | 'compact' | 'columns';
  footerShowLogo?: boolean;
  footerShowAddress?: boolean;
  footerShowContact?: boolean;
  footerShowSlogan?: boolean;
  footerShowBackToTop?: boolean;
  footerShowCustomLinks?: boolean;
  footerCustomLinks?: FooterCustomLink[];
  layoutSettings?: HomeLayoutSettings;
}

export interface HomeLayoutSettings {
  showUncleHoSection?: boolean;
  showAnnouncementsWidget?: boolean;
  showFeaturedSlider?: boolean;
  showSpotlightSection?: boolean;
  showLatestNewsWidget?: boolean;
  showQuickActionsWidget?: boolean;
  showCategoryColumns?: boolean;
  showQuickLibrarySection?: boolean;
  topColumnsOrder?: ('left' | 'middle' | 'right')[];
  sidebarWidgets?: SidebarWidgetSetting[];
}

export interface UncleHoQuote {
  id: string; // e.g. "08-19" or unique ID
  dayMonth: string; // "19/08" (DD/MM)
  yearRecorded?: string; // e.g. "1945", "1954", "1965"
  quote: string; // Lời Bác dạy cốt lõi
  context: string; // Hoàn cảnh lịch sử / nguồn tư liệu
  lesson: string; // Ý nghĩa và bài học vận dụng đối với cán bộ, chiến sĩ
  images: string[]; // Danh sách ảnh (hỗ trợ upload cả folder ảnh)
  publishTime?: string; // e.g. "06:00"
  status?: 'active' | 'scheduled' | 'draft';
  isAutoPublish?: boolean;
}

export interface UncleHoSettings {
  autoPostEnabled: boolean;
  dailyPostTime: string; // "06:00"
  autoSelectToday: boolean;
  activeQuoteId?: string;
  folderUploadBatchName?: string;
}

export type PageView =
  | 'home'
  | 'ctd'
  | 'hl'
  | 'bac'
  | 'doc'
  | 'lecture'
  | 'meeting'
  | 'approvals'
  | 'users'
  | 'article_detail'
  | 'article-detail';
