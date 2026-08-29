import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Edit3,
  Image as ImageIcon,
  Info,
  Plus,
  Quote,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { UncleHoQuote, UncleHoSettings } from '../../types';
import { compressImageFile, validateImageFile } from '../../utils/imageUtils';
import { getSupabase } from '../../utils/supabase';

interface UncleHoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: UncleHoQuote[];
  settings: UncleHoSettings;
  onSaveQuotes: (quotes: UncleHoQuote[]) => void;
  onSaveSettings: (settings: UncleHoSettings) => void;
}

export const UncleHoManagerModal: React.FC<UncleHoManagerModalProps> = ({
  isOpen,
  onClose,
  quotes = [],
  settings = {
    autoPostEnabled: true,
    dailyPostTime: '06:00',
    autoSelectToday: true,
    activeQuoteId: '',
    images: [],
    bannerTitle: 'LỜI BÁC DẠY NGÀY NÀY NĂM XƯA',
    showQuoteOfTheDay: true,
  },
  onSaveQuotes,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'album' | 'quotes'>('album');

  // Album ảnh Slideshow state
  const [slideshowImages, setSlideshowImages] = useState<string[]>(() => {
    if (settings?.images && Array.isArray(settings.images) && settings.images.length > 0) {
      return settings.images.filter((img) => img && !img.includes('unsplash.com'));
    }
    try {
      const cached = localStorage.getItem('uncle_ho_images') || localStorage.getItem('mangyang_uncle_ho_images');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((img: string) => img && !img.includes('unsplash.com'));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Quản lý Nội dung theo ngày
  const [quotesList, setQuotesList] = useState<UncleHoQuote[]>(quotes);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [selectedDayMonth, setSelectedDayMonth] = useState('28/08');
  const [formYear, setFormYear] = useState('1945');
  const [formQuote, setFormQuote] = useState('');
  const [formContext, setFormContext] = useState('');
  const [formLesson, setFormLesson] = useState('');
  const [searchQuoteQuery, setSearchQuoteQuery] = useState('');

  if (!isOpen) return null;

  // Xử lý upload ảnh từ máy tính/điện thoại cho Album Slideshow
  const handleUploadSlideshowImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingImages(true);
      const fileList: File[] = Array.from(files);
      const newUrls: string[] = [];

      for (const file of fileList) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error || `Tệp ${file.name} không hợp lệ.`);
          continue;
        }
        // Nén ảnh nhẹ qua Canvas (chiều rộng tối đa 800px, chất lượng 0.65)
        const compressed = await compressImageFile(file, 800, 800, 0.65);
        newUrls.push(compressed);
      }

      if (newUrls.length > 0) {
        setSlideshowImages((prev) => [...prev, ...newUrls]);
      }
    } catch (err: any) {
      alert(`Lỗi khi tải ảnh: ${err.message || 'Không xác định'}`);
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Di chuyển ảnh lên/xuống
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slideshowImages.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...slideshowImages];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setSlideshowImages(updated);
  };

  // Xóa 1 ảnh
  const handleRemoveImage = (index: number) => {
    setSlideshowImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Lưu Album ảnh Slideshow & Đồng bộ Supabase daily_posters
  const handleSaveAlbum = async () => {
    const updatedSettings: UncleHoSettings = {
      ...settings,
      images: slideshowImages,
    };
    onSaveSettings(updatedSettings);

    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem('uncle_ho_images', JSON.stringify(slideshowImages));
      localStorage.setItem('mangyang_uncle_ho_images', JSON.stringify(slideshowImages));

      const cachedRaw = localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
      const cacheMap = cachedRaw ? JSON.parse(cachedRaw) : {};
      cacheMap['uncle_ho'] = {
        id: 'uncle_ho',
        title: settings.bannerTitle || 'LỜI BÁC DẠY NGÀY NÀY NĂM XƯA',
        image_data: slideshowImages[0] || '',
        aspect_ratio: 'auto',
        extra_data: { images: slideshowImages },
        updated_at: nowIso,
      };
      localStorage.setItem('daily_posters', JSON.stringify(cacheMap));
      localStorage.setItem('daily_posters_cache', JSON.stringify(cacheMap));
    } catch {
      // ignore
    }

    // Direct Supabase upsert to daily_posters
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('daily_posters').upsert({
          id: 'uncle_ho',
          title: settings.bannerTitle || 'LỜI BÁC DẠY NGÀY NÀY NĂM XƯA',
          image_data: slideshowImages[0] || '',
          aspect_ratio: 'auto',
          content: 'Album ảnh và Lời Bác Hồ dạy',
          extra_data: { images: slideshowImages, bannerTitle: settings.bannerTitle },
          updated_at: nowIso,
        }, { onConflict: 'id' });
      } catch (dbErr) {
        console.warn('[UncleHoManagerModal] Supabase upsert daily_posters error:', dbErr);
      }
    }

    alert('Đã lưu Album ảnh Slideshow Bác Hồ thành công! Khung ảnh sẽ hiển thị cố định các ảnh này trên toàn bộ hệ thống.');
  };

  // Bắt đầu chỉnh sửa hoặc tạo mới lời Bác dạy theo ngày
  const handleSelectQuoteForEdit = (q: UncleHoQuote) => {
    setEditingQuoteId(q.id);
    setSelectedDayMonth(q.dayMonth);
    setFormYear(q.yearRecorded || '1945');
    setFormQuote(q.quote);
    setFormContext(q.context || '');
    setFormLesson(q.lesson || '');
  };

  const handleCreateNewQuote = () => {
    setEditingQuoteId(null);
    setSelectedDayMonth('19/08');
    setFormYear('1945');
    setFormQuote('');
    setFormContext('');
    setFormLesson('Cán bộ, chiến sĩ Trung đoàn 95, Sư đoàn 2 luôn nêu cao tinh thần đoàn kết nội bộ, đoàn kết quân dân, hiệp đồng chặt chẽ, quyết tâm hoàn thành xuất sắc mọi nhiệm vụ.');
  };

  // Lưu một lời dạy theo ngày vào danh sách
  const handleSaveQuoteItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuote.trim()) {
      alert('Vui lòng nhập Lời Bác dạy cốt lõi!');
      return;
    }
    if (!selectedDayMonth.trim() || !selectedDayMonth.includes('/')) {
      alert('Vui lòng nhập ngày/tháng theo định dạng DD/MM (ví dụ: 19/05, 02/09)!');
      return;
    }

    const newItem: UncleHoQuote = {
      id: editingQuoteId || `quote-${selectedDayMonth.replace('/', '-')}-${Date.now()}`,
      dayMonth: selectedDayMonth.trim(),
      yearRecorded: formYear.trim(),
      quote: formQuote.trim(),
      context: formContext.trim(),
      lesson: formLesson.trim(),
      images: [],
      publishTime: '06:00',
      status: 'active',
      isAutoPublish: true,
    };

    let updatedList: UncleHoQuote[];
    const existingIndex = quotesList.findIndex(
      (q) => q.id === newItem.id || q.dayMonth === newItem.dayMonth
    );

    if (existingIndex >= 0) {
      updatedList = [...quotesList];
      updatedList[existingIndex] = newItem;
    } else {
      updatedList = [newItem, ...quotesList];
    }

    setQuotesList(updatedList);
    onSaveQuotes(updatedList);

    // Sync to daily_posters table
    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('daily_posters').upsert(
            {
              id: 'uncle_ho',
              title: settings.bannerTitle || 'LỜI BÁC DẠY NGÀY NÀY NĂM XƯA',
              image_data: slideshowImages[0] || '',
              aspect_ratio: 'auto',
              content: newItem.quote,
              extra_data: { images: slideshowImages, quote: newItem, bannerTitle: settings.bannerTitle },
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        } catch {
          // ignore
        }
      })();
    }

    alert(`Đã lưu Lời Bác dạy ngày ${newItem.dayMonth} thành công!`);
    handleCreateNewQuote();
  };

  // Xóa lời dạy của 1 ngày
  const handleDeleteQuote = (id: string, dayStr: string) => {
    if (!confirm(`Đồng chí có chắc chắn muốn xóa Lời Bác dạy ngày ${dayStr}?`)) return;
    const updated = quotesList.filter((q) => q.id !== id);
    setQuotesList(updated);
    onSaveQuotes(updated);
    if (editingQuoteId === id) {
      handleCreateNewQuote();
    }
  };

  // Lọc danh sách theo từ khóa
  const filteredQuotes = quotesList.filter(
    (q) =>
      q.dayMonth.includes(searchQuoteQuery) ||
      q.quote.toLowerCase().includes(searchQuoteQuery.toLowerCase()) ||
      (q.context && q.context.toLowerCase().includes(searchQuoteQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-850 via-red-900 to-red-950 text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center shadow-inner">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase text-amber-300 tracking-wide">
                QUẢN LÝ CHUYÊN MỤC "LỜI BÁC DẠY NGÀY NÀY NĂM XƯA"
              </h2>
              <p className="text-[11px] text-amber-100/80 font-medium">
                Tách biệt Album ảnh Slideshow cố định & Nội dung Lời Bác dạy theo ngày
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-amber-50/50 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('album')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'album'
                ? 'bg-white text-red-900 border-red-800 shadow-xs'
                : 'text-gray-600 hover:text-red-900 border-transparent'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-red-700" />
            <span>Tab 1: Quản lý Album ảnh Slideshow (Cố định)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 font-extrabold">
              {slideshowImages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-white text-red-900 border-red-800 shadow-xs'
                : 'text-gray-600 hover:text-red-900 border-transparent'
            }`}
          >
            <Quote className="w-4 h-4 text-red-700" />
            <span>Tab 2: Nội dung Lời Bác dạy theo ngày</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold">
              {quotesList.length}
            </span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#FAFAF8]">
          {/* TAB 1: QUẢN LÝ ALBUM ẢNH SLIDESHOW */}
          {activeTab === 'album' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3.5 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 leading-relaxed">
                  <strong className="text-red-900">Quy tắc hiển thị:</strong> Album ảnh chân dung & tư liệu Bác Hồ ở đây sẽ được hiển thị <strong>cố định và chạy tự động (4s/lần)</strong> trên chuyên mục trang chủ cho tất cả các ngày, không bị mất hoặc đổi ảnh khi chuyển ngày. Quản trị viên có thể tải lên từ 1 đến 5 ảnh đẹp, trang trọng nhất.
                </div>
              </div>

              {/* Khu vực Tải ảnh mới */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-900 flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-red-800" />
                      <span>Tải thêm ảnh vào Album Slideshow</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Hỗ trợ tệp PNG, JPG, JPEG, WebP. Tự động nén Canvas nhẹ nhàng, tối ưu hóa tốc độ load.
                    </p>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadSlideshowImages}
                      className="hidden"
                      id="slideshow-file-input"
                    />
                    <label
                      htmlFor="slideshow-file-input"
                      className="flex items-center gap-1.5 bg-red-850 hover:bg-red-900 text-amber-200 text-xs font-bold px-4 py-2 rounded-lg border border-amber-400 shadow-xs cursor-pointer transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isProcessingImages ? 'Đang nén & tải...' : 'Chọn ảnh từ máy tính / ĐT'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Danh sách ảnh hiện tại trong Album */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-xs font-black uppercase text-gray-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Danh sách ảnh trong Album ({slideshowImages.length} ảnh)</span>
                  </h3>
                  {slideshowImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSlideshowImages([])}
                      className="text-[11px] font-bold text-red-700 hover:text-red-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa hết ảnh</span>
                    </button>
                  )}
                </div>

                {slideshowImages.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-600">Chưa có ảnh nào trong Album</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Hệ thống sẽ hiển thị khung chân dung trang trọng mặc định. Hãy tải lên từ 1-5 ảnh Bác Hồ để bắt đầu Slideshow!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-3.5">
                    {slideshowImages.map((imgUrl, index) => (
                      <div
                        key={`img-${index}`}
                        className="relative rounded-xl overflow-hidden border-2 border-amber-300/80 bg-gray-900 group shadow-xs flex flex-col justify-between"
                      >
                        {/* Ảnh preview */}
                        <div className="w-full h-36 relative overflow-hidden bg-black">
                          <img
                            src={imgUrl}
                            alt={`Ảnh Bác ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 bg-red-900/90 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300/60">
                            Ảnh {index + 1} {index === 0 ? '(Chính)' : ''}
                          </div>
                        </div>

                        {/* Thanh công cụ di chuyển & xóa */}
                        <div className="p-2 bg-gray-50 flex items-center justify-between border-t border-gray-200 text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded border ${
                                index === 0
                                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-amber-100 border-gray-300 cursor-pointer'
                              }`}
                              title="Chuyển lên trước"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'down')}
                              disabled={index === slideshowImages.length - 1}
                              className={`p-1 rounded border ${
                                index === slideshowImages.length - 1
                                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-amber-100 border-gray-300 cursor-pointer'
                              }`}
                              title="Chuyển xuống sau"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="text-red-700 hover:text-red-900 p-1 rounded hover:bg-red-50 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút Lưu Album Slideshow */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAlbum}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-850 to-red-900 hover:from-red-900 hover:to-red-950 text-amber-200 hover:text-amber-100 text-xs font-black px-5 py-2.5 rounded-xl border border-amber-400 shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Lưu Album ảnh Slideshow Bác Hồ</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NỘI DUNG LỜI BÁC DẠY THEO NGÀY */}
          {activeTab === 'quotes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Cột trái: Form thêm/sửa câu nói theo ngày (7 cột) */}
              <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <h3 className="text-xs font-black uppercase text-red-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-red-800" />
                    <span>
                      {editingQuoteId ? 'Chỉnh sửa Lời Bác dạy' : 'Thêm Lời Bác dạy cho ngày mới'}
                    </span>
                  </h3>
                  {editingQuoteId && (
                    <button
                      type="button"
                      onClick={handleCreateNewQuote}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      + Tạo ngày mới
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveQuoteItem} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Ngày / Tháng */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Ngày / Tháng (DD/MM) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: 19/08 hoặc 02/09"
                        value={selectedDayMonth}
                        onChange={(e) => setSelectedDayMonth(e.target.value)}
                        className="w-full text-xs font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-red-800"
                      />
                    </div>

                    {/* Năm ghi nhận */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Năm lịch sử (nếu có)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: 1945, 1954..."
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        className="w-full text-xs font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-red-800"
                      />
                    </div>
                  </div>

                  {/* Câu nói cốt lõi */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Lời Bác dạy cốt lõi <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Nhập câu nói của Bác Hồ..."
                      value={formQuote}
                      onChange={(e) => setFormQuote(e.target.value)}
                      className="w-full text-xs font-medium text-gray-900 border border-gray-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-red-800 italic"
                    />
                  </div>

                  {/* Bối cảnh lịch sử */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Hoàn cảnh lịch sử & Nguồn tư liệu
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Bối cảnh Bác đưa ra lời dạy..."
                      value={formContext}
                      onChange={(e) => setFormContext(e.target.value)}
                      className="w-full text-xs text-gray-900 border border-gray-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-red-800"
                    />
                  </div>

                  {/* Bài học vận dụng */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Bài học vận dụng đối với cán bộ, chiến sĩ Trung đoàn 95, Sư đoàn 2
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ý nghĩa vận dụng trong huấn luyện, SSCĐ, rèn luyện kỷ luật..."
                      value={formLesson}
                      onChange={(e) => setFormLesson(e.target.value)}
                      className="w-full text-xs text-gray-900 border border-gray-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-red-800"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    {editingQuoteId && (
                      <button
                        type="button"
                        onClick={handleCreateNewQuote}
                        className="text-xs font-bold text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 bg-red-850 hover:bg-red-900 text-amber-200 text-xs font-black px-4 py-2 rounded-lg border border-amber-400 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingQuoteId ? 'Cập nhật ngày này' : 'Lưu Lời Bác dạy'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Cột phải: Danh sách các ngày đã có (5 cột) */}
              <div className="lg:col-span-5 bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-black uppercase text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-700" />
                      <span>Các ngày đã có ({filteredQuotes.length})</span>
                    </h3>
                  </div>

                  {/* Ô tìm kiếm */}
                  <div className="relative my-2.5">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo ngày hoặc từ khóa..."
                      value={searchQuoteQuery}
                      onChange={(e) => setSearchQuoteQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-800"
                    />
                  </div>

                  {/* Danh sách cuộn */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredQuotes.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">
                        Không tìm thấy ngày nào phù hợp
                      </p>
                    ) : (
                      filteredQuotes.map((q) => (
                        <div
                          key={q.id}
                          className={`p-2.5 rounded-lg border text-xs transition-all ${
                            editingQuoteId === q.id
                              ? 'bg-amber-50 border-red-800 shadow-xs'
                              : 'bg-gray-50/70 hover:bg-gray-100/80 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-red-900 bg-red-100 px-2 py-0.5 rounded text-[11px]">
                              Ngày {q.dayMonth}
                              {q.yearRecorded ? ` • ${q.yearRecorded}` : ''}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSelectQuoteForEdit(q)}
                                className="p-1 text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuote(q.id, q.dayMonth)}
                                className="p-1 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-800 line-clamp-2 italic">
                            &ldquo;{q.quote}&rdquo;
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-600">
            Hệ thống quản trị Cổng thông tin nội bộ <strong>Trung đoàn 95, Sư đoàn 2</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
export default UncleHoManagerModal;
