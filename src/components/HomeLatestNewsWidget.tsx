import React from 'react';
import { ChevronRight, Newspaper } from 'lucide-react';
import { Article, PageView } from '../types';
import { LatestNewsSkeleton } from './SkeletonLoader';

interface HomeLatestNewsWidgetProps {
  articles: Article[];
  isLoading?: boolean;
  onOpenArticle: (article: Article) => void;
  onSelectSection: (section: PageView) => void;
}

export const HomeLatestNewsWidget: React.FC<HomeLatestNewsWidgetProps> = ({
  articles,
  isLoading = false,
  onOpenArticle,
  onSelectSection,
}) => {
  if (isLoading) {
    return <LatestNewsSkeleton />;
  }

  const latestArticles = articles.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden flex flex-col justify-between h-full min-h-[340px]">
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
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
      <div className="p-3 divide-y divide-gray-100 flex-1 flex flex-col justify-around">
        {latestArticles.length > 0 ? (
          latestArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => onOpenArticle(art)}
              className="py-1.5 first:pt-0 last:pb-0 group cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold text-xs mt-0.5 shrink-0 select-none">
                  ▪
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2 transition-colors">
                    {art.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
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
          <p className="text-xs text-gray-400 italic py-3 text-center">
            Chưa có tin bài mới.
          </p>
        )}
      </div>
    </div>
  );
};
