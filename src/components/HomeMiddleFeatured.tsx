import React, { useState, useEffect } from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  Flag,
  Settings2,
  Sparkles,
  Trash2,
  UserPen,
} from 'lucide-react';
import { Article, HomeAnnouncement, User } from '../types';

interface HomeMiddleFeaturedProps {
  articles: Article[];
  announcements: HomeAnnouncement[];
  currentUser: User | null;
  onOpenArticle: (article: Article) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
  onOpenAnnouncementManager?: () => void;
}

export const HomeMiddleFeatured: React.FC<HomeMiddleFeaturedProps> = ({
  articles,
  announcements,
  currentUser,
  onOpenArticle,
  onEditArticle,
  onDeleteArticle,
  onOpenAnnouncementManager,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const featuredArticles = articles.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-play carousel
  useEffect(() => {
    if (featuredArticles.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredArticles.length, isHovered]);

  const currentArticle = featuredArticles[currentIndex] || featuredArticles[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? featuredArticles.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
  };

  return (
    <div className="space-y-3.5 flex flex-col justify-between h-full">
      {/* 1. Featured Article Carousel */}
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative group flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {currentArticle ? (
          <div
            onClick={() => onOpenArticle(currentArticle)}
            className="cursor-pointer relative overflow-hidden flex flex-col"
          >
            {/* Image Container with 16:10 / 16:9 ratio */}
            <div className="relative h-72 sm:h-80 md:h-96 lg:h-[420px] w-full overflow-hidden bg-slate-900">
              <img
                src={
                  currentArticle.image ||
                  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'
                }
                alt={currentArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white" />

              {/* Top Bar on Image: Category Badge & Admin Controls */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                <span className="bg-red-700/95 text-amber-300 text-[11px] sm:text-xs font-black uppercase px-3 py-1.5 rounded-md shadow-md border border-red-500/50 backdrop-blur-xs flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{currentArticle.category || 'TIÊU ĐIỂM HOẠT ĐỘNG'}</span>
                </span>

                {isAdmin && (
                  <div className="flex items-center gap-1.5 z-20">
                    {onEditArticle && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditArticle(currentArticle);
                        }}
                        className="bg-black/75 hover:bg-amber-600 text-amber-200 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                        title="Sửa bài viết tiêu điểm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    )}
                    {onDeleteArticle && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Đồng chí có chắc chắn muốn gỡ bài viết "${currentArticle.title}"?`
                            )
                          ) {
                            onDeleteArticle(currentArticle.id);
                          }
                        }}
                        className="bg-black/75 hover:bg-red-600 text-red-200 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                        title="Xóa bài viết tiêu điểm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Carousel Arrows */}
              {featuredArticles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs"
                    title="Tin trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs"
                    title="Tin kế tiếp"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Bottom Captions Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10 space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white group-hover:text-amber-300 transition-colors leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] line-clamp-2">
                  {currentArticle.title}
                </h3>
                <p className="text-sm sm:text-base text-white/90 line-clamp-2 leading-relaxed hidden sm:block">
                  {currentArticle.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs sm:text-sm text-white/80 pt-2.5 border-t border-white/20">
                  <span className="flex items-center gap-2 font-medium text-white/90">
                    <UserPen className="w-4 h-4 text-amber-300" />
                    <span>{currentArticle.author}</span>
                    <span className="text-white/40">•</span>
                    <span>{currentArticle.date}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-white/90 font-medium">
                    <Eye className="w-4 h-4 text-amber-300" />
                    <span>{currentArticle.views || 0} lượt xem</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Slider Dots */}
            {featuredArticles.length > 1 && (
              <div className="bg-slate-900/90 py-1.5 flex items-center justify-center gap-1.5 border-t border-white/10">
                {featuredArticles.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    title={`Chuyển đến tin ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-500">
            Chưa có bài viết tiêu điểm nào.
          </div>
        )}
      </div>

      {/* 2. Announcements & Events Strip (Dải thông báo màu vàng nhạt có chuông 🔔 như trong hình) */}
      <div className="bg-white rounded-xl border border-amber-300/80 shadow-xs overflow-hidden">
        <div className="bg-linear-to-r from-amber-600 via-amber-700 to-red-800 text-white px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-200">
              THÔNG BÁO & SỰ KIỆN QUAN TRỌNG
            </span>
          </div>
          {isAdmin && onOpenAnnouncementManager && (
            <button
              type="button"
              onClick={onOpenAnnouncementManager}
              className="text-[10px] bg-black/30 hover:bg-black/50 text-amber-200 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Quản lý các thông báo"
            >
              <Settings2 className="w-3 h-3" />
              <span>Quản lý</span>
            </button>
          )}
        </div>

        <div className="p-2 space-y-1.5 bg-amber-50/40">
          {announcements && announcements.length > 0 ? (
            announcements.map((ann, idx) => (
              <div
                key={ann.id || idx}
                className="group p-2.5 rounded-lg bg-white hover:bg-amber-50/90 border border-amber-200/90 hover:border-amber-400 transition-all shadow-2xs flex items-start gap-2.5 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-red-800 leading-snug line-clamp-2 transition-colors">
                    {ann.title}
                  </p>
                  {ann.date && (
                    <div className="text-[10px] text-amber-800/80 font-semibold mt-1 flex items-center gap-1">
                      <span>Cập nhật: {ann.date}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-gray-500 italic">
              Chưa có thông báo sự kiện mới.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
