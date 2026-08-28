import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronRight,
  Edit,
  ExternalLink,
  FileText,
  FolderLock,
  GraduationCap,
  LogIn,
  LogOut,
  Newspaper,
  Plus,
  Settings2,
  Shield,
  User,
  Users,
  Video,
} from 'lucide-react';
import { Article, PageView, RightSidebarWidgetType, User as UserType } from '../types';

interface HomeRightSidebarProps {
  articles: Article[];
  currentUser: UserType | null;
  widgets?: RightSidebarWidgetType[];
  onOpenArticle: (article: Article) => void;
  onSelectSection: (section: PageView) => void;
  onOpenAuthModal: (tab: 'login' | 'register') => void;
  onOpenProfileModal: () => void;
  onLogout: () => void;
  onOpenCustomizer?: () => void;
}

export const HomeRightSidebar: React.FC<HomeRightSidebarProps> = ({
  articles,
  currentUser,
  widgets = ['latest_news', 'quick_login', 'online_exam', 'document_library', 'video_library', 'public_survey'],
  onOpenArticle,
  onSelectSection,
  onOpenAuthModal,
  onOpenProfileModal,
  onLogout,
  onOpenCustomizer,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const latestArticles = articles.slice(0, 6);

  // Quick online exam modal state
  const [showExamAlert, setShowExamAlert] = useState(false);

  return (
    <div className="space-y-3.5 flex flex-col justify-between h-full">
      {/* 1. TIN MỚI NHẤT Block */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
        {/* Header with Red Accent Bar */}
        <div className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-700 rounded-full inline-block" />
            <h3 className="font-black text-xs uppercase tracking-wider text-red-950 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-red-700" />
              <span>TIN MỚI NHẤT</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onSelectSection('ctd')}
            className="text-[11px] text-red-700 hover:text-red-900 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Latest Articles List */}
        <div className="p-3 divide-y divide-gray-100 space-y-2">
          {latestArticles.length > 0 ? (
            latestArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => onOpenArticle(art)}
                className="pt-2 first:pt-0 group cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-bold text-xs mt-0.5 shrink-0 select-none">
                    ▪
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2 transition-colors">
                      {art.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                      <span className="text-red-800 font-semibold bg-red-50 px-1 rounded">
                        {art.category}
                      </span>
                      <span>•</span>
                      <span>{art.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic py-3 text-center">Chưa có tin bài mới.</p>
          )}
        </div>
      </div>

      {/* 2. 4 Action Shortcut Tiles */}
      <div className="space-y-2">
        {/* 1. THI TRỰC TUYẾN (Red) */}
        <div
          onClick={() => setShowExamAlert(true)}
          className="group p-2.5 rounded-xl bg-linear-to-r from-red-700 via-red-800 to-rose-900 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between border border-red-500/30"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <div className="font-black text-xs uppercase tracking-wide text-yellow-300">
                THI TRỰC TUYẾN
              </div>
              <div className="text-[10px] text-white/80 line-clamp-1">
                Tìm hiểu Đại hội Đảng & Nghị quyết
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-yellow-300 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* 2. THƯ VIỆN TÀI LIỆU (Green) */}
        <div
          onClick={() => onSelectSection('doc')}
          className="group p-2.5 rounded-xl bg-linear-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between border border-emerald-500/30"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <FolderLock className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="font-black text-xs uppercase tracking-wide text-emerald-200">
                THƯ VIỆN TÀI LIỆU
              </div>
              <div className="text-[10px] text-white/80 line-clamp-1">
                Kho văn bản, chỉ thị & biểu mẫu số
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-emerald-200 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* 3. BÀI GIẢNG & VIDEO SỐ (Blue) */}
        <div
          onClick={() => onSelectSection('lecture')}
          className="group p-2.5 rounded-xl bg-linear-to-r from-blue-800 via-blue-900 to-indigo-950 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between border border-blue-500/30"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="font-black text-xs uppercase tracking-wide text-cyan-200">
                BÀI GIẢNG & VIDEO SỐ
              </div>
              <div className="text-[10px] text-white/80 line-clamp-1">
                Giáo án chính trị, quân sự điện tử
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-cyan-200 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* 4. PHÒNG HỌP ĐẢNG ỦY (Pink / Purple) */}
        <div
          onClick={() => onSelectSection('meeting')}
          className="group p-2.5 rounded-xl bg-linear-to-r from-rose-900 via-pink-900 to-purple-950 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between border border-pink-500/30"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <div className="font-black text-xs uppercase tracking-wide text-pink-200">
                HỌP ĐẢNG ỦY & DƯ LUẬN
              </div>
              <div className="text-[10px] text-white/80 line-clamp-1">
                Phòng họp trực tuyến & Biểu quyết
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-pink-200 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Admin Customizer trigger */}
      {isAdmin && onOpenCustomizer && (
        <button
          type="button"
          onClick={onOpenCustomizer}
          className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5 text-amber-700" />
          <span>Tùy biến cột & Giao diện trang chủ</span>
        </button>
      )}

      {/* Online Exam modal alert */}
      {showExamAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-gray-200 text-center space-y-3 animate-in fade-in zoom-in">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Cuộc thi Tìm hiểu Trực tuyến</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Cuộc thi tìm hiểu trực tuyến Đại hội XIV của Đảng, Đại hội Đảng bộ Quân đội lần thứ XII và Đảng bộ Trung đoàn 95 đang diễn ra tuần thứ 3. 100% cán bộ, chiến sĩ tham gia dự thi.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowExamAlert(false)}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Vào phòng thi trắc nghiệm
              </button>
              <button
                type="button"
                onClick={() => setShowExamAlert(false)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
