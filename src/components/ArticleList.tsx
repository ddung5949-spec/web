import React from 'react';
import { BookOpen, Edit3, Eye, Filter, Trash2, UserPen } from 'lucide-react';
import { Article } from '../types';
import { ArticleCard } from './ArticleCard';
import { ArticleCardSkeleton } from './SkeletonLoader';

interface ArticleListProps {
  articles: Article[];
  selectedCategory?: string;
  searchQuery?: string;
  isLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onOpenArticle: (article: Article) => void;
  onEditArticle?: (article: Article) => void;
  onDeleteArticle?: (articleId: number) => void;
  onResetFilter?: () => void;
  onOpenPostModal?: () => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  selectedCategory = 'all',
  searchQuery = '',
  isLoading = false,
  canEdit = false,
  canDelete = false,
  onOpenArticle,
  onEditArticle,
  onDeleteArticle,
  onResetFilter,
  onOpenPostModal,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.length > 0 ? (
        articles.map((article) => (
          <ArticleCard
            key={String(article.id)}
            article={article}
            onClick={() => onOpenArticle(article)}
            canEdit={canEdit}
            onEdit={() => onEditArticle && onEditArticle(article)}
            canDelete={canDelete}
            onDelete={() => onDeleteArticle && onDeleteArticle(article.id)}
          />
        ))
      ) : (
        <div className="bg-white p-8 sm:p-10 text-center text-gray-500 rounded-xl border border-gray-200 space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">
            {selectedCategory !== 'all'
              ? `Chưa có bài viết nào trong danh mục "${selectedCategory}"`
              : 'Chưa có bài viết nào phù hợp'}
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery
              ? `Không tìm thấy kết quả phù hợp với từ khóa "${searchQuery}". Vui lòng thử từ khóa khác hoặc quay lại danh sách đầy đủ.`
              : 'Hãy chọn xem toàn bộ tài liệu của chuyên mục hoặc gửi bài viết mới lên hệ thống.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onResetFilter && (
              <button
                type="button"
                onClick={onResetFilter}
                className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Xem tất cả bài viết
              </button>
            )}
            {onOpenPostModal && (
              <button
                type="button"
                onClick={onOpenPostModal}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-amber-300"
              >
                Gửi bài viết mới ngay
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
