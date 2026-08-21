import React from 'react';
import { Edit3, Eye, Trash2, UserPen } from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onClick,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-all cursor-pointer flex flex-col sm:flex-row group mb-3.5"
    >
      <div className="sm:w-48 md:w-52 h-40 sm:h-auto shrink-0 relative overflow-hidden bg-[#f1f5f9]">
        <img
          src={
            article.image ||
            'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'
          }
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <span className="bg-white/95 text-[#b91c1c] text-[10px] font-bold px-2 py-0.5 rounded border border-[#e2e8f0] uppercase tracking-wider shadow-xs">
            {article.category}
          </span>
        </div>
      </div>

      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-sm md:text-[14px] font-bold text-[#0f172a] group-hover:text-[#b91c1c] transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>
          <p className="text-xs text-[#64748b] mt-1.5 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] text-[#64748b]">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <UserPen className="w-3 h-3 text-[#b91c1c] shrink-0" />
            <span className="truncate font-medium">{article.author}</span>
            <span className="mx-1 text-[#cbd5e1]">•</span>
            <span className="shrink-0">{article.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[#64748b] mr-1">
              <Eye className="w-3 h-3" />
              <span>{article.views || 0}</span>
            </span>

            {/* Admin Action Buttons */}
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e);
                }}
                className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 p-1 px-1.5 rounded transition-colors flex items-center gap-1 font-bold text-[10px]"
                title="Chỉnh sửa bài viết"
              >
                <Edit3 className="w-3 h-3" />
                <span className="hidden sm:inline">Sửa</span>
              </button>
            )}

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e);
                }}
                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1 px-1.5 rounded transition-colors flex items-center gap-1 font-bold text-[10px]"
                title="Gỡ bỏ bài viết"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
