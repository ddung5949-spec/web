import React, { useEffect, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Calendar,
  Sparkles,
  Tag,
} from 'lucide-react';
import { getSupabase } from '../utils/supabase';
import { User } from '../types';

export interface GalleryItem {
  id: string | number;
  title: string;
  category?: string;
  imageUrl?: string;
  image_url?: string;
  image_data?: string;
  description?: string;
  date?: string;
  created_at?: string;
}

interface HomeGallerySectionProps {
  currentUser: User | null;
}

const GALLERY_CATEGORIES = [
  'Tất cả',
  'Huấn luyện - SSCĐ',
  'CTĐ - CTCT',
  'Hậu cần - Kỹ thuật',
  'Đời sống - Văn hóa',
];

export const HomeGallerySection: React.FC<HomeGallerySectionProps> = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';
  const [items, setItems] = useState<GalleryItem[]>(() => {
    try {
      const cached = localStorage.getItem('cached_gallery');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Modal thêm ảnh mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Huấn luyện - SSCĐ');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(
    new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dữ liệu từ bảng 'gallery' Supabase
  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabase();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setItems(data);
        try {
          localStorage.setItem('cached_gallery', JSON.stringify(data));
        } catch {}
      }
    } catch (e) {
      console.warn('[HomeGallerySection] Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();

    // Supabase realtime listener on 'gallery' table
    try {
      const supabase = getSupabase();
      if (supabase) {
        const channel = supabase
          .channel('public:gallery')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
            fetchGallery();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    } catch {}
  }, []);

  // Filter theo danh mục
  const filteredItems = (items || []).filter((item) => {
    if (selectedCategory === 'Tất cả') return true;
    return item.category === selectedCategory;
  });

  // Lightbox handlers
  const handleOpenLightbox = (index: number) => {
    setActiveLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setActiveLightboxIndex(null);
  };

  const handleNextPhoto = () => {
    if (activeLightboxIndex !== null && filteredItems.length > 0) {
      setActiveLightboxIndex((activeLightboxIndex + 1) % filteredItems.length);
    }
  };

  const handlePrevPhoto = () => {
    if (activeLightboxIndex !== null && filteredItems.length > 0) {
      setActiveLightboxIndex(
        (activeLightboxIndex - 1 + filteredItems.length) % filteredItems.length
      );
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, filteredItems.length]);

  // Helper resolve image src
  const getImageSrc = (item: GalleryItem): string => {
    return item.imageUrl || item.image_url || item.image_data || '';
  };

  // Thêm ảnh mới vào Supabase
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) {
      alert('Vui lòng nhập tiêu đề và hình ảnh!');
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = getSupabase();
      if (!supabase) {
        alert('Không tìm thấy kết nối Supabase!');
        setIsSubmitting(false);
        return;
      }

      const newRecord = {
        title: newTitle.trim(),
        category: newCategory,
        image_url: newImageUrl.trim(),
        imageUrl: newImageUrl.trim(),
        description: newDescription.trim(),
        date: newDate,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('gallery').insert([newRecord]).select();

      if (error) {
        alert('Lỗi lưu CSDL: ' + error.message);
        setIsSubmitting(false);
        return;
      }

      // Optimistic update
      const createdItem = data && data[0] ? data[0] : newRecord;
      const updated = [createdItem as GalleryItem, ...items];
      setItems(updated);
      try {
        localStorage.setItem('cached_gallery', JSON.stringify(updated));
      } catch {}

      alert('✅ Đã thêm ảnh vào Album truyền thống thành công!');
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewImageUrl('');
      setNewDescription('');
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể lưu ảnh'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa ảnh khỏi Supabase
  const handleDeletePhoto = async (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Đồng chí có chắc muốn xóa bức ảnh "${item.title}" khỏi Album truyền thống?`)) {
      return;
    }

    try {
      const supabase = getSupabase();
      if (supabase && item.id) {
        await supabase.from('gallery').delete().eq('id', item.id);
      }
      const updated = items.filter((i) => i.id !== item.id);
      setItems(updated);
      try {
        localStorage.setItem('cached_gallery', JSON.stringify(updated));
      } catch {}
    } catch (err) {
      console.warn('Lỗi xóa ảnh:', err);
    }
  };

  // Handle local image file upload -> convert to Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Dung lượng tệp không được vượt quá 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setNewImageUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activePhoto = activeLightboxIndex !== null ? filteredItems[activeLightboxIndex] : null;

  return (
    <section className="w-full space-y-3.5 pt-2 select-none">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-red-800 via-red-900 to-amber-950 text-white px-4 py-3 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-amber-400">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400/20 rounded-xl text-amber-300 border border-amber-300/30 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                ALBUM ẢNH TRUYỀN THỐNG TRUNG ĐOÀN 95
              </span>
              <span className="text-[10px] bg-amber-400 text-red-950 font-black px-1.5 py-0.5 rounded-full uppercase">
                Tư liệu số
              </span>
            </div>
            <p className="text-[11px] text-white/80 mt-0.5">
              Hình ảnh nổi bật về công tác huấn luyện, SSCĐ, xây dựng đơn vị và đời sống chiến sĩ
            </p>
          </div>
        </div>

        {/* Admin Add Photo Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-center"
            title="Thêm hình ảnh hoạt động vào Album truyền thống"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>THÊM ẢNH TRUYỀN THỐNG</span>
          </button>
        )}
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
        {GALLERY_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? 'bg-red-800 text-white border-red-900 shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 3. Photo Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="w-full py-16 text-center text-slate-500 font-medium bg-white rounded-lg border border-dashed border-slate-300 my-4">
          Chưa có dữ liệu nào được đăng tải trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, idx) => {
            const imgSrc = getImageSrc(item);
            return (
              <div
                key={item.id || idx}
                onClick={() => handleOpenLightbox(idx)}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:scale-105 hover:shadow-lg transition-all duration-300 transform cursor-pointer flex flex-col relative"
              >
                {/* Photo Thumbnail Container */}
                <div className="w-full aspect-video bg-gray-900 relative overflow-hidden">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-gray-800">
                      <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[11px]">Ảnh tư liệu</span>
                    </div>
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Category badge */}
                  {item.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-700/90 text-white shadow-xs backdrop-blur-xs border border-white/20">
                      {item.category}
                    </span>
                  )}

                  {/* Delete button for Admin */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePhoto(item, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-700 text-white transition-colors cursor-pointer"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Zoom hint icon on hover */}
                  <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/20 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Photo Meta & Title */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                  <h3
                    className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  {item.date && (
                    <div className="pt-1.5 border-t border-gray-100 flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                      <Calendar className="w-3 h-3 text-red-600" />
                      <span>{item.date}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={handleCloseLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            title="Đóng xem ảnh (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev button */}
          {filteredItems.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPhoto();
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/80 text-amber-300 border border-white/20 transition-all cursor-pointer shadow-lg"
              title="Ảnh trước (Mũi tên trái)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next button */}
          {filteredItems.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/80 text-amber-300 border border-white/20 transition-all cursor-pointer shadow-lg"
              title="Ảnh tiếp theo (Mũi tên phải)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Lightbox Content Card */}
          <div
            className="max-w-5xl w-full bg-gray-950 rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image viewer */}
            <div className="w-full flex-1 min-h-[300px] max-h-[65vh] bg-black flex items-center justify-center overflow-hidden relative">
              <img
                src={getImageSrc(activePhoto)}
                alt={activePhoto.title}
                className="max-w-full max-h-[65vh] object-contain"
              />
            </div>

            {/* Photo info panel */}
            <div className="p-4 sm:p-5 bg-gradient-to-t from-black via-gray-950 to-gray-900 border-t border-white/10 text-white space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {activePhoto.category && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-red-700 text-white border border-red-500/40">
                      {activePhoto.category}
                    </span>
                  )}
                  {activePhoto.date && (
                    <span className="text-xs text-amber-300 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{activePhoto.date}</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/50 font-mono font-medium">
                  {activeLightboxIndex !== null ? activeLightboxIndex + 1 : 1} / {filteredItems.length}
                </div>
              </div>

              <h2 className="text-sm sm:text-base md:text-lg font-black text-amber-100 leading-snug">
                {activePhoto.title}
              </h2>

              {activePhoto.description && (
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-h-24 overflow-y-auto">
                  {activePhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Thêm ảnh mới (Dành cho Admin) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-4 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  THÊM ẢNH VÀO ALBUM TRUYỀN THỐNG
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePhoto} className="p-4 sm:p-5 space-y-3.5 text-xs text-gray-700">
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Tiêu đề bức ảnh <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Huấn luyện bắn đạn thật Tiểu đoàn 1 tại thao trường"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-red-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Danh mục hoạt động</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-red-700 text-xs bg-white"
                  >
                    {GALLERY_CATEGORIES.filter((c) => c !== 'Tất cả').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Thời gian / Ngày chụp</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="VD: 22/12/2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-red-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Hình ảnh (Tải tệp lên hoặc nhập link ảnh) <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Hoặc dán link ảnh trực tiếp (https://...)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-red-700 text-xs font-mono"
                  />
                </div>
                {newImageUrl && (
                  <div className="mt-2 w-full h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img src={newImageUrl} alt="Preview" className="h-full object-contain" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Mô tả / Ý nghĩa bức ảnh</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ghi chú chi tiết về hoạt động, địa điểm hoặc nhân vật trong ảnh..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:border-red-700 text-xs"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'LƯU VÀO ALBUM'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
