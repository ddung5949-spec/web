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
  Flag,
  FolderLock,
  Globe,
  Heart,
  Laptop,
  Layers,
  LayoutGrid,
  Newspaper,
  Plus,
  PlusCircle,
  Shield,
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

interface HomeViewProps {
  articles: Article[];
  documents?: DocumentItem[];
  lectures?: LectureItem[];
  uncleHoQuotes?: UncleHoQuote[];
  uncleHoSettings?: UncleHoSettings;
  currentUser?: User | null;
  siteConfig?: SiteConfig;
  onOpenArticle: (article: Article) => void;
  onSelectSection: (section: PageView) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
  onOpenUncleHoManager?: () => void;
  onSaveUncleHoQuotes?: (quotes: UncleHoQuote[]) => void;
  onOpenAnnouncementManager?: () => void;
  onSaveQuickActions?: (cards: QuickActionCard[]) => void;
  onSaveHomeCategoryColumns?: (columns: HomeCategoryColumn[]) => void;
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
  onOpenArticle,
  onSelectSection,
  onEditArticle,
  onDeleteArticle,
  onOpenUncleHoManager = () => {},
  onSaveUncleHoQuotes,
  onOpenAnnouncementManager = () => {},
  onSaveQuickActions,
  onSaveHomeCategoryColumns,
  onSelectSpotlightArticle,
  onOpenAuthModal = () => {},
  onOpenProfileModal = () => {},
  onLogout = () => {},
  onOpenCustomizer = () => {},
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const approvedArticles = articles.filter((a) => a.status === 'approved');

  // Quick Action Manager modal state for Admin
  const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
  const [isSectionManagerModalOpen, setIsSectionManagerModalOpen] = useState(false);

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
      bgGradient: 'from-rose-900 via-pink-900 to-purple-950',
      borderColor: 'border-pink-500/30',
      textColor: 'text-pink-200',
      heightSize: 'md',
      enabled: true,
    },
  ];

  // Enabled Home Category Columns
  const activeColumns: HomeCategoryColumn[] = (
    siteConfig?.homeCategoryColumns !== undefined
      ? siteConfig.homeCategoryColumns
      : defaultHomeCategoryColumns
  ).filter((col) => col.enabled !== false);

  const getColumnIcon = (iconName?: string) => {
    switch (iconName) {
      case 'crosshair':
        return <Crosshair className="w-3.5 h-3.5 text-emerald-700" />;
      case 'heart':
        return <Heart className="w-3.5 h-3.5 text-amber-600" />;
      case 'shield':
        return <Shield className="w-3.5 h-3.5 text-blue-700" />;
      case 'book':
        return <BookOpen className="w-3.5 h-3.5 text-teal-700" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-rose-700" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-purple-700" />;
      case 'globe':
        return <Globe className="w-3.5 h-3.5 text-sky-700" />;
      case 'star':
        return <Star className="w-3.5 h-3.5 text-yellow-600" />;
      case 'award':
        return <Award className="w-3.5 h-3.5 text-amber-600" />;
      case 'flag':
      default:
        return <Flag className="w-3.5 h-3.5 text-red-700" />;
    }
  };
  const ctdArticles = approvedArticles.filter((a) => a.sectionKey === 'ctd').slice(0, 3);
  const hlArticles = approvedArticles.filter((a) => a.sectionKey === 'hl').slice(0, 3);
  const bacArticles = approvedArticles.filter((a) => a.sectionKey === 'bac').slice(0, 3);

  const recentDocs = documents.slice(0, 3);
  const recentLectures = lectures.slice(0, 2);

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

  return (
    <div className="space-y-6">
      {/* ========================================================
          1. 4-FRACTION TOP MAIN SECTION (Requested layout)
          - Left Column (1 fraction = 1/4):
              + Lời Bác dạy ngày này năm xưa
              + Thông báo & Sự kiện quan trọng
          - Center Column (2 fractions = 2/4):
              + Featured Carousel Slider
              + Bài đăng mới nhất, tiêu biểu
          - Right Column (1 fraction = 1/4):
              + Tin mới nhất
              + Tiện ích quân nhân / Cuộc thi trực tuyến
          - All 3 top blocks have matching heights!
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* LEFT COLUMN: 1 fraction (1/4) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Top Block: Lời Bác dạy */}
          <UncleHoDailySection
            quotes={uncleHoQuotes}
            settings={uncleHoSettings}
            currentUser={currentUser}
            onOpenManager={onOpenUncleHoManager}
            onSaveQuotes={onSaveUncleHoQuotes}
            layout="vertical"
          />

          {/* Bottom Block: Khung Thông báo & Sự kiện quan trọng */}
          <HomeAnnouncementsWidget
            announcements={announcements}
            currentUser={currentUser}
            articles={approvedArticles}
            onOpenArticle={onOpenArticle}
            onOpenAnnouncementManager={onOpenAnnouncementManager}
          />
        </div>

        {/* MIDDLE COLUMN: 2 fractions (2/4 = 1/2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Top Block: Slider tin tức tiêu điểm */}
          <HomeMiddleFeaturedSlider
            articles={approvedArticles}
            currentUser={currentUser}
            onOpenArticle={onOpenArticle}
            onEditArticle={onEditArticle}
            onDeleteArticle={onDeleteArticle}
          />

          {/* Bottom Block: Bài đăng mới nhất / Tiêu biểu */}
          <HomeSpotlightSection
            articles={approvedArticles}
            spotlightArticleId={siteConfig?.spotlightArticleId}
            currentUser={currentUser}
            onOpenArticle={onOpenArticle}
            onEditArticle={onEditArticle}
            onSelectSpotlightArticle={onSelectSpotlightArticle}
          />
        </div>

        {/* RIGHT COLUMN: 1 fraction (1/4) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Top Block: Tin mới nhất */}
          <HomeLatestNewsWidget
            articles={approvedArticles}
            onOpenArticle={onOpenArticle}
            onSelectSection={onSelectSection}
          />

          {/* Bottom Block: Tiện ích quân nhân & Cuộc thi trực tuyến */}
          <HomeQuickActionsWidget
            cards={quickActionCards}
            currentUser={currentUser}
            onSelectSection={onSelectSection}
            onOpenQuickActionManager={() => setIsQuickActionModalOpen(true)}
          />
        </div>
      </div>

      {/* ========================================================
          2. BOTTOM SECTION: TIN TỨC & SỰ KIỆN THEO CHUYÊN MỤC
         ======================================================== */}
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
                <span>QUẢN LÝ CHUYÊN MỤC TRANG CHỦ</span>
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
                    const matchSection = a.sectionKey === col.sectionKey;
                    const matchCategory =
                      !col.categoryFilter ||
                      col.categoryFilter === 'all' ||
                      a.category === col.categoryFilter;
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
    </div>
  );
};
