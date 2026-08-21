import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Flag,
  Sparkles,
  Trash2,
  UserPen,
} from 'lucide-react';
import { Article, User } from '../types';

interface HomeMiddleFeaturedSliderProps {
  articles: Article[];
  currentUser: User | null;
  onOpenArticle: (article: Article) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
}

export const HomeMiddleFeaturedSlider: React.FC<
  HomeMiddleFeaturedSliderProps
> = ({
  articles,
  currentUser,
  onOpenArticle,
  onEditArticle,
  onDeleteArticle,
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
    setCurrentIndex((prev) =>
      prev === 0 ? featuredArticles.length - 1 : prev - 1
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden relative group flex flex-col justify-between h-full min-h-[340px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentArticle ? (
        <div
          onClick={() => onOpenArticle(currentArticle)}
          className="cursor-pointer relative overflow-hidden flex-1 flex flex-col justify-between"
        >
          {/* Background image filling container */}
          <div className="relative w-full h-full min-h-[340px] overflow-hidden bg-slate-900 flex flex-col justify-between">
            <img
              src={
                currentArticle.image ||
                'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'
              }
              alt={currentArticle.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25 pointer-events-none" />

            {/* Top Bar on Image: Category Badge & Admin Controls */}
            <div className="relative z-10 p-3 flex items-center justify-between gap-2">
              <span className="bg-red-700/95 text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-md border border-red-500/40 backdrop-blur-xs flex items-center gap-1">
                <Flag className="w-3 h-3 text-amber-300 fill-amber-300" />
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
                      className="bg-black/75 hover:bg-amber-600 text-amber-200 hover:text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                      title="Sửa bài viết tiêu điểm"
                    >
                      <Edit3 className="w-3 h-3" />
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
                      className="bg-black/75 hover:bg-red-600 text-red-200 hover:text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                      title="Xóa bài viết tiêu điểm"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Carousel Navigation Arrows */}
            {featuredArticles.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-md z-20"
                  title="Tin trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-md z-20"
                  title="Tin kế tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Bottom Captions Overlay */}
            <div className="relative z-10 p-4 sm:p-5 space-y-2">
              <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors leading-snug drop-shadow-md line-clamp-2">
                {currentArticle.title}
              </h3>
              <p className="text-xs text-white/85 line-clamp-2 leading-relaxed">
                {currentArticle.excerpt}
              </p>

              <div className="flex items-center justify-between text-[11px] text-white/75 pt-2 border-t border-white/20">
                <span className="flex items-center gap-1.5 font-medium text-white/90">
                  <UserPen className="w-3 h-3 text-amber-300" />
                  <span>{currentArticle.author}</span>
                  <span className="text-white/30">•</span>
                  <span>{currentArticle.date}</span>
                </span>
                <span className="flex items-center gap-1 text-white/85 font-medium">
                  <Eye className="w-3 h-3 text-amber-300" />
                  <span>{currentArticle.views || 0} lượt xem</span>
                </span>
              </div>
            </div>
          </div>

          {/* Slider Dots */}
          {featuredArticles.length > 1 && (
            <div className="bg-slate-950 py-1.5 flex items-center justify-center gap-1.5 border-t border-white/10 shrink-0">
              {featuredArticles.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 bg-amber-400'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Chuyển đến tin ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-gray-500 flex items-center justify-center h-full">
          Chưa có bài viết tiêu điểm nào.
        </div>
      )}
    </div>
  );
};
