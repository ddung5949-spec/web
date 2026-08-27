import React from 'react';
import { Bell, ChevronRight, ExternalLink, Megaphone, Settings2 } from 'lucide-react';
import { Article, HomeAnnouncement, User } from '../types';
import { AnnouncementsSkeleton } from './SkeletonLoader';

interface HomeAnnouncementsWidgetProps {
  announcements: HomeAnnouncement[];
  currentUser: User | null;
  articles?: Article[];
  isLoading?: boolean;
  onOpenArticle?: (article: Article) => void;
  onOpenAnnouncementManager?: () => void;
}

export const HomeAnnouncementsWidget: React.FC<HomeAnnouncementsWidgetProps> = ({
  announcements,
  currentUser,
  articles = [],
  isLoading = false,
  onOpenArticle,
  onOpenAnnouncementManager,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  if (isLoading) {
    return <AnnouncementsSkeleton />;
  }

  const handleClickItem = (ann: HomeAnnouncement) => {
    if (ann.link) {
      if (ann.link.startsWith('http')) {
        window.open(ann.link, '_blank', 'noopener,noreferrer');
      }
    } else if (ann.articleId && onOpenArticle) {
      const match = articles.find((a) => a.id === ann.articleId);
      if (match) onOpenArticle(match);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-300 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Header Bar */}
      <div className="bg-linear-to-r from-amber-600 via-amber-700 to-red-800 text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-200 truncate">
            THÔNG BÁO & SỰ KIỆN QUAN TRỌNG
          </h3>
        </div>
        {isAdmin && onOpenAnnouncementManager && (
          <button
            type="button"
            onClick={onOpenAnnouncementManager}
            className="text-[10px] bg-black/35 hover:bg-black/55 text-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-1"
            title="Quản lý danh sách thông báo & sự kiện"
          >
            <Settings2 className="w-3 h-3 text-amber-300" />
            <span>Sửa</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="p-2.5 space-y-2 bg-amber-50/40 flex-1">
        {announcements && announcements.length > 0 ? (
          announcements.map((ann, idx) => (
            <div
              key={ann.id || idx}
              onClick={() => handleClickItem(ann)}
              className={`group p-2.5 rounded-xl bg-white hover:bg-amber-50/90 border transition-all duration-200 shadow-2xs flex items-start gap-2.5 cursor-pointer ${
                ann.highlight
                  ? 'border-amber-400 ring-1 ring-amber-300/60'
                  : 'border-amber-200/90 hover:border-amber-400'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 group-hover:text-red-800 leading-snug line-clamp-3 transition-colors">
                  {ann.title}
                </p>
                {ann.date && (
                  <div className="text-[10px] text-amber-900/80 font-semibold mt-1 flex items-center gap-1">
                    <span>Cập nhật: {ann.date}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-gray-500 italic">
            Chưa có thông báo sự kiện mới.
          </div>
        )}
      </div>
    </div>
  );
};
