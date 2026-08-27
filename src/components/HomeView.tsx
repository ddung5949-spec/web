import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  Code,
  Crosshair,
  Download,
  Edit2,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FileType,
  FileSpreadsheet,
  Flag,
  FolderArchive,
  FolderLock,
  Globe,
  HardDriveDownload,
  Heart,
  Laptop,
  Layers,
  Layout,
  LayoutGrid,
  Newspaper,
  Plus,
  PlusCircle,
  Presentation,
  Shield,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  UserPen,
  UsersRound,
  Video,
} from 'lucide-react';
import {
  Article,
  DocumentItem,
  HomeAnnouncement,
  HomeCategoryColumn,
  HomeLayoutSettings,
  LectureItem,
  PageView,
  QuickActionCard,
  SiteConfig,
  UncleHoQuote,
  UncleHoSettings,
  User,
} from '../types';
import { defaultHomeCategoryColumns } from '../data/initialData';
import { ArticleCard } from './ArticleCard';
import { HomeAnnouncementsWidget } from './HomeAnnouncementsWidget';
import { HomeLatestNewsWidget } from './HomeLatestNewsWidget';
import { HomeMiddleFeaturedSlider } from './HomeMiddleFeaturedSlider';
import { HomeQuickActionsWidget } from './HomeQuickActionsWidget';
import { HomeSpotlightSection } from './HomeSpotlightSection';
import { UncleHoDailySection } from './UncleHoDailySection';
import { QuickActionManagerModal } from './modals/QuickActionManagerModal';
import { HomeSectionManagerModal } from './modals/HomeSectionManagerModal';
import { LayoutManagerModal } from './modals/LayoutManagerModal';

interface HomeViewProps {
  articles: Article[];
  documents?: DocumentItem[];
  lectures?: LectureItem[];
  uncleHoQuotes?: UncleHoQuote[];
  uncleHoSettings?: UncleHoSettings;
  currentUser?: User | null;
  siteConfig?: SiteConfig;
  isLoading?: boolean;
  onOpenArticle: (article: Article) => void;
  onSelectSection: (section: PageView) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
  onOpenUncleHoManager?: () => void;
  onSaveUncleHoQuotes?: (quotes: UncleHoQuote[]) => void;
  onOpenAnnouncementManager?: () => void;
  onSaveQuickActions?: (cards: QuickActionCard[]) => void;
  onSaveHomeCategoryColumns?: (columns: HomeCategoryColumn[]) => void;
  onSaveLayoutSettings?: (layout: HomeLayoutSettings) => void;
  onSelectSpotlightArticle?: (articleId: number) => void;
  onOpenAuthModal?: (tab: 'login' | 'register') => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
  onOpenCustomizer?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  articles,
  documents = [],
  lectures = [],
  uncleHoQuotes = [],
  uncleHoSettings = {
    autoPostEnabled: true,
    dailyPostTime: '06:00',
    autoSelectToday: true,
    activeQuoteId: '08-19',
  },
  currentUser = null,
  siteConfig,
  isLoading = false,
  onOpenArticle,
  onSelectSection,
  onEditArticle,
  onDeleteArticle,
  onOpenUncleHoManager = () => {},
  onSaveUncleHoQuotes,
  onOpenAnnouncementManager = () => {},
  onSaveQuickActions,
  onSaveHomeCategoryColumns,
  onSaveLayoutSettings,
  onSelectSpotlightArticle,
  onOpenAuthModal = () => {},
  onOpenProfileModal = () => {},
  onLogout = () => {},
  onOpenCustomizer = () => {},
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const approvedArticles = articles.filter((a) => !a.status || a.status === 'approved' || a.status !== 'pending');

  // Modals state for Admin
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [isSectionManagerModalOpen, setIsSectionManagerModalOpen] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

  // Layout Settings
  const layout = siteConfig?.layoutSettings || {};
  const showUncleHo = layout.showUncleHoSection !== false;
  const showAnnouncements = layout.showAnnouncementsWidget !== false;
  const showFeaturedSlider = layout.showFeaturedSlider !== false;
  const showSpotlight = layout.showSpotlightSection !== false;
  const showLatestNews = layout.showLatestNewsWidget !== false;
  const showQuickActions = layout.showQuickActionsWidget !== false;
  const showCategoryColumns = layout.showCategoryColumns !== false;
  const showQuickLibrary = layout.showQuickLibrarySection !== false;

  // Quick Action Cards from siteConfig (support both property keys) or default
  const quickActionCards: QuickActionCard[] =
    siteConfig?.quickActionCards ||
    siteConfig?.homeQuickActions || [
    {
      id: 'card-doc',
      title: 'VĂN BẢN - CHỈ THỊ',
      subtitle: 'Kho tài liệu tác chiến & quân sự',
      iconName: 'doc',
      type: 'internal',
      targetPage: 'doc',
      bgGradient: 'from-blue-900 via-indigo-900 to-slate-900',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-lecture',
      title: 'BÀI GIẢNG SỐ HÓA',
      subtitle: 'Thư viện giáo án điện tử Sư đoàn',
      iconName: 'lecture',
      type: 'internal',
      targetPage: 'lecture',
      bgGradient: 'from-emerald-900 via-teal-900 to-slate-900',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-meeting',
      title: 'HỌP ĐẢNG ỦY & DƯ LUẬN',
      subtitle: 'Phòng họp trực tuyến & Biểu quyết',
      iconName: 'meeting',
      type: 'internal',
      targetPage: 'meeting',
      bgGradient: 'from-red-950 via-rose-900 to-amber-950',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-200',
      heightSize: 'md',
      enabled: true,
    },
    {
      id: 'card-online-exam',
      title: 'THI TÌM HIỂU TRỰC TUYẾN',
      subtitle: 'Nghị quyết Đại hội Đảng các cấp',
      iconName: 'exam',
      type: 'external',
      externalUrl: 'https://thitimhieunghiquyet.vn',
      bgGradient: 'from-purple-900 via-violet-900 to-slate-900',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-200',
      heightSize: 'md',
      enabled: true,
    },
  ];

  // Dynamic Category Columns from siteConfig or default
  const configuredColumns: HomeCategoryColumn[] =
    siteConfig?.homeCategoryColumns && siteConfig.homeCategoryColumns.length > 0
      ? siteConfig.homeCategoryColumns
      : defaultHomeCategoryColumns;

  const activeColumns = configuredColumns
    .filter((col) => col.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getColumnIcon = (iconName?: string) => {
    switch (iconName) {
      case 'flag':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'crosshair':
        return <Crosshair className="w-4 h-4 text-emerald-600" />;
      case 'shield':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'layers':
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-teal-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'code':
        return <Code className="w-4 h-4 text-purple-600" />;
      case 'globe':
        return <Globe className="w-4 h-4 text-cyan-600" />;
      default:
        return <Newspaper className="w-4 h-4 text-red-600" />;
    }
  };

  const announcements: HomeAnnouncement[] = siteConfig?.homeAnnouncements || [
    {
      id: 'ann-1',
      title: 'Kết quả Cuộc thi tìm hiểu trực tuyến Đại hội XIV của Đảng, Đại hội Đảng bộ Quân đội lần thứ XII và Đại hội Đảng bộ Sư đoàn 10 nhiệm kỳ 2025-2030 (Tuần thứ 3)',
      date: '19/08/2026',
      highlight: true,
    },
    {
      id: 'ann-2',
      title: 'Kết quả Cuộc thi tìm hiểu trực tuyến Đại hội XIV của Đảng, Đại hội Đảng bộ Quân đội lần thứ XII và Đại hội Đảng bộ Sư đoàn 10 nhiệm kỳ 2025-2030 (Tuần thứ nhất)',
      date: '12/08/2026',
    },
    {
      id: 'ann-3',
      title: 'VIETTEL TUNG NHIỀU ƯU ĐÃI KHUYẾN KHÍCH CÁN BỘ CHIẾN SĨ SỚM XÁC THỰC THÔNG TIN THUÊ BAO CHÍNH CHỦ',
      date: '08/08/2026',
    },
  ];

  // Top fast download handler
  const handleFastDownloadDoc = (doc: DocumentItem) => {
    const defaultFileName =
      doc.fileName ||
      `${doc.code.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.${doc.type || 'pdf'}`;

    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = defaultFileName;
      if (doc.fileUrl.startsWith('http')) link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const blobContent = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nBỘ TƯ LỆNH SƯ ĐOÀN 10 - ĐOÀN MANG YANG\n${doc.issuer.toUpperCase()}\n\nSố/Ký hiệu: ${doc.code}\nNgày ban hành: ${doc.date}\nTiểu mục: ${doc.category || 'Văn bản hành chính'}\n\nTRÍCH YẾU NỘI DUNG:\n${doc.title}\n\n${doc.description || 'Văn bản quy định lưu hành nội bộ đơn vị.'}`;
      const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName.endsWith('.txt') ? defaultFileName : `${defaultFileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFastDownloadLecture = (lec: LectureItem) => {
    const defaultFileName =
      lec.fileName ||
      `${lec.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.${
        lec.fileType === 'word' ? 'docx' : lec.fileType === 'pdf' ? 'pdf' : 'pptx'
      }`;

    if (lec.fileUrl) {
      const link = document.createElement('a');
      link.href = lec.fileUrl;
      link.download = defaultFileName;
      if (lec.fileUrl.startsWith('http')) link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = `QUÂN ĐỘI NHÂN DÂN VIỆT NAM\nSƯ ĐOÀN 10 - ĐOÀN MANG YANG\n\nBÀI GIẢNG ĐIỆN TỬ: ${lec.title}\nĐối tượng: ${lec.target}\nGiáo viên: ${lec.author}\nNgày: ${lec.date}\n\n${lec.desc}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Action Bar for Layout Customization */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 border border-amber-500/40 rounded-xl p-2.5 px-4 text-white flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Sliders className="w-4 h-4" />
            <span>BẢNG ĐIỀU KHIỂN BỐ CỤC TRANG CHỦ (ADMIN)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLayoutModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>BẬT/TẮT BỐ CỤC TRANG CHỦ</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSectionManagerModalOpen(true)}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-300" />
              <span>QUẢN LÝ CHUYÊN MỤC</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          1. 4-FRACTION TOP MAIN SECTION
          - Left Column (1/4):
              + Lời Bác dạy ngày này năm xưa (if enabled)
              + Thông báo & Sự kiện quan trọng (if enabled)
          - Center Column (2/4):
              + Featured Carousel Slider (if enabled)
              + Bài đăng mới nhất, tiêu biểu (if enabled)
          - Right Column (1/4):
              + Tin mới nhất (if enabled)
              + Tiện ích quân nhân / Cuộc thi trực tuyến (if enabled)
         ======================================================== */}
      {(showUncleHo || showAnnouncements || showFeaturedSlider || showSpotlight || showLatestNews || showQuickActions) && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          {/* LEFT COLUMN: 1 fraction (1/4) */}
          {(showUncleHo || showAnnouncements) && (
            <div className="lg:col-span-1 flex flex-col gap-4">
              {showUncleHo && (
                <UncleHoDailySection
                  quotes={uncleHoQuotes}
                  settings={uncleHoSettings}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onOpenManager={onOpenUncleHoManager}
                  onSaveQuotes={onSaveUncleHoQuotes}
                  layout="vertical"
                />
              )}

              {showAnnouncements && (
                <HomeAnnouncementsWidget
                  announcements={announcements}
                  currentUser={currentUser}
                  articles={approvedArticles}
                  isLoading={isLoading}
                  onOpenArticle={onOpenArticle}
                  onOpenAnnouncementManager={onOpenAnnouncementManager}
                />
              )}
            </div>
          )}

          {/* MIDDLE COLUMN: 2 fractions (2/4 = 1/2) */}
          {(showFeaturedSlider || showSpotlight) && (
            <div className={`${!showUncleHo && !showAnnouncements ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-4`}>
              {showFeaturedSlider && (
                <HomeMiddleFeaturedSlider
                  articles={approvedArticles}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onOpenArticle={onOpenArticle}
                  onEditArticle={onEditArticle}
                  onDeleteArticle={onDeleteArticle}
                />
              )}

              {showSpotlight && (
                <HomeSpotlightSection
                  articles={approvedArticles}
                  spotlightArticleId={siteConfig?.spotlightArticleId}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onOpenArticle={onOpenArticle}
                  onEditArticle={onEditArticle}
                  onSelectSpotlightArticle={onSelectSpotlightArticle}
                />
              )}
            </div>
          )}

          {/* RIGHT COLUMN: 1 fraction (1/4) */}
          {(showLatestNews || showQuickActions) && (
            <div className="lg:col-span-1 flex flex-col gap-4">
              {showLatestNews && (
                <HomeLatestNewsWidget
                  articles={approvedArticles}
                  isLoading={isLoading}
                  onOpenArticle={onOpenArticle}
                  onSelectSection={onSelectSection}
                />
              )}

              {showQuickActions && (
                <HomeQuickActionsWidget
                  cards={quickActionCards}
                  currentUser={currentUser}
                  onSelectSection={onSelectSection}
                  onOpenQuickActionManager={() => setIsQuickActionModalOpen(true)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          2. BOTTOM SECTION: TIN TỨC & SỰ KIỆN THEO CHUYÊN MỤC
         ======================================================== */}
      {showCategoryColumns && (
        <div className="space-y-4 pt-2">
          {/* Banner Title Bar */}
          <div className="bg-linear-to-r from-red-800 via-red-900 to-amber-950 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between border-l-4 border-amber-400">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-amber-300" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                TIN TỨC, HOẠT ĐỘNG TOÀN DIỆN ĐƠN VỊ
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsSectionManagerModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 hover:text-white border border-amber-300/40 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Thêm / Sửa / Nhúng nội dung các chuyên mục trang chủ"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-300" />
                  <span>QUẢN LÝ CHUYÊN MỤC</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectSection('ctd')}
                className="text-[11px] text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Tất cả tin bài</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dynamic Equal-Height / Dynamic Size Categories & Embedded Content Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {activeColumns.map((col) => {
              const isEmbed = col.type === 'embed_code';
              const colArticles = isEmbed
                ? []
                : approvedArticles
                    .filter((a) => {
                      const matchSection = !col.sectionKey || a.sectionKey === col.sectionKey || (!a.sectionKey && col.sectionKey === 'ctd');
                      const matchCategory =
                        !col.categoryFilter ||
                        col.categoryFilter === 'all' ||
                        !a.category ||
                        a.category.trim().toLowerCase() === col.categoryFilter.trim().toLowerCase();
                      return matchSection && matchCategory;
                    })
                    .slice(0, col.articleLimit || 4);

              const colSpanClass =
                col.colSpan === 'full' || col.colSpan === '3'
                  ? 'col-span-1 md:col-span-2 lg:col-span-3'
                  : col.colSpan === '2'
                  ? 'col-span-1 md:col-span-2'
                  : 'col-span-1';

              return (
                <div
                  key={col.id}
                  className={`${colSpanClass} bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between h-auto hover:shadow-md transition-all group`}
                >
                  <div className="flex-1 flex flex-col">
                    {/* Column Header */}
                    <div
                      className={`px-3.5 py-2.5 ${
                        col.headerBgColor || 'bg-red-50'
                      } border-b border-gray-200/80 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase truncate">
                        {getColumnIcon(col.iconName)}
                        <span
                          className={`${
                            col.headerTextColor || 'text-gray-900'
                          } truncate font-extrabold`}
                        >
                          {col.title}
                        </span>
                      </div>
                      {col.sectionKey && (
                        <button
                          type="button"
                          onClick={() => onSelectSection(col.sectionKey as PageView)}
                          className="text-[10px] text-gray-600 hover:text-gray-900 font-bold shrink-0 hover:underline cursor-pointer"
                        >
                          Xem thêm →
                        </button>
                      )}
                    </div>

                    {/* Subtitle if any */}
                    {col.subtitle && (
                      <div className="px-3.5 py-1 bg-gray-50/70 border-b border-gray-100 text-[10px] text-gray-500 truncate">
                        {col.subtitle}
                      </div>
                    )}

                    {/* Column Body: Either Embedded Code or Articles */}
                    {isEmbed ? (
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        {col.embedCode || col.embedHtml ? (
                          <div
                            className="w-full flex-1 min-h-[240px] rounded-lg overflow-hidden border border-gray-200 bg-black/5 flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: col.embedCode || col.embedHtml || '' }}
                          />
                        ) : col.embedUrl ? (
                          <iframe
                            src={col.embedUrl}
                            title={col.title}
                            className="w-full flex-1 min-h-[240px] rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="text-center text-xs text-gray-400 py-8 italic flex-1 flex items-center justify-center">
                            Chưa cấu hình mã nhúng hoặc liên kết nguồn
                          </div>
                        )}
                      </div>
                    ) : isLoading ? (
                      <div className="p-3 divide-y divide-gray-100 space-y-2.5 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="pt-2 first:pt-0 space-y-1.5 animate-pulse">
                            <div className="w-11/12 h-3.5 bg-gray-200 rounded" />
                            <div className="w-1/2 h-2.5 bg-gray-200 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 divide-y divide-gray-100 space-y-2 flex-1">
                        {colArticles.length > 0 ? (
                          colArticles.map((art) => (
                            <div
                              key={art.id}
                              onClick={() => onOpenArticle(art)}
                              className="pt-2 first:pt-0 group/item cursor-pointer"
                            >
                              <h4 className="text-xs font-bold text-gray-800 group-hover/item:text-red-700 leading-snug line-clamp-2 transition-colors">
                                {art.title}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                <span className="truncate max-w-[120px]">{art.author}</span>
                                <span>•</span>
                                <span>{art.date}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-gray-400">
                            <p className="text-xs italic">Đang cập nhật tin bài...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Column Footer */}
                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center mt-auto">
                    {col.sectionKey ? (
                      <button
                        type="button"
                        onClick={() => onSelectSection(col.sectionKey as PageView)}
                        className="text-[11px] font-bold text-teal-800 hover:text-teal-950 inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Vào chuyên mục {col.title}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : isEmbed && col.embedUrl ? (
                      <a
                        href={col.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem nguồn trực tiếp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">
                        Khung nhúng nội dung số
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          3. QUICK LIBRARY & LEARNING ASSETS PREVIEW
         ======================================================== */}
      {showQuickLibrary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Quick Documents Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                <FolderArchive className="w-4 h-4" />
                <span>KHO VĂN BẢN QUÂN SỰ MỚI NHẤT</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('doc')}
                className="text-[11px] text-amber-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 divide-y divide-gray-100 space-y-2 flex-1">
              {documents.slice(0, 4).map((d) => (
                <div key={d.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        {d.code}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">{d.date}</span>
                    </div>
                    <h4
                      onClick={() => onSelectSection('doc')}
                      className="text-xs font-bold text-gray-800 hover:text-blue-800 line-clamp-1 cursor-pointer mt-1"
                    >
                      {d.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFastDownloadDoc(d)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-800 text-blue-800 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Tải về tệp này"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Lectures Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-teal-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-teal-200">
                <Laptop className="w-4 h-4 text-teal-300" />
                <span>BÀI GIẢNG ĐIỆN TỬ SỐ HÓA</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('lecture')}
                className="text-[11px] text-teal-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 divide-y divide-gray-100 space-y-2 flex-1">
              {lectures.slice(0, 4).map((l) => (
                <div key={l.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        {l.target}
                      </span>
                      <span className="text-[10px] text-gray-500">{l.author}</span>
                    </div>
                    <h4
                      onClick={() => onSelectSection('lecture')}
                      className="text-xs font-bold text-gray-800 hover:text-teal-800 line-clamp-1 cursor-pointer mt-1"
                    >
                      {l.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFastDownloadLecture(l)}
                    className="p-1.5 bg-teal-50 hover:bg-teal-800 text-teal-800 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Tải bài giảng về"
                  >
                    <HardDriveDownload className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Manager Modal */}
      {isQuickActionModalOpen && (
        <QuickActionManagerModal
          cards={quickActionCards}
          onSave={(updatedCards) => {
            if (onSaveQuickActions) {
              onSaveQuickActions(updatedCards);
            }
          }}
          onClose={() => setIsQuickActionModalOpen(false)}
        />
      )}

      {/* Home Section Manager Modal */}
      {isSectionManagerModalOpen && siteConfig && (
        <HomeSectionManagerModal
          isOpen={isSectionManagerModalOpen}
          siteConfig={siteConfig}
          onClose={() => setIsSectionManagerModalOpen(false)}
          onSaveColumns={(columns) => {
            if (onSaveHomeCategoryColumns) {
              onSaveHomeCategoryColumns(columns);
            }
          }}
        />
      )}

      {/* Layout Manager Modal for Admin */}
      {isLayoutModalOpen && siteConfig && (
        <LayoutManagerModal
          isOpen={isLayoutModalOpen}
          onClose={() => setIsLayoutModalOpen(false)}
          siteConfig={siteConfig}
          onSaveLayout={(newLayout) => {
            if (onSaveLayoutSettings) {
              onSaveLayoutSettings(newLayout);
            }
          }}
        />
      )}
    </div>
  );
};
