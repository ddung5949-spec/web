import React from 'react';
import {
  ArrowRight,
  CheckSquare,
  Crosshair,
  FolderLock,
  Heart,
  Home,
  Laptop,
  Shield,
  Star,
  Users,
  UsersRound,
} from 'lucide-react';
import { PageView, SiteConfig, User } from '../types';

interface SidebarProps {
  onSelectPage: (page: PageView) => void;
  currentUser: User | null;
  pendingDraftsCount: number;
  currentPage?: PageView;
  siteConfig?: SiteConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onSelectPage,
  currentUser,
  pendingDraftsCount,
  currentPage = 'home',
  siteConfig,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const canJoinMeeting = currentUser?.canJoinPartyMeeting || isAdmin;

  const ctdLabel = siteConfig?.sections?.ctd?.shortLabel || 'Công tác Đảng - CTCT';
  const hlLabel = siteConfig?.sections?.hl?.shortLabel || 'Huấn luyện & SSCĐ';
  const bacLabel = siteConfig?.sections?.bac?.shortLabel || 'Học tập theo Bác';
  const docLabel = siteConfig?.sections?.doc?.shortLabel || 'Kho Văn bản - Tài liệu';
  const lectureLabel = siteConfig?.sections?.lecture?.shortLabel || 'Bài giảng điện tử';
  const meetingLabel = siteConfig?.sections?.meeting?.shortLabel || 'Phòng Họp Đảng ủy';

  const getNavItemClass = (id: PageView) => {
    const isActive = currentPage === id;
    if (isActive) {
      return 'bg-[#fef2f2] text-[#b91c1c] border-l-4 border-[#b91c1c] font-bold';
    }
    return 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] border-l-4 border-transparent font-medium';
  };

  return (
    <aside className="w-full space-y-4">
      {/* Navigation Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e2e8f0] bg-[#fafafa] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#143d2b]">
            Danh mục liên kết
          </span>
          <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24]" />
        </div>

        <nav className="divide-y divide-[#f8fafc] text-xs">
          <button
            type="button"
            id="side-home-link"
            onClick={() => onSelectPage('home')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${getNavItemClass('home')}`}
          >
            <span className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Trang chủ Sư đoàn</span>
            </span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </button>

          <button
            type="button"
            id="side-ctd-link"
            onClick={() => onSelectPage('ctd')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${getNavItemClass('ctd')}`}
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span>{ctdLabel}</span>
            </span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </button>

          <button
            type="button"
            id="side-hl-link"
            onClick={() => onSelectPage('hl')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${getNavItemClass('hl')}`}
          >
            <span className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
              <span>{hlLabel}</span>
            </span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </button>

          <button
            type="button"
            id="side-bac-link"
            onClick={() => onSelectPage('bac')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${getNavItemClass('bac')}`}
          >
            <span className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>{bacLabel}</span>
            </span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </button>

          <button
            type="button"
            id="side-doc-link"
            onClick={() => onSelectPage('doc')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${getNavItemClass('doc')}`}
          >
            <span className="flex items-center gap-2">
              <FolderLock className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span>{docLabel}</span>
            </span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </button>

          <button
            type="button"
            id="side-lecture-link"
            onClick={() => onSelectPage('lecture')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${getNavItemClass('lecture')}`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 shrink-0 text-teal-700" />
              <span>{lectureLabel}</span>
            </span>
            <ArrowRight className="w-3 h-3 opacity-60" />
          </button>

          {/* Phòng Họp Đảng ủy */}
          {canJoinMeeting && (
            <button
              type="button"
              id="sidebar-meeting-link"
              onClick={() => onSelectPage('meeting')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${
                currentPage === 'meeting'
                  ? 'bg-rose-50 text-[#b91c1c] border-l-4 border-[#b91c1c] font-bold'
                  : 'text-[#b91c1c] hover:bg-rose-50/60 font-semibold border-l-4 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <UsersRound className="w-3.5 h-3.5 shrink-0 text-[#b91c1c]" />
                <span>{meetingLabel}</span>
              </span>
              <span className="text-[10px] bg-[#b91c1c] text-white px-1.5 py-0.5 rounded font-bold">
                Online
              </span>
            </button>
          )}

          {/* Duyệt bài Admin */}
          {isAdmin && (
            <button
              type="button"
              id="sidebar-approval-link"
              onClick={() => onSelectPage('approvals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${
                currentPage === 'approvals'
                  ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-700 font-bold'
                  : 'text-emerald-700 hover:bg-emerald-50/60 font-semibold border-l-4 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Duyệt Dự Thảo</span>
              </span>
              {pendingDraftsCount > 0 && (
                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-black">
                  {pendingDraftsCount}
                </span>
              )}
            </button>
          )}

          {/* Phân quyền Admin */}
          {isAdmin && (
            <button
              type="button"
              id="sidebar-admin-link"
              onClick={() => onSelectPage('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer ${
                currentPage === 'users'
                  ? 'bg-amber-50 text-amber-900 border-l-4 border-amber-600 font-bold'
                  : 'text-amber-800 hover:bg-amber-50/60 font-semibold border-l-4 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Quản trị Người dùng</span>
              </span>
              <ArrowRight className="w-3 h-3 opacity-60" />
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
};
