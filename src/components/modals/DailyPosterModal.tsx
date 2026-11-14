import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  Upload,
  Loader2,
  Car,
  ShieldAlert,
  HeartHandshake,
} from 'lucide-react';
import { getSupabase } from '../../utils/supabase';

export const POSTER_ID_SAFETY = 'thong-diep-an-toan';
export const POSTER_ID_TRAFFIC = 'tinh-huong-giao-thong';

/**
 * Tự động vẽ ảnh lên HTML Canvas, giới hạn chiều rộng/dài tối đa 800px,
 * xuất ra JPEG chất lượng 0.75 (tự điều chỉnh nhẹ nếu vượt 80KB để đảm bảo < 80KB).
 */
const compressPosterImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX_DIM) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else if (h > MAX_DIM) {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, w, h);

        let dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        // Đảm bảo dung lượng < 80KB (~81,920 bytes) để upsert siêu nhanh
        const MAX_BYTES = 80 * 1024;
        const qualities = [0.65, 0.55, 0.45];
        for (const q of qualities) {
          if (dataUrl.length <= MAX_BYTES) break;
          dataUrl = canvas.toDataURL('image/jpeg', q);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể đọc hình ảnh.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsDataURL(file);
  });
};

export interface SavedDailyPosterPayload {
  id: string;
  category_name: string;
  title: string;
  image_url: string;
  aspect_ratio: string;
  updated_at: string;
}

export interface DailyPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterId?: string; // Khóa cứng: 'thong-diep-an-toan' | 'tinh-huong-giao-thong'
  widgetId?: string;
  initialCategory?: string;
  initialTitle?: string;
  initialImage?: string;
  initialAspectRatio?: 'auto' | 'portrait' | 'landscape';
  onSaved?: (savedData: SavedDailyPosterPayload) => void;
  onSaveSuccess?: (savedData: SavedDailyPosterPayload) => void;
  onSaveDailyWidgets?: (widgets: any[]) => Promise<void> | void;
  dailyWidgets?: any[];
}

const resolveLockedPosterId = (rawId?: string): string => {
  const id = (rawId || '').trim();
  if (
    id === POSTER_ID_SAFETY ||
    id === 'safety' ||
    id === 'safety_message' ||
    id === 'widget_safety_message'
  ) {
    return POSTER_ID_SAFETY;
  }
  if (
    !id ||
    id === POSTER_ID_TRAFFIC ||
    id === 'tinh_huong_giao_thong' ||
    id === 'traffic' ||
    id === 'traffic_situation' ||
    id === 'widget_traffic_situation'
  ) {
    return POSTER_ID_TRAFFIC;
  }
  return id;
};

export const DailyPosterModal: React.FC<DailyPosterModalProps> = ({
  isOpen,
  onClose,
  posterId: propPosterId,
  widgetId,
  initialCategory,
  initialTitle,
  initialImage,
  initialAspectRatio = 'portrait',
  onSaved,
  onSaveSuccess,
}) => {
  // Khóa cứng mã ID định danh cho 2 khung poster
  const posterId = resolveLockedPosterId(propPosterId || widgetId);
  const isTraffic = posterId === POSTER_ID_TRAFFIC;
  const isSafety = posterId === POSTER_ID_SAFETY;

  const defaultCategory = isTraffic
    ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
    : isSafety
    ? 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN'
    : 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP';

  const [categoryName, setCategoryName] = useState(initialCategory || defaultCategory);
  const [title, setTitle] = useState(initialTitle || '');
  const [imageUrl, setImageUrl] = useState(initialImage || '');
  const [aspectRatio, setAspectRatio] = useState<'auto' | 'portrait' | 'landscape'>(
    initialAspectRatio || 'portrait'
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCategoryName(initialCategory || defaultCategory);
      setTitle(initialTitle || '');
      setImageUrl(initialImage || '');
      setAspectRatio(initialAspectRatio || 'portrait');
    }
  }, [isOpen, posterId, initialCategory, initialTitle, initialImage, initialAspectRatio, defaultCategory]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressPosterImage(file);
      setImageUrl(compressedBase64);
    } catch (err) {
      console.error('[DailyPosterModal] File compression error:', err);
      alert('Không thể tải hoặc xử lý ảnh. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawImg = imageUrl || initialImage || '';
    if (!rawImg.trim()) {
      alert('Vui lòng chọn hình ảnh Poster!');
      return;
    }

    try {
      setIsSaving(true);

      let finalImageUrl = rawImg.trim();
      if (finalImageUrl.startsWith('http')) {
        finalImageUrl = finalImageUrl.includes('?t=')
          ? finalImageUrl.replace(/\?t=\d+/, `?t=${Date.now()}`)
          : `${finalImageUrl}?t=${Date.now()}`;
      }

      const finalCategoryName = categoryName.trim() || defaultCategory;
      const finalTitle = title?.trim() || finalCategoryName;

      const payload: SavedDailyPosterPayload = {
        id: posterId, // 'thong-diep-an-toan' hoặc 'tinh-huong-giao-thong'
        category_name: finalCategoryName,
        title: finalTitle,
        image_url: finalImageUrl,
        aspect_ratio: aspectRatio || 'portrait',
        updated_at: new Date().toISOString(),
      };

      const supabase = getSupabase();
      if (!supabase) {
        alert('❌ Lỗi lưu chuyên mục: Chưa kết nối được cơ sở dữ liệu Supabase.');
        return;
      }

      const { error } = await supabase
        .from('daily_posters')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        alert('❌ Lỗi lưu chuyên mục: ' + error.message);
        return;
      }

      // Cập nhật localStorage metadata gọn nhẹ (không lưu Base64 ảnh nặng gây QuotaExceededError)
      try {
        const cachedRaw =
          localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
        const cacheMap = cachedRaw ? JSON.parse(cachedRaw) : {};
        const sanitizedUrl =
          finalImageUrl.startsWith('data:') && finalImageUrl.length > 500 ? '' : finalImageUrl;
        const storageRecord = {
          ...payload,
          image_url: sanitizedUrl,
          image_data: sanitizedUrl,
        };
        cacheMap[posterId] = storageRecord;
        localStorage.setItem('daily_posters', JSON.stringify(cacheMap));
        localStorage.setItem('daily_posters_cache', JSON.stringify(cacheMap));
      } catch {
        // Bỏ qua lỗi hạn mức localStorage
      }

      // Phát CustomEvent để các widget liên quan đồng bộ ngay lập tức
      window.dispatchEvent(
        new CustomEvent('daily_posters_updated', {
          detail: {
            id: posterId,
            poster: payload,
          },
        })
      );

      if (onSaved) {
        onSaved(payload); // Cập nhật state ngoài HomeView ngay lập tức
      }
      if (onSaveSuccess) {
        onSaveSuccess(payload);
      }

      alert('✅ Đã lưu chuyên mục thành công!');
      onClose();
    } catch (err: any) {
      console.error('[DailyPosterModal] Save error:', err);
      alert('❌ Lỗi lưu chuyên mục: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSaving(false);
    }
  };

  const headerBg = isTraffic
    ? 'bg-gradient-to-r from-amber-700 to-yellow-800'
    : isSafety
    ? 'bg-gradient-to-r from-red-800 to-rose-900'
    : 'bg-gradient-to-r from-emerald-800 to-teal-900';

  const HeaderIcon = isTraffic ? Car : isSafety ? ShieldAlert : HeartHandshake;

  return (
    <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className={`${headerBg} text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl text-amber-300">
              <HeaderIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-amber-200 uppercase tracking-wide">
                CHỈNH SỬA POSTER CHUYÊN MỤC
              </h3>
              <p className="text-[11px] text-white/80">
                {categoryName || defaultCategory} ({posterId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Chuyên mục */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Tên chuyên mục hiển thị:
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ví dụ: Mỗi ngày một tình huống giao thông"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold text-gray-800"
              required
            />
          </div>

          {/* Tiêu đề poster */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Tiêu đề / Thông điệp chính:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Chú ý quan sát khi chuyển hướng xe quân sự..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-gray-800"
            />
          </div>

          {/* Chọn ảnh */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Hình ảnh Poster:
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  {isCompressing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Chọn ảnh từ máy tính / điện thoại</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 italic">
                Ảnh tự động nén qua Canvas (≤ 800px, JPEG 0.75, &lt; 80KB) và lưu trực tiếp lên Supabase.
              </p>
            </div>
          </div>

          {/* Tùy chọn tỉ lệ */}
          <div>
            <label className="block font-bold text-gray-800 mb-1.5">
              Tùy chọn tỉ lệ hiển thị trên trang chủ:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('auto')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] text-center transition-all cursor-pointer ${
                  aspectRatio === 'auto'
                    ? 'border-amber-700 bg-amber-50 text-amber-800 ring-2 ring-amber-300'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tự động
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('portrait')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] text-center transition-all cursor-pointer ${
                  aspectRatio === 'portrait'
                    ? 'border-amber-700 bg-amber-50 text-amber-800 ring-2 ring-amber-300'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Poster Dọc (3:4)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('landscape')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] text-center transition-all cursor-pointer ${
                  aspectRatio === 'landscape'
                    ? 'border-amber-700 bg-amber-50 text-amber-800 ring-2 ring-amber-300'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Poster Ngang (16:9)
              </button>
            </div>
          </div>

          {/* Preview ảnh */}
          <div>
            <label className="block font-bold text-gray-800 mb-1">
              Xem trước ảnh Poster:
            </label>
            <div className="w-full max-h-56 rounded-xl border border-gray-200 bg-slate-100 p-2 overflow-hidden flex items-center justify-center">
              {imageUrl && imageUrl.trim() !== '' ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className={`max-h-52 rounded-lg ${
                    aspectRatio === 'portrait'
                      ? 'aspect-[3/4] object-cover'
                      : aspectRatio === 'landscape'
                      ? 'aspect-video object-cover'
                      : 'max-h-52 w-auto object-contain'
                  }`}
                  loading="lazy"
                />
              ) : (
                <span className="text-gray-400 text-xs italic">Chưa chọn ảnh poster</span>
              )}
            </div>
          </div>

          {/* Nút hành động */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || isCompressing}
              className="px-5 py-2 bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-800 hover:to-yellow-800 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>⏳ Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>✓ LƯU POSTER</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
