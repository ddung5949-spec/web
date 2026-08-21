import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Filter,
  Flag,
  Search,
  Sparkles,
  Star,
  UserPen,
  X,
} from 'lucide-react';
import { Article } from '../../types';

interface SpotlightArticleSelectModalProps {
  articles: Article[];
  currentSpotlightId?: number;
  currentSpotlightIds?: number[];
  onSelect: (primaryId: number, selectedIds?: number[]) => void;
  onClose: () => void;
}

export const SpotlightArticleSelectModal: React.FC<
  SpotlightArticleSelectModalProps
> = ({
  articles,
  currentSpotlightId,
  currentSpotlightIds = [],
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [primaryId, setPrimaryId] = useState<number>(
    currentSpotlightId || articles[0]?.id || 1
  );

  const categories = ['all', 'CTĐ - CTCT', 'Huấn luyện - SSCĐ', 'Học tập theo Bác', 'Thông tin nội bộ'];

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' || art.category.includes(selectedCategory);
    return matchesSearch && matchesCat;
  });

  const handleApply = () => {
    onSelect(primaryId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide text-white">
                Chọn bài đăng tiêu biểu ở trang chủ
              </h3>
              <p className="text-[11px] text-amber-200/80">
                Lựa chọn bài viết hiển thị nổi bật với hình ảnh lớn và trích đoạn tóm tắt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter bar */}
        <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết theo tiêu đề, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-red-700 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* List of articles */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5 bg-gray-50/40">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((art) => {
              const isPrimary = primaryId === art.id;

              return (
                <div
                  key={art.id}
                  onClick={() => setPrimaryId(art.id)}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    isPrimary
                      ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/60 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 shadow-2xs'
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative">
                    <img
                      src={art.image}
                      alt={art.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {isPrimary && (
                      <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center text-amber-300 font-bold text-[10px]">
                        <Star className="w-4 h-4 fill-amber-300" />
                      </div>
                    )}
                  </div>

                  {/* Article Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-red-50 text-red-700 font-bold px-1.5 py-0.2 rounded border border-red-100">
                        {art.category}
                      </span>
                      <span className="text-[10px] text-gray-400">• {art.date}</span>
                    </div>

                    <h4
                      className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${
                        isPrimary ? 'text-red-950 font-black' : 'text-gray-900 group-hover:text-red-700'
                      }`}
                    >
                      {art.title}
                    </h4>

                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {art.excerpt}
                    </p>
                  </div>

                  {/* Radio / Selection Indicator */}
                  <div className="shrink-0 flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isPrimary
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-gray-300 group-hover:border-amber-400'
                      }`}
                    >
                      {isPrimary && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 italic">
              Không tìm thấy bài viết nào phù hợp.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-gray-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Áp dụng bài tiêu biểu này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
