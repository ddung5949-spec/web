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
import { SliderSkeleton } from './SkeletonLoader';

interface HomeMiddleFeaturedSliderProps {
  articles: Article[];
  currentUser: User | null;
  isLoading?: boolean;
  onOpenArticle: (article: Article) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
}

export const HomeMiddleFeaturedSlider: React.FC<
  HomeMiddleFeaturedSliderProps
> = ({
  articles,
  currentUser,
  isLoading = false,
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

  if (isLoading) {
    return <SliderSkeleton />;
  }

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
      className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden relative group flex flex-col justify-between h-full min-h-[420px] sm:min-h-[440px] md:min-h-[460px] lg:h-[460px] xl:h-[480px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentArticle ? (
        <div
          onClick={() => onOpenArticle(currentArticle)}
          className="cursor-pointer relative overflow-hidden flex-1 flex flex-col justify-between h-full"
        >
          {/* Background image filling container */}
          <div className="relative w-full h-full min-h-[420px] sm:min-h-[440px] md:min-h-[460px] overflow-hidden bg-slate-900 flex flex-col justify-between flex-1">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30 pointer-events-none" />

            {/* Top Bar on Image: Category Badge & Admin Controls */}
            <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-2">
              <span className="bg-red-700/95 text-amber-300 text-[11px] sm:text-xs font-black uppercase px-3 py-1.5 rounded-md shadow-md border border-red-500/50 backdrop-blur-xs flex items-center gap-1.5 tracking-wider">
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
                      className="bg-black/75 hover:bg-amber-600 text-amber-200 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
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
                      className="bg-black/75 hover:bg-red-600 text-red-200 hover:text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
                      title="Xóa bài viết tiêu điểm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs hover:scale-105"
                  title="Tin trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg z-20 backdrop-blur-xs hover:scale-105"
                  title="Tin kế tiếp"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Bottom Captions Overlay */}
            <div className="relative z-10 p-5 sm:p-6 space-y-2.5">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white group-hover:text-amber-300 transition-colors leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] line-clamp-2">
                {currentArticle.title}
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-white/95 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] font-medium">
                {currentArticle.excerpt}
              </p>

              <div className="flex items-center justify-between text-xs sm:text-sm text-white/80 pt-3 border-t border-white/20">
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
            <div className="bg-slate-950 py-2 flex items-center justify-center gap-2 border-t border-white/10 shrink-0">
              {featuredArticles.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-8 bg-amber-400 shadow-xs'
                      : 'w-2.5 bg-white/40 hover:bg-white/70'
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
