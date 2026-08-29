import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Flag,
  Settings2,
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

  // Auto-play carousel (5s per slide, pauses on hover)
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
    <div className="space-y-4 flex flex-col justify-between h-full">
      {/* 1. Featured Article Carousel - Tách rời hoàn toàn hình ảnh và chữ */}
      <div
        className="bg-white rounded-xl shadow-md overflow-hidden relative group flex flex-col w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {currentArticle ? (
          <div className="flex flex-col w-full">
            {/* Khung ảnh thuần túy (Phần trên 16:9, không chữ đè lên ảnh) */}
            <div
              onClick={() => onOpenArticle(currentArticle)}
              className="relative h-[240px] sm:h-[300px] md:h-[340px] lg:h-[360px] xl:h-[380px] w-full overflow-hidden bg-slate-900 rounded-t-xl cursor-pointer"
            >
              <img
                src={
                  currentArticle.image ||
                  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'
                }
                alt={currentArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />

              {/* Badge nhỏ màu đỏ góc trái ảnh */}
              <div className="absolute top-3.5 left-3.5 z-10">
                <span className="bg-red-700 text-white text-[11px] sm:text-xs font-black uppercase px-3 py-1.5 rounded-md shadow-md border border-red-500/60 backdrop-blur-xs flex items-center gap-1.5 tracking-wider">
                  <Flag className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{currentArticle.category || 'CÔNG TÁC TUYÊN HUẤN'}</span>
                </span>
              </div>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-20">
                  {onEditArticle && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditArticle(currentArticle);
                      }}
                      className="bg-black/75 hover:bg-amber-600 text-amber-200 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
                      title="Sửa bài viết"
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
                      className="bg-black/75 hover:bg-red-600 text-red-200 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              )}

              {/* Carousel Arrows */}
              {featuredArticles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs hover:scale-105"
                    title="Tin trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs hover:scale-105"
                    title="Tin kế tiếp"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Khung thông tin bài viết nền sáng/trắng */}
            <div className="rounded-b-xl border border-gray-200 border-t-0 p-5 bg-white flex flex-col justify-between">
              {/* Dòng thông tin phụ */}
              <div className="text-sm text-gray-500 flex items-center flex-wrap gap-4 mb-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <span>{currentArticle.date}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <UserPen className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-semibold">{currentArticle.author}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span>{currentArticle.views || 0} lượt xem</span>
                </span>
              </div>

              {/* Tiêu đề bài viết */}
              <h3
                onClick={() => onOpenArticle(currentArticle)}
                className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-red-700 transition-colors line-clamp-2 leading-snug cursor-pointer uppercase font-sans"
              >
                {currentArticle.title}
              </h3>

              {/* Tóm tắt */}
              <p className="text-base text-gray-600 line-clamp-3 leading-relaxed mt-2 font-normal">
                {currentArticle.excerpt}
              </p>

              {/* Đọc tiếp & Chấm tròn */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onOpenArticle(currentArticle)}
                  className="inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-800 text-sm group/btn cursor-pointer transition-colors"
                >
                  <span>Đọc tiếp bài viết</span>
                  <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>

                {featuredArticles.length > 1 && (
                  <div className="flex items-center gap-2">
                    {featuredArticles.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentIndex(idx);
                        }}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          idx === currentIndex
                            ? 'w-7 bg-red-700 shadow-xs'
                            : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                        }`}
                        title={`Chuyển đến tin ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-500">
            Chưa có bài viết tiêu điểm nào.
          </div>
        )}
      </div>

      {/* 2. Announcements & Events Strip */}
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
