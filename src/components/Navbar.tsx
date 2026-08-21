import React, { useEffect, useRef, useState } from 'react';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ExternalLink,
  FolderLock,
  Heart,
  Home,
  Laptop,
  Link as LinkIcon,
  Palette,
  Shield,
  Users,
  UsersRound,
} from 'lucide-react';
import { CustomMenuItem, PageView, SiteConfig, User } from '../types';

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
  const canJoinMeeting = currentUser?.canJoinPartyMeeting || isAdmin;

  const navScrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const ctdLabel = siteConfig?.sections?.ctd?.shortLabel || 'Công tác Đảng - CTCT';
  const hlLabel = siteConfig?.sections?.hl?.shortLabel || 'Huấn luyện - SSCĐ';
  const bacLabel = siteConfig?.sections?.bac?.shortLabel || 'Học tập theo Bác';
  const docLabel = siteConfig?.sections?.doc?.shortLabel || 'Văn bản - Tài liệu';
  const lectureLabel = siteConfig?.sections?.lecture?.shortLabel || 'Bài giảng điện tử';

  const navItems = [
    { id: 'home' as PageView, label: 'Trang chủ', icon: Home },
    { id: 'ctd' as PageView, label: ctdLabel, icon: Shield },
    { id: 'hl' as PageView, label: hlLabel, icon: Crosshair },
    { id: 'bac' as PageView, label: bacLabel, icon: Heart },
    { id: 'doc' as PageView, label: docLabel, icon: FolderLock },
    { id: 'lecture' as PageView, label: lectureLabel, icon: Laptop },
  ];

  const customMenuItems: CustomMenuItem[] = siteConfig?.customMenuItems || [];

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
  }, [navItems, customMenuItems, canJoinMeeting, isAdmin]);

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
      <div className="max-w-7xl mx-auto px-1 sm:px-2 relative flex items-center">
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  id={`nav-${item.id}`}
                  onClick={() => onSelectPage(item.id)}
                  style={{
                    backgroundColor: isActive ? primaryRedColor : 'transparent',
                  }}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase transition-colors border-r border-white/10 cursor-pointer whitespace-nowrap ${
                    isActive ? 'text-white shadow-xs' : 'text-white/90 hover:bg-black/20 hover:text-amber-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}

          {/* Custom Navigation Menu Items Added by Admin */}
          {customMenuItems.map((item) => {
            if (item.type === 'internal') {
              const target = (item.targetPage || 'home') as PageView;
              const isActive = currentPage === target;
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    id={`nav-${target}`}
                    onClick={() => onSelectPage(target)}
                    style={{
                      backgroundColor: isActive ? primaryRedColor : 'transparent',
                    }}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase transition-colors border-r border-white/10 cursor-pointer whitespace-nowrap ${
                      isActive ? 'text-white shadow-xs' : 'text-white/90 hover:bg-black/20 hover:text-amber-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span>{item.title}</span>
                  </button>
                </li>
              );
            }

            // External Link
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={item.externalUrl || '#'}
                  target={item.openNewTab !== false ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-bold uppercase text-amber-200 hover:text-amber-100 hover:bg-black/25 transition-colors border-r border-white/10 whitespace-nowrap"
                  title={`Mở liên kết: ${item.externalUrl}`}
                >
                  <span>{item.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-75" />
                </a>
              </li>
            );
          })}

          {/* Tab Họp Đảng ủy (Chỉ hiển thị cho Đảng ủy viên hoặc Admin) */}
          {canJoinMeeting && (
            <li className="shrink-0">
              <button
                type="button"
                id="nav-meeting"
                onClick={() => onSelectPage('meeting')}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-3 text-xs md:text-[13px] font-extrabold uppercase transition-colors border-l-2 border-amber-400 cursor-pointer whitespace-nowrap ${
                  currentPage === 'meeting'
                    ? 'bg-pink-900 text-amber-200 shadow-inner'
                    : 'bg-[#831843] hover:bg-[#9d174d] text-amber-200'
                }`}
              >
                <UsersRound className="w-4 h-4 text-amber-300" />
                <span>Họp Đảng ủy</span>
              </button>
            </li>
          )}

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
