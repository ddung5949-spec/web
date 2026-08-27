import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Grid,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Pause,
  Play,
  Plus,
  Quote,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { UncleHoQuote, UncleHoSettings, User } from '../types';
import { compressImageFile, validateImageFile } from '../utils/imageUtils';
import { UncleHoSkeleton } from './SkeletonLoader';

interface UncleHoDailySectionProps {
  quotes: UncleHoQuote[];
  settings: UncleHoSettings;
  currentUser: User | null;
  isLoading?: boolean;
  onOpenManager: () => void;
  onSaveQuotes?: (quotes: UncleHoQuote[]) => void;
  onSelectDay?: (quote: UncleHoQuote) => void;
  layout?: 'vertical' | 'horizontal';
}

export const UncleHoDailySection: React.FC<UncleHoDailySectionProps> = ({
  quotes = [],
  settings = {
    autoSelectToday: true,
    bannerTitle: 'LỜI BÁC DẠY NGÀY NÀY NĂM XƯA',
    showQuoteOfTheDay: true,
  },
  currentUser,
  isLoading = false,
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
    if (settings?.autoSelectToday) {
      const matchToday = quotes?.find((q) => q.dayMonth === todayStr);
      if (matchToday) return todayStr;
    }
    if (settings?.activeQuoteId) {
      const matchActive = quotes?.find((q) => q.id === settings.activeQuoteId);
      if (matchActive) return matchActive.dayMonth;
    }
    return quotes?.[0]?.dayMonth || todayStr;
  });

  // Carousel and Display states
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Quick edit modal state for admin
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editQuoteText, setEditQuoteText] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editContext, setEditContext] = useState('');
  const [editLesson, setEditLesson] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find active quote
  const currentQuote: UncleHoQuote =
    quotes?.find((q) => q.dayMonth === selectedDayStr) ||
    quotes?.[0] || {
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

  const imagesList =
    currentQuote.images && currentQuote.images.length > 0
      ? currentQuote.images
      : ['https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'];

  // Reset image index when quote changes
  useEffect(() => {
    setCurrentImgIndex(0);
  }, [selectedDayStr]);

  // Auto-play slideshow timer
  useEffect(() => {
    if (!isAutoPlay || imagesList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % imagesList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlay, imagesList.length]);

  if (isLoading) {
    return <UncleHoSkeleton />;
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div
        id="uncle-ho-daily-section"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFFDF5] to-[#FFF8E7] text-gray-900 shadow-md border border-amber-400/70 p-4 flex flex-col justify-between h-full min-h-[350px]"
      >
        <div className="flex items-center justify-between pb-2 border-b border-amber-300/60">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-red-900 flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
            </div>
            <h2 className="text-xs font-black uppercase text-red-900">
              LỜI BÁC DẠY NGÀY NÀY NĂM XƯA
            </h2>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenManager}
              className="bg-amber-100 hover:bg-amber-200 text-red-900 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-300 cursor-pointer"
            >
              Quản lý
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
          <Quote className="w-8 h-8 text-amber-300 mb-2 opacity-60" />
          <p className="text-xs font-bold text-gray-700">Chưa có dữ liệu Lời Bác dạy</p>
          <p className="text-[11px] text-gray-400 mt-1">Dữ liệu đang được cập nhật từ hệ thống.</p>
        </div>
      </div>
    );
  }

  // Open Quick Edit
  const handleOpenQuickEdit = () => {
    setEditQuoteText(currentQuote.quote);
    setEditImages(
      currentQuote.images && currentQuote.images.length > 0
        ? [...currentQuote.images]
        : ['https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop']
    );
    setEditYear(currentQuote.yearRecorded || '1945');
    setEditContext(currentQuote.context || '');
    setEditLesson(currentQuote.lesson || '');
    setNewImageUrl('');
    setIsQuickEditOpen(true);
  };

  // Handle direct file upload for quick edit (multiple images allowed)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const newUrls: string[] = [];
      const fileList = Array.from(files) as File[];

      for (const file of fileList) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error || `Tệp ${file.name} không hợp lệ.`);
          continue;
        }
        const compressedDataUrl = await compressImageFile(file, 1280, 1280, 0.82);
        newUrls.push(compressedDataUrl);
      }

      if (newUrls.length > 0) {
        setEditImages((prev) => [...prev, ...newUrls]);
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể xử lý tệp ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Add image by URL
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setEditImages((prev) => [...prev, trimmed]);
    setNewImageUrl('');
  };

  // Remove single image in edit mode
  const handleRemoveEditImage = (idxToRemove: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== idxToRemove));
  };

  // Move image to first (make main)
  const handleSetMainImage = (idx: number) => {
    if (idx === 0) return;
    setEditImages((prev) => {
      const copy = [...prev];
      const target = copy.splice(idx, 1)[0];
      return [target, ...copy];
    });
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
      context: editContext.trim(),
      lesson: editLesson.trim(),
      images:
        editImages.length > 0
          ? editImages
          : ['https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'],
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

  // Navigate images in carousel
  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImgIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
  };

  const currentImage = imagesList[currentImgIndex] || imagesList[0];

  return (
    <div
      id="uncle-ho-daily-section"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFFDF5] via-[#FFFDF0] to-[#FFF8E7] text-gray-900 shadow-md border border-amber-400/70 ring-1 ring-amber-300/40 p-3.5 flex flex-col justify-between transition-all h-full min-h-[350px]"
    >
      {/* Decorative top corner gold filigree accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-200/40 via-amber-100/20 to-transparent pointer-events-none rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-100/30 via-amber-100/10 to-transparent pointer-events-none rounded-bl-2xl" />

      {/* 1. Header Bar: Title + Admin Controls */}
      <div className="relative z-10 space-y-2 pb-2 mb-2 border-b border-amber-300/60">
        <div className="flex items-center justify-between gap-1.5">
          {/* Header Title Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xs flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-red-900 flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
              </div>
            </div>
            <h2 className="text-xs font-black tracking-wide uppercase text-red-900 drop-shadow-xs truncate">
              LỜI BÁC DẠY NGÀY NÀY NĂM XƯA
            </h2>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                id="btn-quick-edit-uncle-ho"
                onClick={handleOpenQuickEdit}
                className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-amber-200 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs transition-all flex items-center gap-1 cursor-pointer border border-amber-400/50"
                title="Sửa nhanh hình ảnh & khẩu hiệu Lời Bác dạy"
              >
                <Edit3 className="w-2.5 h-2.5 text-amber-300" />
                <span>Sửa</span>
              </button>
              <button
                type="button"
                id="btn-manager-uncle-ho"
                onClick={onOpenManager}
                className="bg-amber-100/80 hover:bg-amber-200 text-red-900 text-[10px] font-bold p-1 rounded-md transition-colors cursor-pointer border border-amber-300/80 shadow-xs"
                title="Mở bảng Quản lý chi tiết"
              >
                <Settings2 className="w-3 h-3 text-red-900" />
              </button>
            </div>
          )}
        </div>

        {/* Compact Date Navigator with Gold Accent */}
        <div className="flex items-center justify-between gap-1 bg-white/90 border border-amber-300/80 rounded-lg px-1.5 py-0.5 shadow-xs">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 text-red-900 hover:text-red-700 hover:bg-amber-100/70 rounded transition-colors cursor-pointer"
            title="Ngày trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="px-2 py-0.5 text-xs font-black text-red-950 flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-red-700" />
            <span>Ngày {currentQuote.dayMonth}</span>
            {currentQuote.dayMonth === todayStr && (
              <span className="bg-red-700 text-white text-[8px] font-black px-1.5 py-0.2 rounded uppercase shadow-xs">
                Hôm nay
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 text-red-900 hover:text-red-700 hover:bg-amber-100/70 rounded transition-colors cursor-pointer"
            title="Ngày tiếp theo"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Content Area: Multi-Image Carousel / Grid + Quote */}
      <div className="relative z-10 space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Multi-Image Frame Container */}
        {viewMode === 'carousel' ? (
          <div className="relative rounded-xl overflow-hidden border border-amber-400/80 shadow-sm group aspect-16/10 bg-black/80">
            <img
              src={currentImage}
              alt={`Ảnh Bác Hồ ngày ${currentQuote.dayMonth} - Ảnh ${currentImgIndex + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            {/* Historical Year Badge */}
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-950/90 backdrop-blur-xs text-amber-300 border border-amber-400/60 text-[9px] font-black px-2 py-0.5 rounded shadow-xs">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>
                {currentQuote.yearRecorded ? `Năm ${currentQuote.yearRecorded}` : 'Tư liệu lịch sử'}
              </span>
            </div>

            {/* Top Right Action Tools: Auto-play, Grid toggle, Maximize */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
              {imagesList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAutoPlay((prev) => !prev)}
                    className={`p-1 rounded text-white transition-all shadow-xs cursor-pointer ${
                      isAutoPlay ? 'bg-amber-500 text-red-950' : 'bg-black/60 hover:bg-black/80'
                    }`}
                    title={isAutoPlay ? 'Tạm dừng trình chiếu tự động' : 'Tự động trình chiếu ảnh'}
                  >
                    {isAutoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className="p-1 bg-black/60 hover:bg-black/80 text-white rounded transition-all shadow-xs cursor-pointer"
                    title="Xem dạng lưới ảnh"
                  >
                    <Grid className="w-3 h-3" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setPreviewImage(currentImage)}
                className="p-1 bg-black/60 hover:bg-black/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                title="Phóng to ảnh"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            {/* Previous / Next Arrow Overlays (Shown if multiple images) */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-red-800 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                  title="Ảnh trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-red-800 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                  title="Ảnh tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Bottom Info: Title & Multi-image indicator dots / counter */}
            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between gap-1 text-white">
              <div className="text-[10px] text-amber-200 font-bold drop-shadow-xs truncate">
                Chủ tịch Hồ Chí Minh
              </div>
              {imagesList.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Dots Indicator */}
                  <div className="flex items-center gap-1">
                    {imagesList.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImgIndex(i);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          i === currentImgIndex
                            ? 'w-3.5 bg-amber-400'
                            : 'w-1.5 bg-white/50 hover:bg-white/80'
                        }`}
                        title={`Xem ảnh ${i + 1}`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] bg-red-950/80 border border-amber-400/40 text-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                    {currentImgIndex + 1}/{imagesList.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Multi-Image Grid View Mode */
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-red-950 font-bold px-1">
              <span>{imagesList.length} ảnh tư liệu lịch sử</span>
              <button
                type="button"
                onClick={() => setViewMode('carousel')}
                className="text-red-700 hover:text-red-900 underline flex items-center gap-1 cursor-pointer"
              >
                <Layers className="w-3 h-3" />
                <span>Trình chiếu</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 rounded-xl bg-white/70 border border-amber-300">
              {imagesList.map((url, i) => (
                <div
                  key={i}
                  onClick={() => setPreviewImage(url)}
                  className="relative aspect-4/3 rounded-lg overflow-hidden border border-amber-300/80 shadow-xs cursor-pointer group hover:ring-2 hover:ring-red-600 transition-all"
                >
                  <img
                    src={url}
                    alt={`Tư liệu ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/70 text-amber-300 text-[8px] font-bold px-1 rounded">
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Elegant Quote / Slogan Container */}
        <div className="relative bg-amber-50/95 border border-amber-300/80 rounded-xl p-3 shadow-xs space-y-1.5">
          <Quote className="w-4 h-4 text-amber-500/40 absolute top-2 left-2 -scale-x-100 pointer-events-none" />
          <div className="relative z-10 px-2">
            <p className="text-xs sm:text-[13px] font-bold text-red-950 leading-relaxed italic font-sans tracking-wide text-center">
              “{currentQuote.quote}”
            </p>
          </div>

          {/* Context and lesson expandable toggle */}
          {(currentQuote.context || currentQuote.lesson) && (
            <div className="pt-1 border-t border-amber-200/80 text-center">
              <button
                type="button"
                onClick={() => setShowFullDetails((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 hover:text-red-950 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3 h-3 text-amber-700" />
                <span>
                  {showFullDetails ? 'Thu gọn bối cảnh' : 'Xem bối cảnh & bài học vận dụng'}
                </span>
              </button>

              {showFullDetails && (
                <div className="mt-2 text-left space-y-1.5 p-2 bg-white/90 rounded-lg border border-amber-200 text-[11px] text-gray-800 animate-in fade-in duration-200">
                  {currentQuote.context && (
                    <div>
                      <strong className="text-red-900 block font-semibold">Bối cảnh lịch sử:</strong>
                      <p className="leading-snug text-gray-700">{currentQuote.context}</p>
                    </div>
                  )}
                  {currentQuote.lesson && (
                    <div>
                      <strong className="text-red-900 block font-semibold">Bài học vận dụng:</strong>
                      <p className="leading-snug text-gray-700">{currentQuote.lesson}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Quick Edit Modal (Multi-Image Support & Responsive UI) */}
      {isQuickEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-amber-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-950 via-red-900 to-amber-950 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-300" />
                <h3 className="text-xs sm:text-sm font-black uppercase text-white">
                  Sửa Lời Bác dạy & Tư liệu ảnh (Ngày {currentQuote.dayMonth})
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

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveQuickEdit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Slogan / Quote Field */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Khẩu hiệu / Lời dạy của Bác <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editQuoteText}
                  onChange={(e) => setEditQuoteText(e.target.value)}
                  placeholder="Nhập câu khẩu hiệu / lời dạy của Bác..."
                  className="w-full px-3 py-2 bg-amber-50/40 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden resize-none"
                />
              </div>

              {/* Multi-Image Management Section */}
              <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-red-700" />
                    <span>Danh sách ảnh tư liệu Bác Hồ ({editImages.length} ảnh)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${isUploadingImage ? 'animate-spin' : ''}`} />
                    <span>Tải ảnh từ máy</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {/* Upload by URL Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Hoặc dán URL ảnh tư liệu trực tiếp..."
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Thêm URL
                  </button>
                </div>

                {/* Thumbnail Grid of Managed Images */}
                {editImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto">
                    {editImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg border border-gray-300 overflow-hidden bg-black group aspect-4/3"
                      >
                        <img
                          src={imgUrl}
                          alt={`Tư liệu ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-red-950 text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs">
                            Ảnh chính
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(idx)}
                              className="p-1 bg-amber-400 hover:bg-amber-300 text-red-950 text-[9px] font-bold rounded cursor-pointer"
                              title="Đặt làm ảnh đầu tiên"
                            >
                              Đặt chính
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveEditImage(idx)}
                            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-red-600 hover:bg-red-50/50 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <UploadCloud className="w-6 h-6 text-red-700" />
                    <span className="text-xs font-bold text-gray-800">
                      Chưa có hình ảnh nào. Nhấp để tải ảnh lên từ máy tính
                    </span>
                    <span className="text-[10px] text-gray-500">Hỗ trợ PNG, JPG, JPEG, WEBP</span>
                  </div>
                )}
              </div>

              {/* Year Recorded */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Năm ghi nhận lịch sử
                </label>
                <input
                  type="text"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  placeholder="Ví dụ: 1945, 1950, 1954, 1968..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              {/* Historical Context */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Bối cảnh lịch sử
                </label>
                <textarea
                  rows={2}
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                  placeholder="Bối cảnh Bác Hồ nói câu khẩu hiệu này..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden resize-none"
                />
              </div>

              {/* Lesson for Soldiers */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Bài học vận dụng cho cán bộ, chiến sĩ
                </label>
                <textarea
                  rows={2}
                  value={editLesson}
                  onChange={(e) => setEditLesson(e.target.value)}
                  placeholder="Bài học vận dụng trong huấn luyện, rèn luyện..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal with Slider Navigation */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-amber-500/50 shadow-2xl bg-black flex flex-col"
          >
            <div className="relative flex-1 flex items-center justify-center bg-black">
              <img
                src={previewImage}
                alt="Ảnh tư liệu Bác Hồ phóng to"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain max-h-[75vh]"
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-red-950 text-center text-xs text-amber-200 font-bold border-t border-amber-500/30 flex items-center justify-between px-4">
              <span>Tư liệu Chủ tịch Hồ Chí Minh - Ngày {currentQuote.dayMonth}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-white hover:text-amber-300 text-xs underline cursor-pointer"
              >
                Đóng [X]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
