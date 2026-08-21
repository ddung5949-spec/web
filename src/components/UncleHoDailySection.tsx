import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
  Maximize2,
  Quote,
  Save,
  Settings2,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { UncleHoQuote, UncleHoSettings, User } from '../types';

interface UncleHoDailySectionProps {
  quotes: UncleHoQuote[];
  settings: UncleHoSettings;
  currentUser: User | null;
  onOpenManager: () => void;
  onSaveQuotes?: (quotes: UncleHoQuote[]) => void;
  onSelectDay?: (quote: UncleHoQuote) => void;
  layout?: 'vertical' | 'horizontal';
}

export const UncleHoDailySection: React.FC<UncleHoDailySectionProps> = ({
  quotes,
  settings,
  currentUser,
  onOpenManager,
  onSaveQuotes,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Get current date string DD/MM
  const now = new Date();
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayStr = `${todayDay}/${todayMonth}`;

  // Determine which quote to show
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    if (settings.autoSelectToday) {
      const matchToday = quotes.find((q) => q.dayMonth === todayStr);
      if (matchToday) return todayStr;
    }
    if (settings.activeQuoteId) {
      const matchActive = quotes.find((q) => q.id === settings.activeQuoteId);
      if (matchActive) return matchActive.dayMonth;
    }
    return quotes[0]?.dayMonth || todayStr;
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Quick edit modal state for admin
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editQuoteText, setEditQuoteText] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editYear, setEditYear] = useState('');

  // Find active quote
  const currentQuote: UncleHoQuote =
    quotes.find((q) => q.dayMonth === selectedDayStr) ||
    quotes[0] || {
      id: 'default',
      dayMonth: todayStr,
      yearRecorded: '1945',
      quote: 'Dân ta xin nhớ chữ đồng: Đồng tình, đồng sức, đồng lòng, đồng minh.',
      context: 'Chủ tịch Hồ Chí Minh kêu gọi toàn dân đoàn kết đấu tranh vì độc lập dân tộc.',
      lesson: 'Cán bộ, chiến sĩ Sư đoàn 10 luôn nêu cao tinh thần đoàn kết nội bộ, đoàn kết quân dân.',
      images: [
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop',
      ],
      publishTime: '06:00',
      status: 'active',
      isAutoPublish: true,
    };

  // Open Quick Edit
  const handleOpenQuickEdit = () => {
    setEditQuoteText(currentQuote.quote);
    setEditImageUrl(currentQuote.images?.[0] || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop');
    setEditYear(currentQuote.yearRecorded || '1945');
    setIsQuickEditOpen(true);
  };

  // Save Quick Edit
  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuoteText.trim()) {
      alert('Vui lòng nhập nội dung khẩu hiệu / Lời dạy của Bác.');
      return;
    }

    const updatedQuote: UncleHoQuote = {
      ...currentQuote,
      quote: editQuoteText.trim(),
      yearRecorded: editYear.trim() || undefined,
      images: editImageUrl.trim() ? [editImageUrl.trim()] : currentQuote.images,
    };

    let updatedList = [...quotes];
    const idx = updatedList.findIndex((q) => q.dayMonth === currentQuote.dayMonth);
    if (idx >= 0) {
      updatedList[idx] = updatedQuote;
    } else {
      updatedList.push(updatedQuote);
    }

    if (onSaveQuotes) {
      onSaveQuotes(updatedList);
    }
    setIsQuickEditOpen(false);
  };

  // Navigate quotes
  const currentIndex = quotes.findIndex((q) => q.dayMonth === selectedDayStr);
  const handlePrevDay = () => {
    if (currentIndex > 0) {
      setSelectedDayStr(quotes[currentIndex - 1].dayMonth);
    } else if (quotes.length > 0) {
      setSelectedDayStr(quotes[quotes.length - 1].dayMonth);
    }
  };

  const handleNextDay = () => {
    if (currentIndex < quotes.length - 1) {
      setSelectedDayStr(quotes[currentIndex + 1].dayMonth);
    } else if (quotes.length > 0) {
      setSelectedDayStr(quotes[0].dayMonth);
    }
  };

  const currentImage =
    currentQuote.images && currentQuote.images.length > 0
      ? currentQuote.images[0]
      : 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-b from-[#3a0808] via-[#2d0505] to-[#1e0303] text-white shadow-md border border-amber-500/40 p-3 sm:p-3.5 flex flex-col justify-between transition-all h-full min-h-[340px]">
      {/* Subtle decorative glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-red-600/15 rounded-full blur-2xl pointer-events-none -ml-8 -mb-8" />

      {/* 1. Header Bar: Title + Date Selector + Admin Edit */}
      <div className="relative z-10 space-y-2 pb-2 mb-2 border-b border-amber-400/25">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-linear-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xs flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-red-950 flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
              </div>
            </div>
            <h2 className="text-xs font-black tracking-wide uppercase text-amber-300 drop-shadow-xs truncate">
              LỜI BÁC DẠY NGÀY NÀY NĂM XƯA
            </h2>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleOpenQuickEdit}
                className="bg-amber-400 hover:bg-amber-300 text-red-950 text-[10px] font-black px-2 py-0.5 rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                title="Sửa nhanh hình ảnh & khẩu hiệu Lời Bác dạy"
              >
                <Edit3 className="w-2.5 h-2.5 text-red-950" />
                <span>Sửa</span>
              </button>
              <button
                type="button"
                onClick={onOpenManager}
                className="bg-white/10 hover:bg-white/20 text-amber-200 text-[10px] font-bold p-1 rounded transition-colors cursor-pointer"
                title="Mở bảng Quản lý chi tiết"
              >
                <Settings2 className="w-3 h-3 text-amber-300" />
              </button>
            </div>
          )}
        </div>

        {/* Compact Date Navigator */}
        <div className="flex items-center justify-between gap-1 bg-black/45 border border-amber-400/25 rounded-lg px-1.5 py-0.5">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 text-amber-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Ngày trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="px-2 py-0.5 text-xs font-black text-amber-300 flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Ngày {currentQuote.dayMonth}</span>
            {currentQuote.dayMonth === todayStr && (
              <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded uppercase">
                Hôm nay
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 text-amber-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Ngày tiếp theo"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Content: 1 Image + 1 Slogan Quote Below */}
      <div className="relative z-10 space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Single Image Frame */}
        <div className="relative rounded-xl overflow-hidden border border-amber-400/40 shadow-md group aspect-16/10 bg-black/40">
          <img
            src={currentImage}
            alt={`Ảnh Bác Hồ ngày ${currentQuote.dayMonth}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />

          {/* Historical Year Badge */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-950/90 backdrop-blur-xs text-amber-300 border border-amber-400/40 text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            <span>
              {currentQuote.yearRecorded ? `Năm ${currentQuote.yearRecorded}` : 'Tư liệu lịch sử'}
            </span>
          </div>

          {/* Expand Image Button */}
          <button
            type="button"
            onClick={() => setPreviewImage(currentImage)}
            className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
            title="Phóng to ảnh"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          <div className="absolute bottom-1.5 left-2 right-2 text-[10px] text-amber-100/90 font-bold truncate">
            Chủ tịch Hồ Chí Minh
          </div>
        </div>

        {/* Single Slogan / Quote Box Below */}
        <div className="relative bg-black/40 backdrop-blur-xs border border-amber-400/30 rounded-xl p-2.5 space-y-1">
          <Quote className="w-4 h-4 text-amber-400/30 absolute top-1.5 left-1.5 -scale-x-100 pointer-events-none" />
          <div className="relative z-10 pl-2">
            <p className="text-xs font-bold text-amber-200 leading-snug italic font-serif tracking-wide text-center">
              “{currentQuote.quote}”
            </p>
          </div>
        </div>
      </div>

      {/* Admin Quick Edit Modal */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-300" />
                <h3 className="text-xs font-black uppercase text-white">
                  Sửa Lời Bác dạy (Ngày {currentQuote.dayMonth})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveQuickEdit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Khẩu hiệu / Lời dạy của Bác <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editQuoteText}
                  onChange={(e) => setEditQuoteText(e.target.value)}
                  placeholder="Nhập câu khẩu hiệu / lời dạy của Bác..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Link ảnh tư liệu Bác Hồ (1 hình)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden"
                  />
                  {editImageUrl && (
                    <img
                      src={editImageUrl}
                      alt="Xem trước"
                      className="w-9 h-9 rounded-lg object-cover border border-gray-300 shrink-0"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Năm ghi nhận lịch sử
                </label>
                <input
                  type="text"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  placeholder="Ví dụ: 1945, 1954, 1968..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-amber-500/40 shadow-2xl bg-black">
            <img
              src={previewImage}
              alt="Ảnh tư liệu Bác Hồ phóng to"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain max-h-[75vh]"
            />
            <div className="p-2.5 bg-red-950/90 text-center text-xs text-amber-200 font-bold border-t border-amber-500/30">
              Tư liệu Chủ tịch Hồ Chí Minh - Ngày {currentQuote.dayMonth} (Nhấp để đóng)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
