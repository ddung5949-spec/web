import React, { useState, useMemo, useEffect } from 'react';
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
import { ArticleList } from './ArticleList';
import { resolveArticleSection } from './TabContent';
import { CategoryManagerModal } from './modals/CategoryManagerModal';
import { defaultCategoriesConfig } from '../data/initialData';
import { supabase, getSupabase } from '../utils/supabase';

export interface CategoryViewProps {
  sectionKey?: SectionType;
  categoryId?: string;
  categories?: any[];
  articles: Article[];
  currentUser: User | null;
  siteConfig?: SiteConfig;
  isLoading?: boolean;
  selectedSub?: string;
  onSelectSub?: (sub: string) => void;
  onOpenArticle: (article: Article) => void;
  onOpenPostModal: (section: SectionType) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle: (articleId: number) => void;
  onSelectSection?: (section: PageView, sub?: string) => void;
  onGoHome?: () => void;
  onOpenTabIntroModal?: (tabKey: string) => void;
  onSaveCategories?: (categories: any[]) => void | Promise<void>;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  sectionKey,
  categoryId,
  categories,
  articles = [],
  currentUser,
  siteConfig,
  isLoading = false,
  selectedSub,
  onSelectSub,
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
  const currentKey = (categoryId || sectionKey || 'ctd') as SectionType;
  const isAdmin = currentUser?.role === 'admin';
  const canPost = !!(
    currentUser &&
    (isAdmin ||
      currentUser.role === 'editor' ||
      currentUser.role === 'commander' ||
      currentUser.canUploadDoc)
  );

  // Active subcategory state (synced with parent prop)
  const [localSelectedSub, setLocalSelectedSub] = useState<string>(selectedSub || 'all');
  useEffect(() => {
    if (selectedSub !== undefined) {
      setLocalSelectedSub(selectedSub);
    }
  }, [selectedSub]);

  const activeSub = selectedSub !== undefined ? selectedSub : localSelectedSub;
  const handleSelectSub = (sub: string) => {
    setLocalSelectedSub(sub);
    if (onSelectSub) onSelectSub(sub);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'views'>('latest');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Preset configurations for known system sections
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
  }[currentKey as 'ctd' | 'hl' | 'bac'];

  // Current category definition
  const categoriesList =
    (categories && Array.isArray(categories) && categories.length > 0 ? categories : null) ||
    siteConfig?.categories_config ||
    (siteConfig as any)?.categoriesConfig ||
    (siteConfig as any)?.categories ||
    defaultCategoriesConfig;

  const currentCategory = useMemo(() => {
    return Array.isArray(categoriesList)
      ? categoriesList.find(
          (c: any) =>
            c &&
            (c.id === currentKey ||
              c.targetPage === currentKey ||
              c.name === currentKey ||
              c.navName === currentKey ||
              c.shortLabel === currentKey)
        )
      : undefined;
  }, [categoriesList, currentKey]);

  const customSec = siteConfig?.sections?.[currentKey as keyof typeof siteConfig.sections];
  const sectionTitle =
    currentCategory?.name ||
    currentCategory?.navName ||
    customSec?.title ||
    baseConfig?.title ||
    'Chuyên mục';
  const sectionSubtitle =
    currentCategory?.description ||
    customSec?.subTitle ||
    customSec?.desc ||
    baseConfig?.subTitle ||
    '';

  const Icon = baseConfig?.icon || Shield;

  // Raw section articles
  const rawSectionArticles = useMemo(() => {
    return (articles || []).filter((a) => {
      const resolved = resolveArticleSection(a.category, a.sectionKey);
      return (
        resolved === currentKey ||
        a.sectionKey === currentKey ||
        (a.category &&
          currentCategory?.subcategories &&
          Array.isArray(currentCategory.subcategories) &&
          currentCategory.subcategories.some(
            (sub: any) =>
              (typeof sub === 'string' ? sub : sub?.name || '').toLowerCase() ===
              (typeof a.category === 'string' ? a.category : (a.category as any)?.name || '').toLowerCase()
          ))
      );
    });
  }, [articles, currentKey, currentCategory]);

  const totalCount = rawSectionArticles.length;

  // Count articles for each subcategory
  const countArticlesBySub = (subName: string) => {
    const target = subName.trim().toLowerCase();
    return rawSectionArticles.filter((a) => {
      const catStr = (
        typeof a.category === 'string'
          ? a.category
          : (a.category as any)?.name || (a.category as any)?.label || ''
      ).trim().toLowerCase();
      return catStr === target;
    }).length;
  };

  // Real-time total views calculation
  const totalViews = useMemo(() => {
    return rawSectionArticles.reduce((sum, a) => sum + (Number(a.views) || 0), 0);
  }, [rawSectionArticles]);

  // Filtered & sorted articles list
  const filteredArticles = useMemo(() => {
    return rawSectionArticles
      .filter((a) => {
        const catStr = (
          typeof a.category === 'string'
            ? a.category
            : (a.category as any)?.name || (a.category as any)?.label || ''
        ).trim().toLowerCase();

        const matchCat =
          activeSub === 'all' ||
          catStr === activeSub.trim().toLowerCase();

        const matchQuery =
          !searchQuery.trim() ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.summary && a.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (a.author && a.author.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchCat && matchQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
        return Number(b.id) - Number(a.id);
      });
  }, [rawSectionArticles, activeSub, searchQuery, sortBy]);

  // Direct Supabase save handler when editing category subcategories
  const handleDirectSaveCategories = async (updatedCategories: any[]) => {
    try {
      const client = supabase || getSupabase();
      if (!client) {
        alert('Lỗi lưu Supabase: Không tìm thấy kết nối');
        return;
      }

      const { error } = await client
        .from('site_config')
        .upsert(
          {
            id: 'default',
            categories_config: updatedCategories,
            navigation_tabs: updatedCategories,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        alert('Lỗi lưu Supabase: ' + error.message);
        return;
      }

      alert('✅ ĐÃ LƯU TIỂU MỤC VÀO CƠ SỞ DỮ LIỆU THÀNH CÔNG!');

      // Update global state and localStorage immediately
      localStorage.setItem('cached_categories', JSON.stringify(updatedCategories));
      if (onSaveCategories) {
        await onSaveCategories(updatedCategories);
      }
    } catch (err: any) {
      alert('Lỗi lưu Supabase: ' + (err?.message || 'Lỗi mạng'));
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Breadcrumbs */}
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
        {activeSub !== 'all' && (
          <>
            <span>/</span>
            <span className="text-red-700 font-semibold">{activeSub}</span>
          </>
        )}
      </nav>

      {/* 2. Top Header Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 text-white shadow-md bg-gradient-to-r ${
          baseConfig?.headerBg || 'from-emerald-950 via-emerald-900 to-teal-950'
        } border-2 border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
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
            <p className="text-xs text-white/85 max-w-2xl mt-0.5">{sectionSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {isAdmin && onOpenTabIntroModal && (
            <button
              type="button"
              onClick={() => onOpenTabIntroModal(currentKey)}
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
              id={`btn-post-draft-${currentKey}`}
              onClick={() => onOpenPostModal(currentKey)}
              className="bg-amber-400 hover:bg-amber-300 text-red-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 border border-amber-200"
            >
              <PlusCircle className="w-4 h-4 text-red-900" />
              <span>GỬI DỰ THẢO BÀI MỚI</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Library Structure: Left 1/4, Right 3/4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        {/* ================= LEFT COLUMN: 1/4 (DANH MỤC TÀI LIỆU CHỈ LẤY TIỂU MỤC CON) ================= */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card 1: Ngăn Phân loại Danh mục */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-red-700" />
                <span>Danh mục tài liệu</span>
              </span>
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 border border-amber-300 transition-colors cursor-pointer"
                    title="Quản lý / chỉnh sửa phân loại danh mục"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>[ ✎ Sửa danh mục ]</span>
                  </button>
                )}
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {(currentCategory?.subcategories || []).length + 1}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-1">
              {/* Nút hiển thị Tất cả bài viết */}
              <button
                type="button"
                onClick={() => handleSelectSub('all')}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSub === 'all'
                    ? 'bg-red-800 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">Tất cả bài viết ({totalCount})</span>
                </div>
              </button>

              {/* Duyệt qua mảng tiểu mục con của CHÍNH chuyên mục này - TUYỆT ĐỐI KHÔNG lặp danh mục cha */}
              {(currentCategory?.subcategories || []).map((subItem: any, index: number) => {
                const subName =
                  typeof subItem === 'string'
                    ? subItem.trim()
                    : (subItem?.name || subItem?.title || subItem?.label || '').trim();
                if (!subName) return null;

                const count = countArticlesBySub(subName);
                const isSelected =
                  activeSub === subName ||
                  activeSub.trim().toLowerCase() === subName.toLowerCase();

                return (
                  <button
                    key={`${subName}-${index}`}
                    type="button"
                    onClick={() => handleSelectSub(subName)}
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
                      <span className="truncate text-left">{subName}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Thống kê chuyên trang */}
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
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 3/4 (KHUNG TIN BÀI BÁO ĐIỆN TỬ) ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar: Tìm kiếm & Sắp xếp */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Tìm kiếm trong ${sectionTitle.toLowerCase()}...`}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className="text-xs text-gray-500 font-medium">Sắp xếp:</span>
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
                <button
                  type="button"
                  onClick={() => setSortBy('latest')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    sortBy === 'latest'
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mới nhất
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('views')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    sortBy === 'views'
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lượt xem
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {activeSub !== 'all' && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-red-900">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-red-700" />
                <span>
                  Đang lọc theo tiểu mục:{' '}
                  <span className="font-extrabold text-red-950 uppercase">{activeSub}</span> ({filteredArticles.length} bài)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectSub('all')}
                className="text-red-700 hover:text-red-900 underline font-bold cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>
          )}

          {/* Article List / Empty State */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Đang tải dữ liệu bài viết...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
              <FolderArchive className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-gray-700">Chưa có bài viết nào</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {searchQuery || activeSub !== 'all'
                  ? 'Không tìm thấy bài viết phù hợp với tiêu chí tìm kiếm. Hãy thử chọn tiểu mục khác hoặc xóa từ khóa.'
                  : 'Chuyên mục này hiện chưa có bài viết được xuất bản.'}
              </p>
              {canPost && (
                <button
                  type="button"
                  onClick={() => onOpenPostModal(currentKey)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Gửi bài viết đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <ArticleList
                articles={filteredArticles}
                searchQuery={searchQuery}
                canEdit={isAdmin || currentUser?.role === 'editor'}
                canDelete={isAdmin}
                onOpenArticle={onOpenArticle}
                onEditArticle={onEditArticle}
                onDeleteArticle={onDeleteArticle}
              />
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          sectionKey={currentKey}
          sectionTitle={sectionTitle}
          categories={categoriesList}
          initialCategories={currentCategory?.subcategories || []}
          onSave={handleDirectSaveCategories}
          onSaveCategories={handleDirectSaveCategories}
        />
      )}
    </div>
  );
};

export const CategoryPage = CategoryView;
export const SectionView = CategoryView;
