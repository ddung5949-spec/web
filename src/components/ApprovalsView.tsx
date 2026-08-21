import React from 'react';
import {
  Check,
  CheckSquare,
  Eye,
  FolderLock,
  Heart,
  Home,
  Laptop,
  Shield,
  ShieldCheck,
  Trash2,
  UserPen,
  Users,
} from 'lucide-react';
import { Article, PageView } from '../types';

interface ApprovalsViewProps {
  pendingArticles: Article[];
  onOpenArticle: (article: Article) => void;
  onApproveArticle: (articleId: number) => void;
  onRejectArticle: (articleId: number) => void;
  onSelectSection?: (section: PageView) => void;
  onGoHome?: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  pendingArticles,
  onOpenArticle,
  onApproveArticle,
  onRejectArticle,
  onSelectSection,
  onGoHome,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Clickable Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={onGoHome}
          className="hover:text-emerald-800 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span className="text-gray-900 font-bold">Phê duyệt dự thảo tin bài</span>
      </nav>

      {/* 2. Admin Quick Switcher Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-emerald-800 text-white shadow-xs flex items-center gap-1.5"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Duyệt tin bài</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection && onSelectSection('users')}
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-800 border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-amber-700" />
          <span>Quản trị người dùng</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection && onSelectSection('doc')}
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <FolderLock className="w-3.5 h-3.5 text-blue-600" />
          <span>Kho Văn bản</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection && onSelectSection('ctd')}
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-red-600" />
          <span>Chuyên mục CTCT</span>
        </button>
      </div>

      {/* 3. Title */}
      <div className="border-b-2 border-emerald-800 pb-2 flex items-center justify-between">
        <h2 className="text-sm md:text-base font-extrabold uppercase text-emerald-950 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-800" />
          <span>Trung tâm Phê duyệt Dự thảo Tin bài (Ban Biên tập)</span>
        </h2>
        <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
          {pendingArticles.length} bài chờ duyệt
        </span>
      </div>


      {/* Description */}
      <div className="bg-white p-3.5 rounded-lg border-l-4 border-emerald-800 shadow-xs">
        <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
          Quy trình kiểm duyệt thông tin tuyên truyền chính quy
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Quản trị viên kiểm tra nội dung chính trị tư tưởng trước khi cho phép hiển thị công khai trên các chuyên trang của Sư đoàn.
        </p>
      </div>

      {/* Pending Articles List */}
      <div className="space-y-3">
        {pendingArticles.length > 0 ? (
          pendingArticles.map((art) => (
            <div
              key={art.id}
              className="bg-white rounded-lg border-l-4 border-emerald-700 shadow-xs border-r border-t border-b border-gray-200 p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-200">
                    DỰ THẢO CHỜ DUYỆT
                  </span>
                  <span className="text-xs text-red-700 font-bold">[{art.category}]</span>
                </div>

                <h3 className="text-sm font-bold text-gray-900 leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-gray-600 line-clamp-2">
                  {art.excerpt}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                  <UserPen className="w-3 h-3 text-red-600" />
                  <span>Tác giả: <strong>{art.author}</strong></span>
                  <span>•</span>
                  <span>Ngày gửi: {art.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => onOpenArticle(art)}
                  className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đọc toàn bộ nội dung dự thảo"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước</span>
                </button>

                <button
                  type="button"
                  id={`btn-approve-${art.id}`}
                  onClick={() => onApproveArticle(art.id)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Duyệt đăng</span>
                </button>

                <button
                  type="button"
                  id={`btn-reject-${art.id}`}
                  onClick={() => onRejectArticle(art.id)}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg border border-gray-200">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-800">Không có dự thảo nào đang chờ phê duyệt</h4>
            <p className="text-xs text-gray-500 mt-1">
              Tất cả các bài viết gửi lên đã được duyệt xuất bản hoặc xử lý hoàn tất.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
