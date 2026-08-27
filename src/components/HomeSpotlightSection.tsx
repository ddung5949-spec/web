import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Edit3,
  Eye,
  Flag,
  Flame,
  Newspaper,
  Settings2,
  Sparkles,
  Star,
  UserPen,
} from 'lucide-react';
import { Article, User } from '../types';
import { defaultArticles } from '../data/initialData';
import { SpotlightArticleSelectModal } from './modals/SpotlightArticleSelectModal';

interface HomeSpotlightSectionProps {
  articles: Article[];
  spotlightArticleId?: number;
  currentUser: User | null;
  onOpenArticle: (article: Article) => void;
  onEditArticle?: (article: Article) => void;
  onSelectSpotlightArticle?: (articleId: number) => void;
}

export const HomeSpotlightSection: React.FC<HomeSpotlightSectionProps> = ({
  articles,
  spotlightArticleId,
  currentUser,
  onOpenArticle,
  onEditArticle,
  onSelectSpotlightArticle,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  // Safe articles pool with fallback
  const effectiveArticles = articles && articles.length > 0 ? articles : defaultArticles;

  // Find the primary spotlight article
  const primaryArticle =
    (spotlightArticleId ? effectiveArticles.find((a) => String(a.id) === String(spotlightArticleId)) : null) ||
    effectiveArticles[0] ||
    defaultArticles[0];

  // Secondary sub-featured articles
  const subArticles = effectiveArticles
    .filter((a) => String(a.id) !== String(primaryArticle?.id))
    .slice(0, 2);

  if (!primaryArticle) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Header bar */}
      <div className="bg-linear-to-r from-red-800 via-red-900 to-amber-950 text-white px-4 py-2.5 flex items-center justify-between shadow-xs border-b-2 border-amber-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          </div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
            BÀI ĐĂNG TIÊU BIỂU & NỔI BẬT
          </h3>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSelectModalOpen(true)}
              className="text-[10px] bg-amber-400 hover:bg-amber-300 text-red-950 px-2.5 py-1 rounded font-black flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="Chọn bài đăng khác làm tiêu biểu"
            >
              <Star className="w-3 h-3 text-red-950 fill-red-950" />
              <span>Chọn bài tiêu biểu</span>
            </button>
            {onEditArticle && (
              <button
                type="button"
                onClick={() => onEditArticle(primaryArticle)}
                className="text-[10px] bg-black/40 hover:bg-black/60 text-amber-200 px-2 py-1 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Sửa nội dung bài viết này"
              >
                <Edit3 className="w-3 h-3" />
                <span>Sửa bài</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 sm:p-4 space-y-3.5 flex-1 flex flex-col justify-between">
        {/* Top: Primary Featured Spotlight Card */}
        <div
          onClick={() => onOpenArticle(primaryArticle)}
          className="group grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-amber-50/30 hover:bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 transition-all duration-200 cursor-pointer"
        >
          {/* Featured Image with Ratio */}
          <div className="md:col-span-5 relative rounded-lg overflow-hidden bg-slate-900 aspect-16/10 shadow-xs">
            <img
              src={primaryArticle.image}
              alt={primaryArticle.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            />
            <div className="absolute top-2 left-2">
              <span className="bg-red-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                {primaryArticle.category}
              </span>
            </div>
          </div>

          {/* Featured Details */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                <span className="flex items-center gap-1 text-red-800 font-bold">
                  <Calendar className="w-3 h-3 text-red-700" />
                  <span>{primaryArticle.date}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UserPen className="w-3 h-3 text-gray-400" />
                  <span>{primaryArticle.author}</span>
                </span>
              </div>

              <h4 className="text-sm font-black text-gray-900 group-hover:text-red-700 transition-colors leading-snug line-clamp-2">
                {primaryArticle.title}
              </h4>

              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {primaryArticle.excerpt}
              </p>
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
              <span className="text-red-700 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                <span>Đọc toàn văn bài viết</span>
                <ArrowRight className="w-3 h-3" />
              </span>
              <span className="text-gray-400 flex items-center gap-1 text-[10px]">
                <Eye className="w-3 h-3" />
                <span>{primaryArticle.views || 0} lượt đọc</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Sub-articles grid if available */}
        {subArticles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {subArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => onOpenArticle(art)}
                className="group p-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-red-300 transition-all flex items-start gap-2.5 cursor-pointer shadow-2xs"
              >
                <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                  <img
                    src={art.image}
                    alt={art.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h5 className="text-[11px] font-bold text-gray-800 group-hover:text-red-700 leading-tight line-clamp-2 transition-colors">
                    {art.title}
                  </h5>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                    <span className="text-red-700 font-semibold">{art.category}</span>
                    <span>•</span>
                    <span>{art.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select Modal */}
      {isSelectModalOpen && (
        <SpotlightArticleSelectModal
          articles={articles}
          currentSpotlightId={primaryArticle.id}
          onSelect={(selectedId) => {
            if (onSelectSpotlightArticle) {
              onSelectSpotlightArticle(selectedId);
            }
          }}
          onClose={() => setIsSelectModalOpen(false)}
        />
      )}
    </div>
  );
};
