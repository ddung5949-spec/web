import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Maximize2,
  Pause,
  Play,
  Quote,
  Settings2,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { UncleHoQuote, UncleHoSettings, User } from '../types';
import { UncleHoSkeleton } from './SkeletonLoader';
import { getSupabase } from '../utils/supabase';

interface UncleHoDailySectionProps {
  quotes: UncleHoQuote[];
  settings?: UncleHoSettings;
  currentUser: User | null;
  isLoading?: boolean;
  onOpenManager: () => void;
  onSaveQuotes?: (quotes: UncleHoQuote[]) => void;
  onSaveSettings?: (settings: UncleHoSettings) => void;
  onSelectDay?: (quote: UncleHoQuote) => void;
  layout?: 'vertical' | 'horizontal';
}

export const UncleHoDailySection: React.FC<UncleHoDailySectionProps> = ({
  quotes = [],
  settings = {
    autoSelectToday: true,
    bannerTitle: 'LỜI BÁC DẠY NGÀY NÀY NĂM XƯA',
    showQuoteOfTheDay: true,
    autoPostEnabled: true,
    dailyPostTime: '06:00',
    images: [],
  },
  currentUser,
  isLoading = false,
  onOpenManager,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Lấy ngày hiện tại định dạng DD/MM
  const now = new Date();
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayStr = `${todayDay}/${todayMonth}`;

  // Ngày đang được chọn
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

  // State Slideshow cố định (Album ảnh Bác Hồ)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [fetchedAlbumImages, setFetchedAlbumImages] = useState<string[]>([]);

  // Tải trực tiếp ảnh Bác Hồ từ Supabase bảng 'daily_posters' (id: 'uncle_ho') để luôn đồng bộ cho mọi người dùng
  useEffect(() => {
    let isMounted = true;
    const fetchUncleHoFromSupabase = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data, error } = await supabase.from('daily_posters').select('*').eq('id', 'uncle_ho').maybeSingle();
        if (error) {
          console.warn('[UncleHoDailySection] Notice fetching uncle_ho:', error.message);
        }
        if (data) {
          const imgs: string[] = [];
          if (data.extra_data?.images && Array.isArray(data.extra_data.images)) {
            imgs.push(...data.extra_data.images.filter((img: string) => img && !img.includes('unsplash.com')));
          } else if (data.image_data && !data.image_data.includes('unsplash.com')) {
            imgs.push(data.image_data);
          }
          if (imgs.length > 0 && isMounted) {
            setFetchedAlbumImages(imgs);
          }
        }
      } catch (err) {
        console.warn('Error fetching uncle_ho images from Supabase:', err);
      }
    };
    fetchUncleHoFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // State xem nhanh Bối cảnh lịch sử & Bài học vận dụng
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Lấy Album ảnh Slideshow (cố định xuyên suốt mọi ngày)
  const albumImages: string[] = useMemo(() => {
    // 1. Kiểm tra trong settings
    if (settings?.images && Array.isArray(settings.images) && settings.images.length > 0) {
      const filtered = settings.images.filter((img) => img && !img.includes('unsplash.com'));
      if (filtered.length > 0) return filtered;
    }

    // 2. Kiểm tra ảnh vừa nạp từ Supabase
    if (fetchedAlbumImages.length > 0) {
      return fetchedAlbumImages;
    }

    // 3. Kiểm tra cache localStorage
    try {
      const cached = localStorage.getItem('uncle_ho_images') || localStorage.getItem('mangyang_uncle_ho_images');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((img: string) => img && !img.includes('unsplash.com'));
          if (filtered.length > 0) return filtered;
        }
      }

      const dailyCache = localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
      if (dailyCache) {
        const parsed = JSON.parse(dailyCache);
        if (parsed?.uncle_ho?.extra_data?.images && Array.isArray(parsed.uncle_ho.extra_data.images)) {
          const imgs = parsed.uncle_ho.extra_data.images.filter((img: string) => img && !img.includes('unsplash.com'));
          if (imgs.length > 0) return imgs;
        }
        if (parsed?.uncle_ho?.image_data) {
          return [parsed.uncle_ho.image_data];
        }
      }
    } catch {
      // ignore
    }

    return [];
  }, [settings?.images, fetchedAlbumImages]);

  // Autoplay Slideshow 4s/lần
  useEffect(() => {
    if (!isPlaying || albumImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % albumImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying, albumImages.length]);

  // Quote hiện tại theo ngày được chọn
  const currentQuote: UncleHoQuote = useMemo(() => {
    const matched = quotes.find((q) => q.dayMonth === selectedDayStr);
    if (matched) return matched;

    // Fallback nếu chưa có dữ liệu cho ngày này
    return {
      id: `default-${selectedDayStr}`,
      dayMonth: selectedDayStr,
      yearRecorded: '1945',
      quote: 'Dân ta xin nhớ chữ đồng: Đồng tình, đồng sức, đồng lòng, đồng minh.',
      context:
        'Chủ tịch Hồ Chí Minh kêu gọi toàn thể đồng bào, cán bộ và chiến sĩ cả nước phát huy cao độ tinh thần đại đoàn kết toàn dân tộc.',
      lesson:
        'Cán bộ, chiến sĩ Trung đoàn 95, Sư đoàn 2 luôn nêu cao tinh thần đoàn kết nội bộ, đoàn kết quân dân, hiệp đồng chặt chẽ, quyết tâm hoàn thành xuất sắc mọi nhiệm vụ.',
      images: [],
      publishTime: '06:00',
      status: 'active',
      isAutoPublish: true,
    };
  }, [quotes, selectedDayStr]);

  // Chuyển slide tiếp theo / trước đó
  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (albumImages.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev - 1 + albumImages.length) % albumImages.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (albumImages.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev + 1) % albumImages.length);
  };

  // Danh sách các ngày có sẵn trong CSDL
  const availableDates = useMemo(() => {
    const dates = quotes.map((q) => q.dayMonth).filter(Boolean);
    if (!dates.includes(todayStr)) dates.unshift(todayStr);
    return Array.from(new Set(dates));
  }, [quotes, todayStr]);

  return (
    <div
      id="uncle-ho-daily-section"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFFDF5] via-[#FFFBF0] to-[#FFF7E6] text-gray-900 shadow-md border-2 border-amber-400/80 flex flex-col justify-between transition-opacity duration-300 ${isLoading ? 'opacity-85' : 'opacity-100'}`}
    >
      {/* 1. Header Trang trọng */}
      <div className="bg-red-800 text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs border-b border-amber-400/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-300/40 flex items-center justify-center shrink-0 shadow-inner">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs sm:text-[14px] font-black uppercase tracking-wide text-yellow-400 leading-none">
              {settings?.bannerTitle || 'LỜI BÁC DẠY NGÀY NÀY NĂM XƯA'}
            </h2>
            <p className="text-xs sm:text-sm text-yellow-100 font-medium tracking-tight mt-1 leading-snug">
              Học tập, thực hành tư tưởng, đạo đức, phương pháp, phong cách Hồ Chí Minh trong giai đoạn phát triển mới
            </p>
          </div>
        </div>

        {/* Nút Admin Quản lý */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenManager}
            className="flex items-center gap-1 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-200 hover:text-yellow-100 text-[11px] font-bold px-2 py-1 rounded-md border border-yellow-300/40 transition-all cursor-pointer shadow-xs shrink-0 ml-2"
            title="Quản lý Album ảnh và Nội dung Lời Bác dạy"
          >
            <Settings2 className="w-3 h-3" />
            <span>Quản lý</span>
          </button>
        )}
      </div>

      {/* 2. KHUNG ẢNH SLIDESHOW (CỐ ĐỊNH XUYÊN SUỐT TẤT CẢ CÁC NGÀY) */}
      <div className="p-3 pb-2">
        <div
          className="relative w-full h-48 sm:h-52 md:h-56 rounded-xl overflow-hidden shadow-inner border border-amber-300/70 bg-gradient-to-br from-red-950 via-stone-900 to-neutral-950 group select-none"
          onMouseEnter={() => setIsPlaying(false)}
          onMouseLeave={() => setIsPlaying(true)}
        >
          {albumImages.length > 0 ? (
            /* Có ảnh trong Album Slideshow */
            <>
              <img
                src={albumImages[currentSlideIndex % albumImages.length]}
                alt={`Chân dung Bác Hồ - Ảnh ${currentSlideIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-700 cursor-pointer hover:scale-102"
                onClick={() => setLightboxImage(albumImages[currentSlideIndex % albumImages.length])}
              />

              {/* Lớp phủ gradient viền dưới */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Nút mũi tên chuyển slide */}
              {albumImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Ảnh trước"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-red-800/80 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 border border-white/30 cursor-pointer shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Ảnh tiếp theo"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-red-800/80 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 border border-white/30 cursor-pointer shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Điều khiển phía dưới: Chấm tròn & Nút xem to & Tạm dừng */}
              <div className="absolute bottom-2 left-0 right-0 px-3 flex items-center justify-between text-white text-[10px]">
                {/* Chấm tròn chỉ số slide */}
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
                  {albumImages.map((_, idx) => (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentSlideIndex % albumImages.length
                          ? 'w-4 bg-amber-400'
                          : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                      title={`Xem ảnh ${idx + 1}`}
                    />
                  ))}
                  <span className="text-[9px] font-bold text-amber-300 ml-1">
                    {currentSlideIndex + 1}/{albumImages.length}
                  </span>
                </div>

                {/* Nút thao tác nhanh (Phóng to / Dừng) */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1 bg-black/60 hover:bg-black/80 rounded-full border border-white/20 text-amber-200 transition-colors cursor-pointer"
                    title={isPlaying ? 'Tạm dừng tự động chuyển ảnh' : 'Bật tự động chuyển ảnh'}
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxImage(albumImages[currentSlideIndex % albumImages.length])}
                    className="p-1 bg-black/60 hover:bg-black/80 rounded-full border border-white/20 text-white transition-colors cursor-pointer"
                    title="Xem ảnh phóng to"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Chưa có ảnh tải lên: Hiển thị Khung Chân Dung Trang Trọng Chuẩn Tôn Kính */
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-red-950 via-stone-900 to-red-950 text-amber-100 relative">
              {/* Trang trí hoa văn nền */}
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border-2 border-amber-300/40 flex items-center justify-center mb-2 shadow-lg relative">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-md" />
                <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping opacity-30" />
              </div>
              <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                CHỦ TỊCH HỒ CHÍ MINH
              </h3>
              <p className="text-[11px] text-amber-200/80 font-medium italic mt-0.5">
                (1890 - 1969)
              </p>
              <p className="text-[10px] text-amber-100/60 mt-1 max-w-[240px]">
                Anh hùng giải phóng dân tộc, Danh nhân văn hóa thế giới
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenManager}
                  className="mt-2 text-[10px] font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2.5 py-1 rounded-full border border-amber-300/40 cursor-pointer transition-all"
                >
                  + Tải Album ảnh chân dung Bác
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. BỘ CHỌN NGÀY & ĐIỀU HƯỚNG */}
      <div className="px-3 py-1.5 flex items-center justify-between bg-amber-100/60 border-y border-amber-300/60 text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-red-800" />
          <span className="font-bold text-red-950 text-[11px]">
            Ngày {currentQuote.dayMonth}
            {currentQuote.yearRecorded ? ` • Năm ${currentQuote.yearRecorded}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút chọn nhanh Hôm nay */}
          {selectedDayStr !== todayStr && (
            <button
              type="button"
              onClick={() => setSelectedDayStr(todayStr)}
              className="text-[10px] font-bold bg-red-800 hover:bg-red-900 text-amber-200 px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-xs"
            >
              Hôm nay ({todayStr})
            </button>
          )}

          {/* Nút mở danh sách chọn ngày */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="text-[10px] font-bold bg-white hover:bg-amber-50 text-gray-800 px-2 py-0.5 rounded-md border border-amber-300 cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>Chọn ngày</span>
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </button>

            {/* Dropdown danh sách ngày có sẵn */}
            {isDatePickerOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-amber-300 z-30 p-1.5 max-h-48 overflow-y-auto">
                <p className="text-[10px] font-bold text-gray-500 px-2 py-1 border-b border-gray-100">
                  Chọn ngày xem Lời Bác dạy:
                </p>
                {availableDates.map((dateStr) => (
                  <button
                    key={`opt-date-${dateStr}`}
                    type="button"
                    onClick={() => {
                      setSelectedDayStr(dateStr);
                      setIsDatePickerOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      dateStr === selectedDayStr
                        ? 'bg-red-800 text-amber-200'
                        : 'text-gray-700 hover:bg-amber-100/60'
                    }`}
                  >
                    <span>Ngày {dateStr}</span>
                    {dateStr === todayStr && (
                      <span className="text-[9px] px-1 rounded bg-amber-400 text-red-900 font-bold">
                        Hôm nay
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PHẦN NỘI DUNG LỜI BÁC DẠY NỔI BẬT (KHUNG VÀNG ĐỎ TRANG TRỌNG) */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="relative bg-gradient-to-br from-amber-50 via-white to-amber-100/50 rounded-xl p-3 sm:p-4 border-2 border-amber-300/80 shadow-xs">
          {/* Biểu tượng dấu ngoặc kép vàng */}
          <div className="absolute -top-3 left-3 bg-red-900 text-amber-300 rounded-full p-1 border border-amber-300 shadow-xs">
            <Quote className="w-3.5 h-3.5" />
          </div>

          {/* Nội dung câu nói của Bác */}
          <div className="pt-1">
            <p className="text-xs sm:text-[13px] font-bold text-red-950 leading-relaxed italic text-justify select-text">
              &ldquo;{currentQuote.quote}&rdquo;
            </p>
          </div>
        </div>

        {/* 5. NÚT XEM NHANH BỐI CẢNH LỊCH SỬ & BÀI HỌC VẬN DỤNG */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsDetailsModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-red-800 hover:bg-red-900 text-yellow-300 hover:text-yellow-200 text-xs sm:text-sm font-bold py-2 px-3 rounded-lg border border-yellow-400 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
            <span>Xem Bối cảnh lịch sử & Bài học vận dụng</span>
          </button>
        </div>
      </div>

      {/* MODAL CHI TIẾT: BỐI CẢNH LỊCH SỬ & BÀI HỌC VẬN DỤNG */}
      {isDetailsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsDetailsModalOpen(false)}
        >
          <div
            className="bg-gradient-to-b from-[#FFFDF5] to-[#FFF7E6] text-gray-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-amber-400 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-red-850 via-red-900 to-red-950 text-white px-4 py-3 flex items-center justify-between border-b border-amber-400">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <h3 className="text-sm font-black uppercase text-amber-300">
                  LỜI BÁC DẠY NGÀY {currentQuote.dayMonth}
                  {currentQuote.yearRecorded ? ` (NĂM ${currentQuote.yearRecorded})` : ''}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung chi tiết */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Lời Bác dạy */}
              <div className="bg-white rounded-xl p-3.5 border-l-4 border-red-800 shadow-xs">
                <h4 className="text-xs font-black uppercase text-red-900 flex items-center gap-1.5 mb-1.5">
                  <Quote className="w-3.5 h-3.5 text-red-800" />
                  <span>Lời Bác dạy cốt lõi:</span>
                </h4>
                <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-relaxed italic select-text">
                  &ldquo;{currentQuote.quote}&rdquo;
                </p>
              </div>

              {/* Hoàn cảnh lịch sử */}
              {currentQuote.context && (
                <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-300/80 shadow-2xs">
                  <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5 mb-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    <span>Hoàn cảnh lịch sử & Nguồn tư liệu:</span>
                  </h4>
                  <p className="text-xs text-gray-800 leading-relaxed select-text">
                    {currentQuote.context}
                  </p>
                </div>
              )}

              {/* Ý nghĩa & Bài học vận dụng */}
              <div className="bg-emerald-50/80 rounded-xl p-3.5 border border-emerald-300/80 shadow-2xs">
                <h4 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ý nghĩa & Bài học đối với cán bộ, chiến sĩ Trung đoàn 95, Sư đoàn 2:</span>
                </h4>
                <p className="text-xs text-emerald-950 leading-relaxed font-medium select-text">
                  {currentQuote.lesson ||
                    'Cán bộ, chiến sĩ Trung đoàn 95 luôn nêu cao tinh thần đoàn kết, khắc ghi lời Bác dạy, quyết tâm xây dựng đơn vị vững mạnh toàn diện "Mẫu mực, tiêu biểu", hoàn thành xuất sắc mọi nhiệm vụ.'}
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-2.5 bg-amber-100/60 border-t border-amber-300/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-red-850 hover:bg-red-900 text-amber-200 text-xs font-bold px-4 py-1.5 rounded-lg border border-amber-400 cursor-pointer shadow-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PHÓNG TO ẢNH SLIDESHOW */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-300 transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Chân dung Bác Hồ phóng to"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border-2 border-amber-400"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-amber-200 text-xs font-bold mt-2 text-center">
              Chủ tịch Hồ Chí Minh vĩ đại sống mãi trong sự nghiệp của chúng ta
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default UncleHoDailySection;
