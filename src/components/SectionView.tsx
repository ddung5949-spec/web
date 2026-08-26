import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Edit2,
  Edit3,
  Eye,
  FileText,
  Filter,
  FolderArchive,
  FolderLock,
  FolderOpen,
  Heart,
  Home,
  Laptop,
  Layers,
  PlusCircle,
  Search,
  Shield,
  Sparkles,
  Tag,
  UserCheck,
} from 'lucide-react';
import { Article, PageView, SectionType, SiteConfig, User } from '../types';
import { ArticleCard } from './ArticleCard';
import { categoryOptions } from '../data/initialData';
import { CategoryManagerModal } from './modals/CategoryManagerModal';

interface SectionViewProps {
  sectionKey: SectionType;
  articles: Article[];
  currentUser: User | null;
  siteConfig?: SiteConfig;
  onOpenArticle: (article: Article) => void;
  onOpenPostModal: (section: SectionType) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle: (articleId: number) => void;
  onSelectSection?: (section: PageView) => void;
  onGoHome?: () => void;
  onOpenTabIntroModal?: (tabKey: string) => void;
  onSaveCategories?: (categories: string[]) => void;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

export const SectionView: React.FC<SectionViewProps> = ({
  sectionKey,
  articles,
  currentUser,
  siteConfig,
  onOpenArticle,
  onOpenPostModal,
  onEditArticle,
  onDeleteArticle,
  onSelectSection,
  onGoHome,
  onOpenTabIntroModal,
  onSaveCategories,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const canPost = !!(currentUser && (isAdmin || currentUser.role === 'editor' || currentUser.role === 'commander' || currentUser.canUploadDoc));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'views'>('latest');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const baseConfig = {
    ctd: {
      title: 'Công tác Đảng - Công tác Chính trị',
      subTitle: 'Bản tin Tuyên huấn, Xây dựng Đảng & Hoạt động Công tác quần chúng',
      desc: 'Mọi cán bộ, chiến sĩ đều có thể gửi dự thảo tin bài. Ban biên tập sẽ kiểm duyệt và xuất bản.',
      icon: Shield,
      borderColor: 'border-red-700',
      headerBg: 'from-red-900 via-red-800 to-rose-950',
      accentColor: 'text-red-700',
      btnBg: 'bg-red-700 hover:bg-red-800',
      titleColor: 'text-[#7f1d1d]',
      activeTabBg: 'bg-red-700 text-white',
      badgeBg: 'bg-red-100 text-red-800 border-red-200',
    },
    hl: {
      title: 'Huấn luyện & Sẵn sàng chiến đấu',
      subTitle: 'Bản tin Thao trường, Diễn tập, Kỹ thuật Khí tài & Rèn nghiêm kỷ luật',
      desc: 'Cập nhật kết quả bắn đạn thật, diễn tập cơ động, sáng kiến cải tiến kỹ thuật trong toàn Sư đoàn.',
      icon: Crosshair,
      borderColor: 'border-emerald-800',
      headerBg: 'from-emerald-950 via-emerald-900 to-teal-950',
      accentColor: 'text-emerald-800',
      btnBg: 'bg-emerald-800 hover:bg-emerald-900',
      titleColor: 'text-emerald-900',
      activeTabBg: 'bg-emerald-800 text-white',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    bac: {
      title: 'Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh',
      subTitle: 'Tỏa sáng phẩm chất cao đẹp "Bộ đội Cụ Hồ" trong thời kỳ mới',
      desc: 'Những mẩu chuyện kể về Bác, gương người tốt việc tốt, mô hình sáng tạo của cán bộ, chiến sĩ Đoàn Mang Yang.',
      icon: Heart,
      borderColor: 'border-amber-600',
      headerBg: 'from-amber-950 via-amber-900 to-yellow-950',
      accentColor: 'text-amber-700',
      btnBg: 'bg-amber-700 hover:bg-amber-800',
      titleColor: 'text-amber-900',
      activeTabBg: 'bg-amber-700 text-white',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  }[sectionKey];

  const customSec = siteConfig?.sections?.[sectionKey as keyof typeof siteConfig.sections];
  const sectionTitle = customSec?.title || baseConfig.title;
  const sectionSubtitle = customSec?.subTitle || customSec?.desc || baseConfig.subTitle;

  const Icon = baseConfig.icon;

  const rawSectionArticles = useMemo(() => {
    return articles.filter(
      (a) =>
        (a.sectionKey === sectionKey || (!a.sectionKey && sectionKey === 'ctd')) &&
        (!a.status || a.status === 'approved' || a.status !== 'pending')
    );
  }, [articles, sectionKey]);

  const availableCategories = useMemo(() => {
    const baseCats: string[] = (customSec && (customSec as any).categories?.length > 0)
      ? (customSec as any).categories
      : categoryOptions[sectionKey] || [];

    const extraCats = rawSectionArticles
      .map((a) => a.category?.trim())
      .filter((cat): cat is string => Boolean(cat && !baseCats.some((b) => b.toLowerCase() === cat.toLowerCase())));

    return Array.from(new Set([...baseCats, ...extraCats]));
  }, [customSec, sectionKey, rawSectionArticles]);

  const totalViews = useMemo(() => {
    return rawSectionArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  }, [rawSectionArticles]);

  const filteredArticles = useMemo(() => {
    return rawSectionArticles
      .filter((a) => {
        const matchCat =
          selectedCategory === 'all' ||
          a.category === selectedCategory ||
          (a.category && selectedCategory && a.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
        const matchQuery =
          !searchQuery.trim() ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.summary && a.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (a.author && a.author.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCat && matchQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
        return b.id - a.id;
      });
  }, [rawSectionArticles, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* 1. Clickable Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={onGoHome}
          className="hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span className="text-gray-900 font-bold">{sectionTitle}</span>
      </nav>

      {/* 2. Top Header Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 text-white shadow-md bg-gradient-to-r ${baseConfig.headerBg} border-2 border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-400/20 rounded-xl border border-amber-300/30 text-amber-300 shrink-0">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-red-950">
                Thư viện số chuyên ngành
              </span>
              <span className="text-xs text-white/80 font-medium hidden sm:inline">
                • {rawSectionArticles.length} tài liệu đã xuất bản
              </span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide text-amber-200 mt-1">
              {sectionTitle}
            </h1>
            <p className="text-xs text-white/85 max-w-2xl mt-0.5">
              {sectionSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {isAdmin && onOpenTabIntroModal && (
            <button
              type="button"
              onClick={() => onOpenTabIntroModal(sectionKey)}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-xs"
              title="Chỉnh sửa nội dung giới thiệu tab này"
            >
              <Edit3 className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">SỬA GIỚI THIỆU TAB</span>
            </button>
          )}

          {canPost && (
            <button
              type="button"
              id={`btn-post-draft-${sectionKey}`}
              onClick={() => onOpenPostModal(sectionKey)}
              className="bg-amber-400 hover:bg-amber-300 text-red-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 border border-amber-200"
            >
              <PlusCircle className="w-4 h-4 text-red-900" />
              <span>GỬI DỰ THẢO BÀI MỚI</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Library Structure: Left 1/4 (Stats & Categories), Right 3/4 (Content News Frames) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        {/* ================= LEFT COLUMN: 1/4 (NGĂN THỐNG KÊ & PHÂN LOẠI DANH MỤC) ================= */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card 1: Ngăn Phân loại Danh mục */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-red-700" />
                <span>Danh mục tài liệu</span>
              </span>
              <div className="flex items-center gap-1.5">
                {isAdmin && onSaveCategories && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 border border-amber-300 transition-colors cursor-pointer"
                    title="Quản lý / chỉnh sửa phân loại danh mục"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Sửa danh mục</span>
                  </button>
                )}
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {availableCategories.length + 1}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-red-800 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">Tất cả tài liệu</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    selectedCategory === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {rawSectionArticles.length}
                </span>
              </button>

              {availableCategories.map((cat) => {
                const count = rawSectionArticles.filter(
                  (a) => a.category === cat || (a.category && a.category.trim().toLowerCase() === cat.trim().toLowerCase())
                ).length;
                const isSelected = selectedCategory === cat || selectedCategory.trim().toLowerCase() === cat.trim().toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-700 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ChevronRight
                        className={`w-3 h-3 shrink-0 ${
                          isSelected ? 'text-amber-300' : 'text-gray-400'
                        }`}
                      />
                      <span className="truncate text-left">{cat}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Thống kê thư viện số */}
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 text-white rounded-xl p-3.5 shadow-xs border border-gray-700 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-700 pb-2">
              <span className="font-extrabold text-xs uppercase tracking-wide text-amber-300 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Thống kê chuyên trang</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <div className="text-base font-black text-amber-300">{rawSectionArticles.length}</div>
                <div className="text-[10px] text-gray-300 font-medium uppercase mt-0.5">Bài viết</div>
              </div>
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <div className="text-base font-black text-cyan-300">{totalViews.toLocaleString()}</div>
                <div className="text-[10px] text-gray-300 font-medium uppercase mt-0.5">Lượt đọc</div>
              </div>
            </div>
          </div>

          {/* Card 3: Chuyển nhanh sang kho tài liệu khác */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs space-y-2">
            <span className="font-bold text-xs text-gray-700 block uppercase tracking-wide">
              Khám phá thêm:
            </span>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => onSelectSection && onSelectSection('doc')}
                className="w-full p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <FolderLock className="w-3.5 h-3.5 text-blue-700" />
                  <span>Kho Văn bản - Chỉ thị</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
              </button>

              <button
                type="button"
                onClick={() => onSelectSection && onSelectSection('lecture')}
                className="w-full p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-teal-700" />
                  <span>Thư viện Bài giảng số</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-teal-500" />
              </button>

              <button
                type="button"
                onClick={() => onSelectSection && onSelectSection('bac')}
                className="w-full p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-amber-700" />
                  <span>Không gian Học theo Bác</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 3/4 (HIỂN THỊ NỘI DUNG THEO KHUNG TIN) ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tiêu đề, tác giả..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:border-red-700 focus:bg-white focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-gray-500 font-medium">Sắp xếp:</span>
              <button
                type="button"
                onClick={() => setSortBy('latest')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Mới nhất
              </button>
              <button
                type="button"
                onClick={() => setSortBy('views')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  sortBy === 'views'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Xem nhiều nhất
              </button>
            </div>
          </div>

          {/* Active Filter Pill indicator if filtered */}
          {(selectedCategory !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200">
              <Filter className="w-3.5 h-3.5 text-amber-700" />
              <span>
                Đang lọc:{' '}
                {selectedCategory !== 'all' && (
                  <strong>Danh mục "{selectedCategory}"</strong>
                )}
                {searchQuery && (
                  <>
                    {' '}
                    từ khóa <strong>"{searchQuery}"</strong>
                  </>
                )}
                {' '}({filteredArticles.length} kết quả)
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="ml-auto text-red-700 font-bold hover:underline cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Article List / Grid */}
          <div className="space-y-3">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => onOpenArticle(article)}
                  canEdit={isAdmin}
                  onEdit={() => onEditArticle && onEditArticle(article)}
                  canDelete={isAdmin}
                  onDelete={() => onDeleteArticle(article.id)}
                />
              ))
            ) : (
              <div className="bg-white p-10 text-center text-gray-500 rounded-xl border border-gray-200 space-y-3 shadow-2xs">
                <BookOpen className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-xs font-semibold">
                  Không tìm thấy bài viết nào phù hợp với yêu cầu tìm kiếm.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-red-700 font-bold underline hover:text-red-800 cursor-pointer"
                  >
                    Xem tất cả bài viết
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPostModal(sectionKey)}
                    className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Gửi bài viết mới ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Manager Modal */}
      {isCategoryModalOpen && onSaveCategories && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          sectionTitle={sectionTitle}
          categories={availableCategories}
          itemCountByCategory={(() => {
            const map: Record<string, number> = {};
            availableCategories.forEach((cat: string) => {
              map[cat] = rawSectionArticles.filter(
                (a) => a.category === cat || (a.category && a.category.trim().toLowerCase() === cat.trim().toLowerCase())
              ).length;
            });
            return map;
          })()}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={(newCategories) => {
            onSaveCategories(newCategories);
          }}
          onRenameCategory={onRenameCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
};


