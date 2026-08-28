import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock,
  ExternalLink,
  FolderLock,
  Heart,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Megaphone,
  Palette,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import { PageView, RoleDefinition, SiteConfig, User } from '../types';
import { UnitLogo } from './UnitLogo';

interface HeaderProps {
  siteConfig: SiteConfig;
  currentUser: User | null;
  roles?: RoleDefinition[];
  onOpenAuth: (tab: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onGoHome: () => void;
  onSelectPage?: (page: PageView) => void;
  onOpenCustomizer?: () => void;
  onOpenUncleHoManager?: () => void;
  onOpenAnnouncementManager?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  siteConfig,
  currentUser,
  roles = [],
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onGoHome,
  onSelectPage,
  onOpenCustomizer,
  onOpenUncleHoManager,
  onOpenAnnouncementManager,
}) => {
  const [currentDateString, setCurrentDateString] = useState<string>('');
  const [currentTimeString, setCurrentTimeString] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
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
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const isAdmin = currentUser?.role === 'admin';
  const isCommander = currentUser?.role === 'commander';
  const isEditor = currentUser?.role === 'editor';
  const isPartyMember = currentUser?.canJoinPartyMeeting;

  const matchedRole = roles.find((r) => r.id === currentUser?.role);
  const roleName = matchedRole?.name || (isAdmin ? 'Quản trị viên Hệ thống' : isCommander ? 'Chỉ huy đơn vị' : isEditor ? 'Ban Biên tập' : 'Cán bộ - Chiến sĩ');
  const roleColor = matchedRole?.color || (isAdmin ? '#b91c1c' : isCommander ? '#065f46' : isEditor ? '#1e40af' : '#0f766e');
  const RoleIcon = isAdmin ? ShieldCheck : isCommander ? Shield : isEditor ? UserCog : UserCheck;

  return (
    <header className="w-full select-none relative z-50">
      {/* Main Header Banner */}
      <div
        className="text-white border-b-4 border-[#fbbf24] shadow-md"
        style={{ backgroundColor: siteConfig.colorRed || '#b91c1c' }}
      >
        <div className="w-full px-3 sm:px-6 lg:px-8 pt-2 sm:pt-2.5 pb-1 sm:pb-1.5 flex flex-col md:flex-row items-center md:items-end justify-between gap-2.5 sm:gap-3">
          {/* Brand Group */}
          <div
            id="header-brand-logo"
            onClick={onGoHome}
            className="flex items-center gap-3 cursor-pointer group pb-0.5"
          >
            <UnitLogo
              size="md"
              customSizePx={siteConfig.logoSizePx}
              withGlow={siteConfig.enableLogoGlow !== false}
              withRotatingBeam={siteConfig.enableLogoBeam !== false}
              logoType={siteConfig.logoType}
              customLogoUrl={siteConfig.customLogoUrl}
              slogan={siteConfig.slogan}
              establishedDate={siteConfig.establishedDate}
            />
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide text-white leading-tight drop-shadow-xs group-hover:text-amber-200 transition-colors">
                {siteConfig.title}
              </h1>
              <h2 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-white/90 mt-0.5">
                {siteConfig.subtitle}
              </h2>
            </div>
          </div>

          {/* Top Right Controls: Oval Time Box + Auth / User Dropdown (Close to bottom border & tabs) */}
          <div className="flex items-center flex-wrap justify-center md:justify-end gap-2 sm:gap-2.5 pb-0.5">
            {/* 1. Khung thời gian nằm trong khung oval nền vàng */}
            <div
              id="header-time-oval"
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-red-950 px-2.5 sm:px-3 py-1 rounded-full shadow-xs border border-amber-200 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold tracking-tight"
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

            {/* 2. User Account or Login/Register Area */}
            {currentUser ? (
              /* Đã đăng nhập: KHÔNG hiển thị khung đăng xuất, đăng ký lộ ra ngoài -> Menu Thả Xuống (Dropdown Popover) */
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
                    src={
                      currentUser.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                    }
                    alt="Avatar"
                    className="w-6 h-6 rounded-full object-cover border-2 border-amber-300 shadow-xs"
                  />
                  {/* Chỉ hiển thị tên người dùng khi đã đăng nhập */}
                  <span className="text-xs sm:text-[13px] font-bold text-white max-w-[140px] sm:max-w-[200px] truncate px-1">
                    {currentUser.fullName}
                  </span>
                  {/* Mũi tên mở rộng */}
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
                          src={
                            currentUser.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                          }
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md"
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

                      {/* Role Pill */}
                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          style={{ backgroundColor: roleColor }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white shadow-2xs border border-white/20"
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleName}</span>
                        </span>
                        {isPartyMember && (
                          <span className="bg-pink-900/90 text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold border border-pink-700 flex items-center gap-1">
                            <UsersRound className="w-2.5 h-2.5" />
                            <span>Đảng viên</span>
                          </span>
                        )}
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
                      {currentUser.canJoinPartyMeeting && (
                        <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold border border-purple-200">
                          Họp Đảng ủy
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
                      {/* 1. Thay đổi thông tin tài khoản & Hồ sơ cá nhân */}
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

                      {/* 2. Các lối tắt quản trị (Chỉ dành cho Admin / Chỉ huy) */}
                      {isAdmin && onSelectPage && (
                        <>
                          <div className="my-1 border-t border-gray-100 px-2 pt-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            Quản trị hệ thống
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onSelectPage('users');
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
                              onSelectPage('approvals');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Duyệt dự thảo tin bài</span>
                          </button>

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
              /* Chưa đăng nhập: Hiển thị các nút Đăng nhập / Đăng ký rõ ràng */
              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  id="header-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="bg-black/25 hover:bg-black/40 text-white px-3 sm:px-3.5 py-1.5 rounded-lg border border-white/30 flex items-center gap-1.5 font-bold transition-all cursor-pointer text-xs shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>ĐĂNG NHẬP</span>
                </button>
                <button
                  type="button"
                  id="header-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="bg-amber-400 hover:bg-amber-300 text-red-950 px-3 sm:px-3.5 py-1.5 rounded-lg font-extrabold flex items-center gap-1 transition-all cursor-pointer text-xs uppercase shadow-xs border border-amber-300"
                >
                  <UserPlus className="w-3.5 h-3.5 text-red-900" />
                  <span>ĐĂNG KÝ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
