import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Clock,
  Crosshair,
  Edit2,
  ExternalLink,
  FolderLock,
  Globe,
  Heart,
  Laptop,
  Layers,
  Lock,
  LogOut,
  Megaphone,
  Newspaper,
  Palette,
  Shield,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { PageView, RoleDefinition, SiteConfig, User } from '../types';
import { UnitLogo } from './UnitLogo';
import { MILITARY_FALLBACK_AVATAR, defaultCategoriesConfig } from '../data/initialData';

export interface HeaderProps {
  siteConfig: SiteConfig;
  categories?: any[];
  currentUser: User | null;
  roles?: RoleDefinition[];
  currentPage?: PageView;
  pendingDraftsCount?: number;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onSelectPage?: (page: PageView) => void;
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
  onOpenCustomizer?: () => void;
  onOpenUncleHoManager?: () => void;
  onOpenAnnouncementManager?: () => void;
  onOpenCategoryManager?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  siteConfig,
  categories,
  currentUser,
  roles = [],
  currentPage = 'home',
  pendingDraftsCount = 0,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onGoHome,
  onSelectPage,
  onSelectCategory,
  onOpenCustomizer,
  onOpenUncleHoManager,
  onOpenAnnouncementManager,
  onOpenCategoryManager,
}) => {
  const [currentDateString, setCurrentDateString] = useState<string>('');
  const [currentTimeString, setCurrentTimeString] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [activeDropdownTabId, setActiveDropdownTabId] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Live Clock & Date update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[now.getDay()];
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      setCurrentDateString(`${dayName}, ${day}/${month}/${year}`);
      setCurrentTimeString(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setActiveDropdownTabId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const isCommander = currentUser?.role === 'commander';
  const isEditor = currentUser?.role === 'editor';

  const matchedRole = (roles || []).find((r) => r?.id === currentUser?.role);
  const roleName =
    matchedRole?.name ||
    (isAdmin
      ? 'Quản trị viên Hệ thống'
      : isCommander
      ? 'Chỉ huy đơn vị'
      : isEditor
      ? 'Ban Biên tập'
      : 'Cán bộ - Chiến sĩ');
  const roleColor =
    matchedRole?.color ||
    (isAdmin ? '#b91c1c' : isCommander ? '#065f46' : isEditor ? '#1e40af' : '#0f766e');
  const RoleIcon = isAdmin ? ShieldCheck : isCommander ? Shield : isEditor ? UserCog : UserCheck;

  // 1. XÓA BỎ LẶP LẠI TAB TRONG CODE:
  // CHỈ DUYỆT DUY NHẤT 1 VÒNG LẶP từ categories (hoặc siteConfig.categories_config)
  // Khử trùng ID để triệt tiêu vĩnh viễn tình trạng lặp tab "THỰC HÀNH THEO BÁC", "VĂN BẢN - CHỈ THỊ", "BÀI GIẢNG SỐ"
  const categoriesList = useMemo(() => {
    const raw =
      (categories && Array.isArray(categories) && categories.length > 0 ? categories : null) ||
      siteConfig?.categories_config ||
      (siteConfig as any)?.categoriesConfig ||
      (siteConfig as any)?.categories ||
      defaultCategoriesConfig;

    const seenIds = new Set<string>();
    const list: any[] = [];

    (raw || []).forEach((cat: any) => {
      if (!cat || typeof cat !== 'object') return;
      const catId = String(cat.id || cat.targetPage || '').toLowerCase();
      // Loại trừ 'home' vì nút Trang chủ luôn cố định ở vị trí đầu tiên
      // Loại trừ 'meeting' nếu có
      if (!catId || catId === 'home' || catId === 'trang-chu' || catId === 'meeting') return;
      if (cat.hidden === true || cat.enabled === false) return;
      if (seenIds.has(catId)) return;
      seenIds.add(catId);
      list.push(cat);
    });

    return list;
  }, [categories, siteConfig?.categories_config]);

  // Tab Icon resolver
  const getTabIcon = (id: string, type?: string) => {
    switch (id) {
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
        return type === 'external' ? ExternalLink : Shield;
    }
  };

  const getTabLabel = (cat: any): string => {
    if (!cat) return '';
    return cat.name || cat.navName || cat.shortLabel || cat.short_name || cat.label || cat.id || '';
  };

  return (
    <header className="w-full select-none relative z-50">
      {/* Main Header Banner */}
      <div
        className="text-white border-b-2 border-amber-400 shadow-md"
        style={{ backgroundColor: siteConfig.colorRed || '#b91c1c' }}
      >
        <div className="w-full max-w-[1850px] mx-auto px-3 sm:px-5 lg:px-8 pt-2 sm:pt-2.5 pb-1 sm:pb-1.5 flex flex-col md:flex-row items-center md:items-end justify-between gap-2.5 sm:gap-3">
          {/* Brand Group */}
          <div
            id="header-brand-logo"
            onClick={() => {
              if (onSelectCategory) {
                onSelectCategory('home', 'all');
              } else if (onSelectPage) {
                onSelectPage('home');
              } else {
                onGoHome();
              }
            }}
            className="flex items-center gap-3 cursor-pointer group pb-0.5"
          >
            <UnitLogo
              size="md"
              logo_type={siteConfig.logo_type || siteConfig.logoType}
              logoType={siteConfig.logo_type || siteConfig.logoType}
              logo_url={siteConfig.logo_url || siteConfig.customLogoUrl}
              customLogoUrl={siteConfig.logo_url || siteConfig.customLogoUrl}
              logo_size={siteConfig.logo_size || siteConfig.logoSize || siteConfig.logoSizePx}
              customSizePx={siteConfig.logoSizePx}
              logo_effect={siteConfig.logo_effect || siteConfig.logoEffect}
              logoEffect={siteConfig.logo_effect || siteConfig.logoEffect}
              withGlow={siteConfig.enableLogoGlow}
              withRotatingBeam={siteConfig.enableLogoBeam}
              slogan={siteConfig.slogan}
              establishedDate={siteConfig.establishedDate}
            />
            <div>
              <h1 className="text-sm md:text-base lg:text-xl font-black uppercase tracking-wide text-white leading-tight drop-shadow-xs group-hover:text-amber-200 transition-colors">
                {siteConfig.title}
              </h1>
              <h2 className="text-[10px] md:text-xs lg:text-sm font-semibold uppercase tracking-wider text-white/90 mt-0.5">
                {siteConfig.subtitle}
              </h2>
            </div>
          </div>

          {/* Top Right Controls: Oval Time Box + Auth / User Dropdown */}
          <div className="flex items-center flex-wrap sm:flex-nowrap justify-center md:justify-end gap-2 sm:gap-2.5 pb-0.5">
            {/* Khung thời gian nằm trong khung oval nền vàng */}
            <div
              id="header-time-oval"
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-red-950 px-2 sm:px-3 py-1 rounded-full shadow-xs border border-amber-200 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold tracking-tight shrink-0"
            >
              <div className="flex items-center gap-1 text-red-900 font-extrabold">
                <Clock className="w-3.5 h-3.5 text-red-800 animate-pulse" />
                <span className="tabular-nums">{currentTimeString}</span>
              </div>
              <span className="text-red-800/40 font-normal">|</span>
              <div className="flex items-center gap-1 text-red-950 font-bold">
                <Calendar className="w-3.5 h-3.5 text-red-800" />
                <span>{currentDateString}</span>
              </div>
            </div>

            {/* User Account or Login/Register Area */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  id="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    isUserMenuOpen
                      ? 'bg-black/40 border-amber-300 text-amber-200 shadow-inner'
                      : 'bg-black/20 hover:bg-black/35 border-white/30 text-white shadow-xs'
                  }`}
                  title="Nhấn để mở menu tài khoản & quản trị"
                >
                  <img
                    src={currentUser.avatar || MILITARY_FALLBACK_AVATAR}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full object-cover border-2 border-amber-300 shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = MILITARY_FALLBACK_AVATAR;
                    }}
                  />
                  <span className="text-xs sm:text-[13px] font-bold text-white max-w-[140px] sm:max-w-[200px] truncate px-1">
                    {currentUser.fullName}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-amber-300 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Popover */}
                {isUserMenuOpen && (
                  <div
                    id="user-account-dropdown"
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Dropdown Header: User Info Card */}
                    <div className="bg-gradient-to-br from-[#143d2b] to-[#1e583e] text-white p-3.5 sm:p-4 border-b-2 border-amber-400">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentUser.avatar || MILITARY_FALLBACK_AVATAR}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = MILITARY_FALLBACK_AVATAR;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-amber-200 truncate uppercase">
                            {currentUser.fullName}
                          </h4>
                          <p className="text-xs text-white/90 font-medium truncate">
                            @{currentUser.username}
                          </p>
                          <p className="text-[11px] text-white/80 truncate">
                            {currentUser.rankUnit || currentUser.rank || 'Quân nhân'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          style={{ backgroundColor: roleColor }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white shadow-2xs border border-white/20"
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleName}</span>
                        </span>
                      </div>
                    </div>

                    {/* Permissions summary */}
                    <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 text-[11px] text-gray-600 flex items-center flex-wrap gap-1.5">
                      <span className="font-bold text-gray-700">Quyền:</span>
                      {currentUser.canViewSecretDocs && (
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold border border-blue-200">
                          VB Mật
                        </span>
                      )}
                      {currentUser.canUploadDocs && (
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                          Đăng tài liệu
                        </span>
                      )}
                      {isAdmin && (
                        <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-semibold border border-red-200">
                          Toàn quyền
                        </span>
                      )}
                    </div>

                    {/* Action Items List */}
                    <div className="p-1.5 space-y-0.5 text-xs font-medium">
                      <button
                        type="button"
                        id="user-profile-menu-item"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <UserCog className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <div className="font-bold text-gray-900">Hồ sơ cá nhân & Đổi mật khẩu</div>
                          <div className="text-[10px] text-gray-500">
                            Cập nhật ảnh đại diện, cấp bậc, chức vụ và mật khẩu
                          </div>
                        </div>
                      </button>

                      {isAdmin && (
                        <>
                          <div className="my-1 border-t border-gray-100 px-2 pt-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            Quản trị hệ thống
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onSelectPage?.('users');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <Users className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>Phân quyền người dùng & Đặt lại MK</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onSelectPage?.('approvals');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Duyệt dự thảo tin bài</span>
                          </button>

                          {onOpenCategoryManager && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onOpenCategoryManager();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                              <span className="font-bold text-amber-900">QUẢN LÝ CHUYÊN MỤC</span>
                            </button>
                          )}

                          {onOpenCustomizer && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onOpenCustomizer();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 hover:bg-sky-50 hover:text-sky-900 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              <Palette className="w-4 h-4 text-sky-700 shrink-0" />
                              <span>Tùy chỉnh giao diện & Màu sắc</span>
                            </button>
                          )}

                          {onOpenUncleHoManager && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onOpenUncleHoManager();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 hover:bg-red-50 hover:text-red-900 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              <Heart className="w-4 h-4 text-red-600 shrink-0" />
                              <span>Quản lý Lời Bác dạy hằng ngày</span>
                            </button>
                          )}

                          {onOpenAnnouncementManager && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onOpenAnnouncementManager();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 hover:bg-yellow-50 hover:text-yellow-900 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Quản lý dải thông báo Trang chủ</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Divider & Logout Button */}
                    <div className="p-2 border-t border-gray-200 bg-gray-50/80">
                      <button
                        type="button"
                        id="user-logout-menu-item"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-700 text-red-700 hover:text-white rounded-lg font-bold text-xs border border-red-200 hover:border-red-700 transition-all cursor-pointer shadow-2xs"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ĐĂNG XUẤT KHỎI HỆ THỐNG</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  id="header-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="bg-red-800 hover:bg-red-700 text-amber-200 hover:text-white px-3 sm:px-4 py-1.5 rounded-lg border-2 border-amber-400 font-extrabold flex items-center gap-1.5 transition-all cursor-pointer text-xs uppercase shadow-xs tracking-wide"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>ĐĂNG NHẬP</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CỐ ĐỊNH THANH TABBAR TRÊN ĐÚNG 1 HÀNG DUY NHẤT (TUYỆT ĐỐI KHÔNG XUỐNG DÒNG) */}
      {/* Cấu trúc: [🏠 TRANG CHỦ] -> [Các Tab chuyên mục động] -> [|] -> [Nhóm Quản trị Admin] */}
      {/* ========================================================================= */}
      <nav
        className="w-full shadow-md select-none border-b border-black/20 sticky top-0 z-40"
        style={{ backgroundColor: siteConfig.colorGreen || '#143d2b' }}
      >
        <div className="w-full max-w-[1850px] mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar whitespace-nowrap py-1 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Nhóm tab chính bên trái (cho phép vuốt trượt ngang mượt mà trên 1 hàng) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* 1. NÚT TRANG CHỦ CỐ ĐỊNH Ở VỊ TRÍ ĐẦU TIÊN BÊN TRÁI NỀN ĐỎ */}
            <button
              type="button"
              id="nav-home"
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory('home', 'all');
                } else if (onSelectPage) {
                  onSelectPage('home');
                } else {
                  onGoHome();
                }
              }}
              className={`shrink-0 whitespace-nowrap text-xs xl:text-sm px-2.5 py-1.5 font-bold rounded shadow flex items-center gap-1.5 cursor-pointer transition-all ${
                currentPage === 'home'
                  ? 'bg-red-700 text-white ring-2 ring-amber-300 shadow-md brightness-110'
                  : 'bg-red-700 hover:bg-red-800 text-white'
              }`}
              title="Về Trang chủ"
            >
              <span>🏠</span>
              <span>TRANG CHỦ</span>
            </button>

            {/* 2. CÁC TAB CHUYÊN MỤC ĐỘNG: CHỈ DUYỆT DUY NHẤT 1 VÒNG LẶP TỪ CATEGORIES */}
            {categoriesList.map((cat: any) => {
              const catId = String(cat.id || cat.targetPage);
              const target = (cat.targetPage || cat.id) as PageView;
              const displayLabel = getTabLabel(cat);
              const Icon = getTabIcon(catId, cat.type);
              const isActive = currentPage === target || currentPage === catId;

              // External link tab
              if (cat.type === 'external') {
                return (
                  <a
                    key={catId}
                    href={cat.externalUrl || '#'}
                    target={cat.openNewTab !== false ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="shrink-0 whitespace-nowrap text-xs xl:text-sm px-2.5 py-1.5 font-bold uppercase text-amber-200 hover:text-white hover:bg-black/25 transition-all rounded-md border border-white/10 hover:border-amber-300/40 flex items-center gap-1.5"
                    title={`Mở liên kết: ${cat.externalUrl}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-85" />
                    <span>{displayLabel}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-75" />
                  </a>
                );
              }

              // Internal tab with subcategories dropdown
              const rawSubs = cat.subcategories || (siteConfig?.sections as any)?.[catId]?.categories || [];
              const subcategories: string[] = (Array.isArray(rawSubs) ? rawSubs : [])
                .map((s: any) => (typeof s === 'string' ? s.trim() : (s?.name || s?.title || s?.label || '').trim()))
                .filter(Boolean);

              const hasSubs = subcategories.length > 0;
              const isDropdownOpen = activeDropdownTabId === catId;

              return (
                <div
                  key={catId}
                  className="relative shrink-0 group"
                  onMouseEnter={() => {
                    if (hasSubs) setActiveDropdownTabId(catId);
                  }}
                  onMouseLeave={() => {
                    if (hasSubs) setActiveDropdownTabId(null);
                  }}
                >
                  <button
                    type="button"
                    id={`nav-${catId}`}
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(cat.id || cat.targetPage, 'all');
                      } else if (onSelectPage) {
                        onSelectPage(target);
                      }
                      setActiveDropdownTabId(null);
                    }}
                    style={{
                      backgroundColor: isActive ? (siteConfig.colorRed || '#b91c1c') : 'transparent',
                    }}
                    className={`shrink-0 whitespace-nowrap text-xs xl:text-sm px-2.5 py-1.5 font-bold uppercase transition-all rounded-md cursor-pointer flex items-center gap-1.5 border ${
                      isActive
                        ? 'text-white border-amber-300 shadow-md ring-1 ring-amber-300/60'
                        : 'text-amber-100 hover:text-white hover:bg-black/25 border-white/10 hover:border-amber-300/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{displayLabel}</span>
                    {hasSubs && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 ml-0.5 text-amber-300/80 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-amber-300' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu Danh mục con - Duyệt mảng tiểu mục của chính mục này */}
                  {hasSubs && isDropdownOpen && (
                    <div
                      id={`nav-dropdown-${catId}`}
                      className="absolute left-0 top-full min-w-[210px] bg-[#143d2b] border border-amber-400/50 shadow-2xl rounded-b-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
                    >
                      <div className="px-3 py-1.5 border-b border-white/10 text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                        <span>{displayLabel}</span>
                        <span className="text-[9px] text-white/50 font-normal">Tiểu mục</span>
                      </div>
                      <div className="py-1 max-h-64 overflow-y-auto">
                        {subcategories.map((subName: string, sIdx: number) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              if (onSelectCategory) {
                                onSelectCategory(cat.id || cat.targetPage, subName);
                              } else if (onSelectPage) {
                                onSelectPage(target);
                              }
                              setActiveDropdownTabId(null);
                            }}
                            className="w-full text-left px-3.5 py-1.5 text-xs text-white/90 hover:text-amber-200 hover:bg-black/40 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className="truncate">{subName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3. TÁCH BIỆT NHÓM NÚT QUẢN TRỊ (DUYỆT BÀI, PHÂN QUYỀN, TÙY CHỈNH) VỀ GÓC PHẢI */}
          {isAdmin && (
            <div className="border-l border-white/20 pl-2 shrink-0 flex items-center gap-1">
              {/* Nút Duyệt Bài */}
              <button
                type="button"
                id="nav-approvals"
                onClick={() => onSelectPage?.('approvals')}
                className={`shrink-0 whitespace-nowrap text-xs xl:text-sm px-2.5 py-1.5 font-bold uppercase transition-all cursor-pointer rounded-md border border-emerald-400/40 flex items-center gap-1 ${
                  currentPage === 'approvals'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 hover:text-white'
                }`}
                title="Duyệt dự thảo tin bài"
              >
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
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

              {/* Nút Phân quyền */}
              <button
                type="button"
                id="nav-users"
                onClick={() => onSelectPage?.('users')}
                className={`shrink-0 whitespace-nowrap text-xs xl:text-sm px-2.5 py-1.5 font-bold uppercase transition-all cursor-pointer rounded-md border border-amber-500/40 flex items-center gap-1 ${
                  currentPage === 'users'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-700/80 hover:bg-amber-600 text-white'
                }`}
                title="Phân quyền người dùng & quản trị quân nhân"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Phân quyền</span>
              </button>

              {/* Nút Tùy chỉnh */}
              {onOpenCustomizer && (
                <button
                  type="button"
                  id="nav-customizer"
                  onClick={onOpenCustomizer}
                  className="shrink-0 whitespace-nowrap text-xs xl:text-sm px-2.5 py-1.5 font-bold uppercase bg-sky-800/80 hover:bg-sky-700 text-white transition-all cursor-pointer rounded-md border border-sky-400/30 flex items-center gap-1"
                  title="Tùy chỉnh màu sắc, logo và thanh điều hướng website"
                >
                  <Palette className="w-3.5 h-3.5 shrink-0" />
                  <span>Tùy chỉnh</span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
