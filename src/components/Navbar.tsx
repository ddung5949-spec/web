import React, { useEffect, useRef, useState } from 'react';
import {
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ExternalLink,
  FolderLock,
  Globe,
  Heart,
  Home,
  Laptop,
  Layers,
  Link as LinkIcon,
  Newspaper,
  Palette,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { NavTabItem, PageView, SiteConfig, User } from '../types';
import { defaultNavTabs } from '../data/initialData';

interface NavbarProps {
  currentPage: PageView;
  onSelectPage: (page: PageView) => void;
  currentUser: User | null;
  pendingDraftsCount: number;
  onOpenCustomizer: () => void;
  onOpenCategoryManager?: () => void;
  onOpenGlobalSearch?: () => void;
  siteConfig?: SiteConfig;
  categories?: any[];
  armyGreenColor?: string;
  primaryRedColor?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onSelectPage,
  currentUser,
  pendingDraftsCount,
  onOpenCustomizer,
  onOpenCategoryManager,
  onOpenGlobalSearch,
  siteConfig,
  categories,
  armyGreenColor = '#143d2b',
  primaryRedColor = '#b91c1c',
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navScrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeDropdownTabId, setActiveDropdownTabId] = useState<string | null>(null);

  // Compute configured nav tabs with order and visibility
  const configuredNavTabs = React.useMemo<NavTabItem[]>(() => {
    const tabs: NavTabItem[] =
      siteConfig?.navTabs && siteConfig.navTabs.length > 0
        ? [...siteConfig.navTabs]
        : [...defaultNavTabs];

    // Include dynamically configured categories from categories or categories_config if not already in tabs
    const categoriesList =
      (categories && Array.isArray(categories) && categories.length > 0 ? categories : null) ||
      siteConfig?.categories_config ||
      (siteConfig as any)?.categoriesConfig ||
      (siteConfig as any)?.categories;

    if (Array.isArray(categoriesList) && categoriesList.length > 0) {
      categoriesList.forEach((cat: any, index: number) => {
        const exists = tabs.some(
          (t) => t.id === cat.id || t.targetPage === cat.id || t.targetPage === cat.targetPage
        );
        if (!exists && cat.id) {
          tabs.push({
            id: cat.id,
            label: cat.name || cat.navName || cat.id,
            short_name: cat.navName || cat.shortLabel || cat.name,
            targetPage: (cat.targetPage || cat.id) as PageView,
            type: cat.type || 'internal',
            externalUrl: cat.externalUrl,
            enabled: true,
            order: 20 + index,
          });
        }
      });
    }

    // Filter enabled tabs, exclude meeting, and sort by order
    return tabs
      .filter((t) => t.enabled !== false && t.id !== 'meeting' && t.targetPage !== 'meeting')
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [siteConfig?.navTabs, siteConfig?.sections, siteConfig?.categories_config]);

  // Helper to resolve display tab title according to priorities:
  // category_config.navName -> section.shortLabel -> tab.short_name -> tab.nav_title -> tab.label
  const getTabLabel = (tab: NavTabItem): string => {
    const categoriesList =
      (categories && Array.isArray(categories) && categories.length > 0 ? categories : null) ||
      siteConfig?.categories_config ||
      (siteConfig as any)?.categoriesConfig ||
      (siteConfig as any)?.categories;
    const catItem = Array.isArray(categoriesList)
      ? categoriesList.find((c: any) => c.id === tab.id || c.id === tab.targetPage)
      : undefined;

    if (catItem) {
      const catLabel = catItem.navName || catItem.shortLabel || catItem.name;
      if (catLabel) return catLabel;
    }

    const sectionConfig = (siteConfig?.sections as any)?.[tab.id] || (siteConfig?.sections as any)?.[tab.targetPage as string];
    const resolved =
      (sectionConfig && ((sectionConfig as any).short_name || (sectionConfig as any).nav_title || sectionConfig.shortLabel || sectionConfig.title || (sectionConfig as any).name)) ||
      tab.short_name ||
      tab.nav_title ||
      tab.name ||
      tab.title ||
      tab.label ||
      tab.id;
    return resolved;
  };

  const getTabIcon = (tabId: string, type: string) => {
    switch (tabId) {
      case 'home':
        return Home;
      case 'ctd':
        return Shield;
      case 'hl':
        return Crosshair;
      case 'bac':
        return Heart;
      case 'doc':
        return FolderLock;
      case 'lecture':
        return Laptop;
      case 'qdnd':
        return Newspaper;
      case 'qk5':
        return Globe;
      default:
        return type === 'external' ? LinkIcon : Shield;
    }
  };

  // Check scroll position to update arrow indicators
  const checkScroll = () => {
    const el = navScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = navScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [configuredNavTabs, isAdmin]);

  // Auto scroll to active button on page change
  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`#nav-${currentPage}`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentPage]);

  // Convert vertical mouse wheel on the bar to horizontal scroll
  const handleWheel = (e: React.WheelEvent<HTMLUListElement>) => {
    if (e.deltaY !== 0 && navScrollRef.current) {
      navScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollLeftAction = () => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRightAction = () => {
    if (navScrollRef.current) {
      navScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 shadow-md select-none border-b border-black/15"
      style={{ backgroundColor: armyGreenColor }}
    >
      <div className="w-full max-w-[1850px] mx-auto relative flex items-center justify-center">
        {/* Left Scroll Button (When overflowed on mobile/tablet) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={scrollLeftAction}
            className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 h-full px-1.5 bg-gradient-to-r from-black/80 via-black/50 to-transparent hover:from-black text-amber-300 flex items-center justify-center cursor-pointer transition-all"
            title="Cuộn sang trái"
          >
            <div className="w-6 h-6 rounded-full bg-black/70 border border-amber-400/40 flex items-center justify-center shadow-md">
              <ChevronLeft className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* Centered & Auto Responsive Tabbar Container */}
        <ul
          ref={navScrollRef}
          onWheel={handleWheel}
          className="w-full flex items-center justify-start md:justify-center flex-nowrap md:flex-wrap gap-1 sm:gap-2 px-2 py-1.5 list-none m-0 overflow-x-auto md:overflow-visible no-scrollbar scroll-smooth"
        >
          {configuredNavTabs.map((tab) => {
            const Icon = getTabIcon(tab.id, tab.type);
            const displayLabel = getTabLabel(tab);

            if (tab.type === 'external') {
              return (
                <li key={tab.id} className="shrink-0">
                  <a
                    href={tab.externalUrl || '#'}
                    target={tab.openNewTab !== false ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase text-amber-200 hover:text-white hover:bg-black/25 transition-all rounded-md border border-white/10 hover:border-amber-300/40 whitespace-nowrap"
                    title={`Mở liên kết: ${tab.externalUrl}`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 opacity-85" />
                    <span>{displayLabel}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-75" />
                  </a>
                </li>
              );
            }

            // Internal / Section Tab
            const target = (tab.targetPage || tab.id) as PageView;
            const isActive = currentPage === target;

            // Resolve dynamic subcategories from categories_config
            const categoriesList =
              (categories && Array.isArray(categories) && categories.length > 0 ? categories : null) ||
              siteConfig?.categories_config ||
              (siteConfig as any)?.categoriesConfig ||
              (siteConfig as any)?.categories;
            const catItem = Array.isArray(categoriesList)
              ? categoriesList.find((c: any) => c.id === tab.id || c.id === tab.targetPage || c.name === tab.label)
              : undefined;
            const subcategories: string[] = catItem?.subcategories || catItem?.categories || [];
            const hasSubcategories = subcategories && subcategories.length > 0;
            const isDropdownOpen = activeDropdownTabId === tab.id;

            return (
              <li
                key={tab.id}
                className="shrink-0 relative group"
                onMouseEnter={() => {
                  if (hasSubcategories) setActiveDropdownTabId(tab.id);
                }}
                onMouseLeave={() => {
                  if (hasSubcategories) setActiveDropdownTabId(null);
                }}
              >
                <button
                  type="button"
                  id={`nav-${tab.id}`}
                  onClick={() => {
                    onSelectPage(target);
                    setActiveDropdownTabId(null);
                  }}
                  style={{
                    backgroundColor: isActive ? primaryRedColor : 'transparent',
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase transition-all rounded-md cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'text-white border-amber-300 shadow-md ring-1 ring-amber-300/60'
                      : 'text-amber-100 hover:text-white hover:bg-black/25 border-white/10 hover:border-amber-300/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{displayLabel}</span>
                  {hasSubcategories && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 ml-0.5 text-amber-300/80 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-amber-300' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Dropdown Menu Danh mục con */}
                {hasSubcategories && isDropdownOpen && (
                  <div
                    id={`nav-dropdown-${tab.id}`}
                    className="absolute left-0 top-full min-w-[210px] bg-[#143d2b] border border-amber-400/50 shadow-2xl rounded-b-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                  >
                    <div className="px-3 py-1.5 border-b border-white/10 text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                      <span>{displayLabel}</span>
                      <span className="text-[9px] text-white/50 font-normal">Chuyên mục</span>
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {subcategories.map((sub, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            onSelectPage(target);
                            setActiveDropdownTabId(null);
                          }}
                          className="w-full text-left px-3.5 py-1.5 text-xs text-white/90 hover:text-amber-200 hover:bg-black/40 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          {/* Tab Duyệt Bài (Chỉ dành cho Admin) */}
          {isAdmin && (
            <li className="shrink-0">
              <button
                type="button"
                id="nav-approvals"
                onClick={() => onSelectPage('approvals')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase transition-all cursor-pointer whitespace-nowrap rounded-md border border-emerald-400/40 ${
                  currentPage === 'approvals'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Duyệt Bài</span>
                {pendingDraftsCount > 0 && (
                  <span
                    id="pending-badge-count"
                    className="ml-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse"
                  >
                    {pendingDraftsCount}
                  </span>
                )}
              </button>
            </li>
          )}

          {/* Quản lý Chuyên mục (Chỉ dành cho Admin) */}
          {isAdmin && onOpenCategoryManager && (
            <li className="shrink-0">
              <button
                type="button"
                id="nav-category-manager"
                onClick={onOpenCategoryManager}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase bg-amber-400 hover:bg-amber-300 text-red-950 transition-all cursor-pointer whitespace-nowrap rounded-md border border-amber-300 shadow-xs"
                title="Quản lý cấu trúc chuyên mục và tabbar website"
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-950" />
                <span>Chuyên mục</span>
              </button>
            </li>
          )}

          {/* Tab Phân quyền Người dùng (Chỉ dành cho Admin) */}
          {isAdmin && (
            <li className="shrink-0">
              <button
                type="button"
                id="nav-users"
                onClick={() => onSelectPage('users')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase transition-all cursor-pointer whitespace-nowrap rounded-md border border-amber-500/40 ${
                  currentPage === 'users'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-700/80 hover:bg-amber-600 text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Phân quyền</span>
              </button>
            </li>
          )}

          {/* Tab Tùy chỉnh Giao diện (Chỉ dành cho Admin) */}
          {isAdmin && (
            <li className="shrink-0">
              <button
                type="button"
                id="nav-customizer"
                onClick={onOpenCustomizer}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase bg-sky-800/80 hover:bg-sky-700 text-white transition-all cursor-pointer whitespace-nowrap rounded-md border border-sky-400/30"
                title="Tùy chỉnh màu sắc, logo và thanh điều hướng website"
              >
                <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Tùy chỉnh</span>
              </button>
            </li>
          )}

          {/* Nút Tìm kiếm toàn hệ thống */}
          {onOpenGlobalSearch && (
            <li className="shrink-0">
              <button
                type="button"
                id="nav-global-search"
                onClick={onOpenGlobalSearch}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase bg-black/25 hover:bg-black/45 text-amber-300 hover:text-white transition-all cursor-pointer whitespace-nowrap rounded-md border border-amber-300/40 shadow-xs"
                title="Tìm kiếm bài viết, tài liệu, bài giảng... (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>Tìm kiếm</span>
              </button>
            </li>
          )}
        </ul>

        {/* Right Scroll Button (When overflowed on mobile/tablet) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={scrollRightAction}
            className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 h-full px-1.5 bg-gradient-to-l from-black/80 via-black/50 to-transparent hover:from-black text-amber-300 flex items-center justify-center cursor-pointer transition-all"
            title="Cuộn sang phải xem thêm chuyên mục"
          >
            <div className="w-6 h-6 rounded-full bg-black/70 border border-amber-400/40 flex items-center justify-center shadow-md animate-pulse">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        )}
      </div>
    </nav>
  );
};
