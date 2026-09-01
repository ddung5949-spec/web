import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ChevronRight,
  Crosshair,
  Filter,
  Heart,
  Home,
  Layers,
  PlusCircle,
  Search,
  Shield,
} from 'lucide-react';
import { Article, SectionType, SiteConfig, User } from '../types';
import { ArticleList } from './ArticleList';

// Helper function to resolve which Tab an article belongs to
export const resolveArticleSection = (
  category?: string,
  sectionKey?: string
): SectionType => {
  const rawSec = (sectionKey || '').toLowerCase().trim();
  if (rawSec === 'hl' || rawSec === 'huan_luyen' || rawSec === 'huanluyen') return 'hl';
  if (rawSec === 'bac' || rawSec === 'hoc_tap_bac' || rawSec === 'bac_ho' || rawSec === 'hoctapbac') return 'bac';
  if (rawSec === 'ctd' || rawSec === 'ctct') return 'ctd';

  const cat = (category || '').toLowerCase().trim();

  // 1. Học tập và làm theo Bác
  if (
    cat.includes('bác') ||
    cat.includes('hồ chí minh') ||
    cat.includes('tư tưởng') ||
    cat.includes('lời bác') ||
    cat.includes('gương sáng') ||
    cat.includes('mẩu chuyện về bác') ||
    cat.includes('thấm nhuần lời bác') ||
    cat.includes('đạo đức hồ chí minh')
  ) {
    return 'bac';
  }

  // 2. Huấn luyện & Sẵn sàng chiến đấu
  if (
    cat.includes('huấn luyện') ||
    cat.includes('sẵn sàng') ||
    cat.includes('sscđ') ||
    cat.includes('thao trường') ||
    cat.includes('bắn súng') ||
    cat.includes('kỹ chiến thuật') ||
    cat.includes('điều lệnh') ||
    cat.includes('thể lực') ||
    cat.includes('khí tài') ||
    cat.includes('diễn tập') ||
    cat.includes('hậu cần') ||
    cat.includes('kỹ thuật') ||
    cat.includes('quân sự')
  ) {
    return 'hl';
  }

  // 3. Công tác Đảng - Công tác Chính trị (Tuyên huấn, Tổ chức, Cán bộ, Thi đua, Bảo vệ an ninh, Dân vận, Tin tức hoạt động,...)
  return 'ctd';
};

interface TabContentProps {
  sectionKey: SectionType;
  articles: Article[];
  currentUser: User | null;
  siteConfig?: SiteConfig;
  onOpenArticle: (article: Article) => void;
  onOpenPostModal?: (section: SectionType) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
  onGoHome?: () => void;
}

export const TabContent: React.FC<TabContentProps> = ({
  sectionKey,
  articles,
  currentUser,
  siteConfig,
  onOpenArticle,
  onOpenPostModal,
  onEditArticle,
  onDeleteArticle,
  onGoHome,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const canPost = Boolean(
    currentUser && (isAdmin || currentUser.role === 'editor' || currentUser.role === 'commander' || currentUser.canUploadDoc)
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'views'>('latest');

  // Tab theme & configuration
  const tabConfig = {
    ctd: {
      title: 'Công tác Đảng - Công tác Chính trị',
      subTitle: 'Bản tin Tuyên huấn, Xây dựng Đảng & Hoạt động Công tác quần chúng',
      icon: Shield,
      headerBg: 'from-red-900 via-red-800 to-rose-950',
      activeColor: 'bg-red-800 text-white',
    },
    hl: {
      title: 'Huấn luyện & Sẵn sàng chiến đấu',
      subTitle: 'Bản tin Thao trường, Diễn tập, Kỹ thuật Khí tài & Rèn nghiêm kỷ luật',
      icon: Crosshair,
      headerBg: 'from-emerald-950 via-emerald-900 to-teal-950',
      activeColor: 'bg-emerald-800 text-white',
    },
    bac: {
      title: 'Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh',
      subTitle: 'Tỏa sáng phẩm chất cao đẹp "Bộ đội Cụ Hồ" trong thời kỳ mới',
      icon: Heart,
      headerBg: 'from-amber-950 via-amber-900 to-yellow-950',
      activeColor: 'bg-amber-700 text-white',
    },
  }[sectionKey];

  const categoriesList = siteConfig?.categories_config || (siteConfig as any)?.categoriesConfig || (siteConfig as any)?.categories;
  const configuredCategory = Array.isArray(categoriesList)
    ? categoriesList.find((c: any) =>
        c.id === sectionKey ||
        c.targetPage === sectionKey ||
        c.name === sectionKey ||
        c.navName === sectionKey ||
        c.shortLabel === sectionKey
      )
    : undefined;

  const customSec = siteConfig?.sections?.[sectionKey as keyof typeof siteConfig.sections];
  const sectionTitle = configuredCategory?.name || customSec?.title || tabConfig.title;
  const sectionSubtitle = configuredCategory?.description || customSec?.subTitle || customSec?.desc || tabConfig.subTitle;
  const Icon = tabConfig.icon;

  // Lọc tất cả các bài thuộc tab hiện tại (dùng resolveArticleSection)
  const tabArticles = useMemo(() => {
    return articles.filter((a) => {
      const resolved = resolveArticleSection(a.category, a.sectionKey);
      return resolved === sectionKey;
    });
  }, [articles, sectionKey]);

  // Lấy danh sách chuyên mục con cho tab động 100%
  const availableCategories = useMemo(() => {
    if (configuredCategory && Array.isArray(configuredCategory.subcategories) && configuredCategory.subcategories.length > 0) {
      return configuredCategory.subcategories;
    }
    if (configuredCategory && Array.isArray((configuredCategory as any).categories) && (configuredCategory as any).categories.length > 0) {
      return (configuredCategory as any).categories;
    }
    if (customSec && Array.isArray((customSec as any).categories) && (customSec as any).categories.length > 0) {
      return (customSec as any).categories as string[];
    }
    return [];
  }, [configuredCategory, customSec]);

  // Lọc theo Category và Từ khóa tìm kiếm
  const filteredArticles = useMemo(() => {
    return tabArticles
      .filter((a) => {
        const matchCategory =
          selectedCategory === 'all' ||
          (a.category && a.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());

        const query = searchQuery.trim().toLowerCase();
        const matchQuery =
          !query ||
          (a.title && a.title.toLowerCase().includes(query)) ||
          (a.summary && a.summary.toLowerCase().includes(query)) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(query)) ||
          (a.author && a.author.toLowerCase().includes(query));

        return matchCategory && matchQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
        return Number(b.id) - Number(a.id);
      });
  }, [tabArticles, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* 1. Breadcrumb */}
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
        className={`rounded-2xl p-4 sm:p-5 text-white shadow-md bg-gradient-to-r ${tabConfig.headerBg} border-2 border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
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
              <span className="text-xs text-white/80 font-medium">
                • {tabArticles.length} bài viết đã đồng bộ
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

        {canPost && onOpenPostModal && (
          <button
            type="button"
            onClick={() => onOpenPostModal(sectionKey)}
            className="bg-amber-400 hover:bg-amber-300 text-red-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 border border-amber-200"
          >
            <PlusCircle className="w-4 h-4 text-red-900" />
            <span>GỬI DỰ THẢO BÀI MỚI</span>
          </button>
        )}
      </div>

      {/* 3. Main Grid Layout: Left 1/4 (Categories), Right 3/4 (Articles) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        {/* Left Column: Chuyên mục con */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-red-700" />
                <span>Danh mục tài liệu</span>
              </span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                {availableCategories.length + 1}
              </span>
            </div>

            <div className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'all'
                    ? tabConfig.activeColor
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
                  {tabArticles.length}
                </span>
              </button>

              {availableCategories.map((cat) => {
                const count = tabArticles.filter(
                  (a) => a.category && a.category.trim().toLowerCase() === cat.trim().toLowerCase()
                ).length;
                const isSelected = selectedCategory.trim().toLowerCase() === cat.trim().toLowerCase();

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? tabConfig.activeColor
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
        </div>

        {/* Right Column: Danh sách bài viết */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Sort */}
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

          {/* Filter Notice Pill */}
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
                {' '}({filteredArticles.length} bài)
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

          {/* Article List Component */}
          <ArticleList
            articles={filteredArticles}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            canEdit={isAdmin}
            canDelete={isAdmin}
            onOpenArticle={onOpenArticle}
            onEditArticle={onEditArticle}
            onDeleteArticle={onDeleteArticle}
            onResetFilter={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            onOpenPostModal={onOpenPostModal ? () => onOpenPostModal(sectionKey) : undefined}
          />
        </div>
      </div>
    </div>
  );
};
