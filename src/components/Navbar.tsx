import React, { useEffect, useRef, useState } from 'react';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ExternalLink,
  FolderLock,
  Globe,
  Heart,
  Home,
  Laptop,
  Link as LinkIcon,
  Newspaper,
  Palette,
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
  siteConfig?: SiteConfig;
  armyGreenColor?: string;
  primaryRedColor?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onSelectPage,
  currentUser,
  pendingDraftsCount,
  onOpenCustomizer,
  siteConfig,
  armyGreenColor = '#143d2b',
  primaryRedColor = '#b91c1c',
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navScrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Compute configured nav tabs with order and visibility
  const configuredNavTabs = React.useMemo<NavTabItem[]>(() => {
    const tabs: NavTabItem[] =
      siteConfig?.navTabs && siteConfig.navTabs.length > 0
        ? [...siteConfig.navTabs]
        : [...defaultNavTabs];

    // Filter enabled tabs and sort by order
    return tabs
      .filter((t) => t.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [siteConfig?.navTabs, siteConfig?.sections, siteConfig?.categories_config]);

  // Helper to resolve display tab title according to priorities:
  // category_config.navName -> section.shortLabel -> tab.short_name -> tab.nav_title -> tab.label
  const getTabLabel = (tab: NavTabItem): string => {
    const categoriesList = siteConfig?.categories_config || (siteConfig as any)?.categoriesConfig || (siteConfig as any)?.categories;
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
      <div className="w-full max-w-[1850px] mx-auto px-2 sm:px-5 lg:px-8 relative flex items-center">
        {/* Left Scroll Button (When overflowed) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={scrollLeftAction}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-full px-1.5 bg-gradient-to-r from-black/80 via-black/50 to-transparent hover:from-black text-amber-300 flex items-center justify-center cursor-pointer transition-all"
            title="Cuộn sang trái"
          >
            <div className="w-6 h-6 rounded-full bg-black/70 border border-amber-400/40 flex items-center justify-center shadow-md">
              <ChevronLeft className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* 1-Line Horizontal Category Scroll Container */}
        <ul
          ref={navScrollRef}
          onWheel={handleWheel}
          className="flex items-center flex-nowrap whitespace-nowrap list-none m-0 p-0 overflow-x-auto no-scrollbar scroll-smooth w-full py-0"
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
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase text-amber-200 hover:text-amber-100 hover:bg-black/25 transition-colors border-r border-white/10 whitespace-nowrap"
                    title={`Mở liên kết: ${tab.externalUrl}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>{displayLabel}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-75" />
                  </a>
                </li>
              );
            }

            // Internal / Section Tab
            const target = (tab.targetPage || tab.id) as PageView;
            const isActive = currentPage === target;

            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  id={`nav-${tab.id}`}
                  onClick={() => onSelectPage(target)}
                  style={{
                    backgroundColor: isActive ? primaryRedColor : 'transparent',
                  }}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase transition-colors border-r border-white/10 cursor-pointer whitespace-nowrap ${
                    isActive ? 'text-white shadow-xs' : 'text-white/90 hover:bg-black/20 hover:text-amber-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{displayLabel}</span>
                </button>
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
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase transition-colors cursor-pointer whitespace-nowrap border-r border-white/10 ${
                  currentPage === 'approvals'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
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

          {/* Tab Phân quyền Người dùng (Chỉ dành cho Admin) */}
          {isAdmin && (
            <li className="shrink-0">
              <button
                type="button"
                id="nav-users"
                onClick={() => onSelectPage('users')}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase transition-colors cursor-pointer whitespace-nowrap border-r border-white/10 ${
                  currentPage === 'users'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Users className="w-4 h-4" />
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
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase bg-sky-700 hover:bg-sky-600 text-white transition-colors cursor-pointer whitespace-nowrap"
                title="Tùy chỉnh màu sắc, logo và thanh điều hướng website"
              >
                <Palette className="w-4 h-4" />
                <span>Tùy chỉnh</span>
              </button>
            </li>
          )}
        </ul>

        {/* Right Scroll Button (When overflowed) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={scrollRightAction}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-full px-1.5 bg-gradient-to-l from-black/80 via-black/50 to-transparent hover:from-black text-amber-300 flex items-center justify-center cursor-pointer transition-all"
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
