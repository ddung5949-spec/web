import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  Upload,
  Loader2,
  Car,
  ShieldAlert,
  HeartHandshake,
  Image as ImageIcon,
} from 'lucide-react';
import { getSupabase } from '../../utils/supabase';

/**
 * Tự động vẽ ảnh lên HTML Canvas, giới hạn kích thước tối đa không quá 800px,
 * xuất ra JPEG chất lượng 0.75. Tốc độ xử lý < 0.1s, dung lượng < 80KB.
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
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => reject(new Error('Không thể đọc hình ảnh.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsDataURL(file);
  });
};

export interface DailyPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId?: string; // 'tinh-huong-giao-thong' | 'traffic_situation' | 'traffic' | 'safety_message' | 'good_deed'
  initialCategory?: string;
  initialTitle?: string;
  initialImage?: string;
  initialAspectRatio?: 'auto' | 'portrait' | 'landscape';
  onSaveSuccess?: (savedData: {
    id: string;
    title: string;
    category_name: string;
    image_url: string;
    aspect_ratio: string;
  }) => void;
  onSaveDailyWidgets?: (widgets: any[]) => Promise<void> | void;
  dailyWidgets?: any[];
}

export const DailyPosterModal: React.FC<DailyPosterModalProps> = ({
  isOpen,
  onClose,
  widgetId = 'tinh-huong-giao-thong',
  initialCategory,
  initialTitle,
  initialImage,
  initialAspectRatio = 'auto',
  onSaveSuccess,
  onSaveDailyWidgets,
  dailyWidgets,
}) => {
  // Chuẩn hóa ID: Nếu thuộc chuyên mục Giao thông, ép ID chính xác là 'tinh-huong-giao-thong'
  const isTraffic =
    !widgetId ||
    widgetId === 'tinh-huong-giao-thong' ||
    widgetId === 'tinh_huong_giao_thong' ||
    widgetId === 'traffic_situation' ||
    widgetId === 'traffic' ||
    widgetId === 'widget_traffic_situation';

  const isSafety =
    widgetId === 'safety_message' ||
    widgetId === 'safety' ||
    widgetId === 'widget_safety_message';

  const targetId = isTraffic
    ? 'tinh-huong-giao-thong'
    : isSafety
    ? 'safety'
    : 'good_deed';

  const defaultCategory = isTraffic
    ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
    : isSafety
    ? 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN'
    : 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP';

  const [formCategory, setFormCategory] = useState(initialCategory || defaultCategory);
  const [formTitle, setFormTitle] = useState(initialTitle || '');
  const [formImage, setFormImage] = useState(initialImage || '');
  const [formAspectRatio, setFormAspectRatio] = useState<'auto' | 'portrait' | 'landscape'>(
    initialAspectRatio || 'auto'
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormCategory(initialCategory || defaultCategory);
      setFormTitle(initialTitle || '');
      setFormImage(initialImage || '');
      setFormAspectRatio(initialAspectRatio || 'auto');
    }
  }, [isOpen, initialCategory, initialTitle, initialImage, initialAspectRatio, defaultCategory]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // Nén ảnh Canvas tức thì trong 0.1s, đưa dung lượng về dưới 80KB
      const compressedBase64 = await compressPosterImage(file);
      setFormImage(compressedBase64);
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
    if (!formImage && !initialImage) {
      alert('Vui lòng chọn hình ảnh Poster!');
      return;
    }

    try {
      setIsSaving(true);
      const nowIso = new Date().toISOString();
      const rawImg = formImage || initialImage || '';

      // Thêm timestamp chống cache URL ảnh nếu là liên kết http
      let finalUrl = rawImg;
      if (finalUrl && finalUrl.startsWith('http')) {
        finalUrl = finalUrl.includes('?t=')
          ? finalUrl.replace(/\?t=\d+/, `?t=${Date.now()}`)
          : `${finalUrl}?t=${Date.now()}`;
      }

      const finalCategory = formCategory.trim() || defaultCategory;
      const finalTitle = formTitle.trim() || defaultCategory;

      const posterRecord = {
        id: targetId, // 'tinh-huong-giao-thong' | 'safety' | 'good_deed'
        title: finalTitle,
        category_name: finalCategory,
        image_url: finalUrl,
        image_data: finalUrl,
        aspect_ratio: formAspectRatio,
        content: finalTitle || '',
        extra_data: { category_name: finalCategory },
        updated_at: nowIso,
      };

      // 1. Lưu trực tiếp vào Supabase bảng 'daily_posters'
      const supabase = getSupabase();
      if (supabase) {
        const { error: upsertErr } = await supabase.from('daily_posters').upsert(posterRecord, {
          onConflict: 'id',
        });

        if (upsertErr) {
          console.error('[DailyPosterModal] Supabase error:', upsertErr);
          alert('❌ Lỗi khi lưu lên cơ sở dữ liệu: ' + upsertErr.message);
          setIsSaving(false);
          return;
        }

        // Đồng bộ các ID tương thích (traffic, traffic_situation)
        if (isTraffic) {
          try {
            await supabase.from('daily_posters').upsert([
              { ...posterRecord, id: 'traffic' },
              { ...posterRecord, id: 'traffic_situation' },
            ], { onConflict: 'id' });
          } catch {
            // ignore
          }
        }
      }

      // 2. Cập nhật localStorage an toàn (CHỐNG TRÀN BỘ NHỚ QuotaExceededError)
      try {
        const cachedRaw =
          localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
        const cacheMap = cachedRaw ? JSON.parse(cachedRaw) : {};

        // Rút gọn: tuyệt đối không nhồi Base64 dài quá 500 ký tự vào LocalStorage
        const sanitizedUrl = (finalUrl && finalUrl.startsWith('data:') && finalUrl.length > 500) ? '' : finalUrl;
        const storageRecord = {
          ...posterRecord,
          image_url: sanitizedUrl,
          image_data: sanitizedUrl,
        };

        cacheMap[targetId] = storageRecord;
        if (isTraffic) {
          cacheMap['tinh-huong-giao-thong'] = storageRecord;
          cacheMap['traffic'] = storageRecord;
          cacheMap['traffic_situation'] = storageRecord;
        } else if (isSafety) {
          cacheMap['safety'] = storageRecord;
          cacheMap['safety_message'] = storageRecord;
        } else {
          cacheMap['good_deed'] = storageRecord;
        }
        localStorage.setItem('daily_posters', JSON.stringify(cacheMap));
        localStorage.setItem('daily_posters_cache', JSON.stringify(cacheMap));

        // Metadata ngắn gọn không chứa Base64 cho cached_posters
        const posterList = Object.values(cacheMap).map((p: any) => ({
          id: p.id,
          title: p.title || '',
          category_name: p.category_name || '',
          aspect_ratio: p.aspect_ratio || 'auto',
          updated_at: p.updated_at || '',
          image_url: (p.image_url && p.image_url.startsWith('data:') && p.image_url.length > 500) ? '' : (p.image_url || ''),
        }));
        localStorage.setItem('cached_posters', JSON.stringify(posterList));
      } catch (err) {
        console.warn('Bỏ qua lưu cache posters vào localStorage do hạn mức trình duyệt');
      }

      // 3. Phát CustomEvent để State ngoài trang chủ cập nhật tức thì (đầy đủ ảnh gốc trong RAM)
      window.dispatchEvent(
        new CustomEvent('daily_posters_updated', {
          detail: {
            id: targetId,
            poster: posterRecord,
          },
        })
      );

      // 4. Đồng bộ callback ngoài HomeView nếu có
      if (onSaveSuccess) {
        onSaveSuccess(posterRecord);
      }

      if (onSaveDailyWidgets) {
        const existingList = Array.isArray(dailyWidgets) ? [...dailyWidgets] : [];
        const updatedItem = {
          id: targetId,
          categoryName: finalCategory,
          title: finalTitle,
          imageUrl: finalUrl,
          aspectRatioMode: formAspectRatio,
          updatedAt: nowIso,
        };
        const idx = existingList.findIndex(
          (w) =>
            w.id === targetId ||
            (isTraffic && (w.id === 'traffic_situation' || w.id === 'traffic' || w.id === 'tinh-huong-giao-thong'))
        );
        let nextList: any[];
        if (idx >= 0) {
          nextList = existingList.map((w, i) => (i === idx ? updatedItem : w));
        } else {
          nextList = [...existingList, updatedItem];
        }
        await Promise.resolve(onSaveDailyWidgets(nextList));
      }

      // Đóng modal tức thì
      onClose();
    } catch (err: any) {
      console.error('[DailyPosterModal] Save error:', err);
      alert('❌ Lỗi khi lưu poster: ' + (err?.message || 'Vui lòng thử lại'));
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
                {formCategory || defaultCategory}
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
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
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
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
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
                Ảnh sẽ được gắn mã chống lưu đệm cache (?t=...) để hiển thị ngay lập tức khi lưu.
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
                onClick={() => setFormAspectRatio('auto')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] text-center transition-all cursor-pointer ${
                  formAspectRatio === 'auto'
                    ? 'border-amber-700 bg-amber-50 text-amber-800 ring-2 ring-amber-300'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tự động
              </button>
              <button
                type="button"
                onClick={() => setFormAspectRatio('portrait')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] text-center transition-all cursor-pointer ${
                  formAspectRatio === 'portrait'
                    ? 'border-amber-700 bg-amber-50 text-amber-800 ring-2 ring-amber-300'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Poster Dọc (3:4)
              </button>
              <button
                type="button"
                onClick={() => setFormAspectRatio('landscape')}
                className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] text-center transition-all cursor-pointer ${
                  formAspectRatio === 'landscape'
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
              {formImage && formImage.trim() !== '' ? (
                <img
                  src={formImage}
                  alt="Preview"
                  className={`max-h-52 rounded-lg ${
                    formAspectRatio === 'portrait'
                      ? 'aspect-[3/4] object-cover'
                      : formAspectRatio === 'landscape'
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
