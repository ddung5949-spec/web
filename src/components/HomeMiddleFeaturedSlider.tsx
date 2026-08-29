import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Flag,
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
    setCurrentIndex((prev) =>
      prev === 0 ? featuredArticles.length - 1 : prev - 1
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
  };

  if (!currentArticle) {
    return (
      <div className={`bg-gradient-to-br from-red-900 to-amber-900 text-white rounded-xl shadow-md p-8 text-center min-h-[220px] flex flex-col items-center justify-center transition-opacity duration-300 ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
          <Flag className="w-6 h-6 text-amber-300" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">Đang cập nhật tin nổi bật</h3>
        <p className="text-xs text-white/80 mt-1">Các bài viết mới sẽ được cập nhật liên tục.</p>
      </div>
    );
  }

  return (
    <div
      id="home-middle-featured-slider"
      className={`bg-white rounded-xl shadow-md overflow-hidden relative group flex flex-col w-full transition-opacity duration-300 ${isLoading ? 'opacity-85' : 'opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentArticle ? (
        <div className="flex flex-col w-full">
          {/* 1. KHUNG ẢNH THUẦN TÚY (Phần trên - Tỉ lệ 16:9, không chữ đè lên ảnh) */}
          <div
            onClick={() => onOpenArticle(currentArticle)}
            className="relative w-full h-[240px] sm:h-[300px] md:h-[340px] lg:h-[360px] xl:h-[380px] overflow-hidden bg-slate-900 rounded-t-xl cursor-pointer"
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

            {/* Badge nhỏ màu đỏ gắn góc trái ảnh ghi tên Tiểu mục */}
            <div className="absolute top-3.5 left-3.5 z-10">
              <span className="bg-red-700 text-white text-[11px] sm:text-xs font-black uppercase px-3 py-1.5 rounded-md shadow-md border border-red-500/60 backdrop-blur-xs flex items-center gap-1.5 tracking-wider">
                <Flag className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{currentArticle.category || 'CÔNG TÁC TUYÊN HUẤN'}</span>
              </span>
            </div>

            {/* Admin Controls on Image */}
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

            {/* Carousel Navigation Arrows on Image */}
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

          {/* 2. KHUNG THÔNG TIN BÀI VIẾT NỀN SÁNG/TRẮNG (Phần dưới tách rời hoàn toàn) */}
          <div className="rounded-b-xl border border-gray-200 border-t-0 p-5 bg-white flex flex-col justify-between">
            {/* Dòng thông tin phụ: Ngày đăng, tác giả, lượt xem */}
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

            {/* Tiêu đề bài viết: Tăng cỡ chữ to, rõ ràng, in hoa đậm */}
            <h3
              onClick={() => onOpenArticle(currentArticle)}
              className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-red-700 transition-colors line-clamp-2 leading-snug cursor-pointer uppercase font-sans"
            >
              {currentArticle.title}
            </h3>

            {/* Nội dung tóm tắt: Đoạn trích dẫn tóm tắt 2-3 dòng chữ rõ ràng, dễ đọc */}
            <p className="text-base text-gray-600 line-clamp-3 leading-relaxed mt-2 font-normal">
              {currentArticle.excerpt}
            </p>

            {/* Nút "Đọc tiếp bài viết →" màu đỏ nổi bật và 5 Chấm tròn điều hướng */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpenArticle(currentArticle)}
                className="inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-800 text-sm group/btn cursor-pointer transition-colors"
              >
                <span>Đọc tiếp bài viết</span>
                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
              </button>

              {/* 5 chấm tròn điều hướng bên dưới */}
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
        <div className="p-8 text-center text-xs text-gray-500 flex items-center justify-center h-48">
          Chưa có bài viết tiêu điểm nào.
        </div>
      )}
    </div>
  );
};
