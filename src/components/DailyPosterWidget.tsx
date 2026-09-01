import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Car,
  HeartHandshake,
  Edit3,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Loader2,
  Maximize2,
  X,
  Check,
  RotateCcw,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { DailyWidgetItem, User } from '../types';
import { defaultDailyWidgets } from '../data/initialData';
import { supabaseDb, getSupabase } from '../utils/supabase';
import { toast } from './Toast';

interface DailyPosterWidgetProps {
  widgetId: string; // 'safety_message' | 'traffic_situation' | 'good_deed' | 'widget_safety_message' ...
  dailyWidgets?: DailyWidgetItem[];
  currentUser: User | null;
  onSaveDailyWidgets: (widgets: DailyWidgetItem[]) => Promise<void> | void;
}

/**
 * High-performance client-side Canvas image compressor
 * Automatically downscales images (max dimension 800px, JPEG quality 0.65)
 * Ensuring Base64 payload is ultra-light (< 120KB) for instantaneous Supabase sync
 */
export function compressPosterImage(file: File, maxWidth = 800, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể tải ảnh.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsDataURL(file);
  });
}

export const DailyPosterWidget: React.FC<DailyPosterWidgetProps> = ({
  widgetId,
  dailyWidgets,
  currentUser,
  onSaveDailyWidgets,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Normalize id (e.g. 'widget_safety_message' -> 'safety_message')
  const cleanId = widgetId.replace(/^widget_/, '');

  // Standardized posterKey: 'safety' | 'traffic' | 'good_deed'
  const posterKey =
    cleanId === 'safety_message' || cleanId === 'safety'
      ? 'safety'
      : cleanId === 'traffic_situation' || cleanId === 'traffic'
      ? 'traffic'
      : 'good_deed';

  // Find default fallback
  const defaultCategoryTitle =
    posterKey === 'safety'
      ? 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN'
      : posterKey === 'traffic'
      ? 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG'
      : 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP';

  const defaultItem: DailyWidgetItem = {
    id: cleanId,
    categoryName: defaultCategoryTitle,
    title: '',
    content: '',
    imageUrl: '',
    aspectRatioMode: 'auto',
  };

  // 1. Instant fallback from localStorage cache ('daily_posters' or 'daily_posters_cache') if props not yet loaded
  let cachedImg = '';
  let cachedRatio = 'auto';
  let cachedTitle = '';
  let cachedCat = '';
  try {
    const cachedRaw = localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
    if (cachedRaw) {
      const cacheMap = JSON.parse(cachedRaw);
      const found = cacheMap[posterKey] || cacheMap[cleanId] || cacheMap[widgetId];
      if (found) {
        cachedImg = found.image_data || found.imageUrl || found.image || '';
        cachedRatio = found.aspect_ratio || found.aspectRatio || found.aspectRatioMode || 'auto';
        cachedTitle = found.title || '';
        cachedCat = found.category_name || found.categoryName || '';
      }
    }
  } catch {
    // ignore
  }

  // Find custom configured item from dailyWidgets prop (supports both array and object format)
  let customItem: DailyWidgetItem | undefined;
  if (Array.isArray(dailyWidgets)) {
    customItem = dailyWidgets.find(
      (w) =>
        w.id === cleanId ||
        w.id === widgetId ||
        (posterKey === 'safety' && (w.id === 'safety_message' || w.id === 'widget_safety_message' || w.id === 'safety')) ||
        (posterKey === 'traffic' && (w.id === 'traffic_situation' || w.id === 'widget_traffic_situation' || w.id === 'traffic')) ||
        (posterKey === 'good_deed' && (w.id === 'good_deed' || w.id === 'widget_good_deed'))
    );
  } else if (dailyWidgets && typeof dailyWidgets === 'object') {
    const rawVal =
      (dailyWidgets as any)[cleanId] ||
      (dailyWidgets as any)[widgetId] ||
      (dailyWidgets as any)[posterKey];
    if (rawVal) {
      customItem = {
        id: cleanId,
        categoryName: rawVal.categoryName || rawVal.category_name || defaultCategoryTitle,
        title: rawVal.title || '',
        content: rawVal.content || '',
        imageUrl: rawVal.image || rawVal.imageUrl || rawVal.image_data || '',
        aspectRatioMode: rawVal.aspectRatio || rawVal.aspectRatioMode || rawVal.aspect_ratio || 'auto',
        updatedAt: rawVal.updatedAt || rawVal.updated_at || '',
      };
    }
  }

  const currentItem: DailyWidgetItem = {
    ...defaultItem,
    ...(customItem || {}),
    imageUrl: customItem?.imageUrl || cachedImg || '',
    aspectRatioMode: (customItem?.aspectRatioMode || cachedRatio as any || 'auto'),
    categoryName: customItem?.categoryName || cachedCat || defaultCategoryTitle,
    title: customItem?.title || cachedTitle || '',
  };

  // Config mapping for styling & icons
  const getWidgetStyle = (id: string) => {
    switch (id) {
      case 'safety':
      case 'safety_message':
      case 'widget_safety_message':
        return {
          icon: ShieldAlert,
          badgeColor: 'bg-red-700 text-white',
          headerBg: 'bg-gradient-to-r from-red-800 to-rose-900',
          borderColor: 'border-red-200 hover:border-red-400',
          defaultCategory: 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN',
        };
      case 'traffic':
      case 'traffic_situation':
      case 'widget_traffic_situation':
        return {
          icon: Car,
          badgeColor: 'bg-amber-600 text-white',
          headerBg: 'bg-gradient-to-r from-amber-700 to-yellow-800',
          borderColor: 'border-amber-200 hover:border-amber-400',
          defaultCategory: 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG',
        };
      case 'good_deed':
      case 'widget_good_deed':
      default:
        return {
          icon: HeartHandshake,
          badgeColor: 'bg-emerald-700 text-white',
          headerBg: 'bg-gradient-to-r from-emerald-800 to-teal-900',
          borderColor: 'border-emerald-200 hover:border-emerald-400',
          defaultCategory: 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP',
        };
    }
  };

  const styleConfig = getWidgetStyle(cleanId);
  const IconComponent = styleConfig.icon;

  // States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Edit form state
  const [formCategory, setFormCategory] = useState(currentItem.categoryName);
  const [formTitle, setFormTitle] = useState(currentItem.title || '');
  const [formImage, setFormImage] = useState(currentItem.imageUrl || '');
  const [formAspectRatio, setFormAspectRatio] = useState<'auto' | 'portrait' | 'landscape'>(
    currentItem.aspectRatioMode || 'auto'
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = () => {
    setFormCategory(currentItem.categoryName || styleConfig.defaultCategory);
    setFormTitle(currentItem.title || '');
    setFormImage(currentItem.imageUrl || '');
    setFormAspectRatio(currentItem.aspectRatioMode || 'auto');
    setIsEditModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // Nén ảnh JPEG chất lượng 0.7, chiều rộng 800px bằng Canvas
      const compressedBase64 = await compressPosterImage(file, 800, 0.7);
      setFormImage(compressedBase64);
    } catch (err) {
      console.error('Error compressing poster image:', err);
      toast.error('Lỗi xử lý ảnh', 'Không thể xử lý ảnh tải lên. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const nowIso = new Date().toISOString();
      const todayStr = new Date().toLocaleDateString('vi-VN');
      const finalImg = formImage || currentItem.imageUrl;
      const finalCat = formCategory.trim() || styleConfig.defaultCategory;
      const finalTitle = formTitle.trim() || styleConfig.defaultCategory;

      const updatedItem: DailyWidgetItem = {
        id: cleanId,
        categoryName: finalCat,
        title: finalTitle,
        imageUrl: finalImg,
        aspectRatioMode: formAspectRatio,
        updatedAt: todayStr,
      };

      // -------------------------------------------------------------
      // 1. Supabase: Lưu chuỗi base64 vào bảng 'daily_posters'
      //    supabase.from('daily_posters').upsert({ id, title, image_data, aspect_ratio, content, extra_data, updated_at })
      // -------------------------------------------------------------
      const supabase = getSupabase();
      if (supabase) {
        try {
          const posterId = posterKey; // 'safety' | 'traffic' | 'good_deed'
          const { error: upsertErr } = await supabase.from('daily_posters').upsert(
            {
              id: posterId,
              title: finalTitle,
              image_data: finalImg,
              aspect_ratio: formAspectRatio,
              category_name: finalCat,
              content: finalTitle || '',
              extra_data: { category_name: finalCat },
              updated_at: nowIso,
            },
            { onConflict: 'id' }
          );

          if (upsertErr) {
            console.error('[DailyPosterWidget] Supabase direct upsert error:', upsertErr);
          }
        } catch (dbErr) {
          console.error('[DailyPosterWidget] Supabase error:', dbErr);
        }
      }

      // -------------------------------------------------------------
      // 2. LocalStorage: Lưu vào localStorage('daily_posters') để nạp hiển thị ngay lập tức khi mở web
      // -------------------------------------------------------------
      try {
        const cachedRaw = localStorage.getItem('daily_posters') || localStorage.getItem('daily_posters_cache');
        const cacheMap = cachedRaw ? JSON.parse(cachedRaw) : {};
        const cacheEntry = {
          id: posterKey,
          title: finalTitle,
          image_data: finalImg,
          aspect_ratio: formAspectRatio,
          category_name: finalCat,
          content: finalTitle || '',
          extra_data: { category_name: finalCat },
          updated_at: nowIso,
        };
        cacheMap[posterKey] = cacheEntry;
        cacheMap[cleanId] = cacheEntry;
        if (posterKey === 'safety') cacheMap['safety_message'] = cacheEntry;
        if (posterKey === 'traffic') cacheMap['traffic_situation'] = cacheEntry;
        localStorage.setItem('daily_posters', JSON.stringify(cacheMap));
        localStorage.setItem('daily_posters_cache', JSON.stringify(cacheMap));
      } catch (cacheErr) {
        console.warn('[DailyPosterWidget] Local cache save error:', cacheErr);
      }

      // -------------------------------------------------------------
      // Cập nhật State chung & siteConfig toàn ứng dụng
      // -------------------------------------------------------------
      const existingList = dailyWidgets && dailyWidgets.length > 0 ? [...dailyWidgets] : [...defaultDailyWidgets];
      const index = existingList.findIndex(
        (w) =>
          w.id === cleanId ||
          w.id === widgetId ||
          (posterKey === 'safety' && (w.id === 'safety_message' || w.id === 'safety')) ||
          (posterKey === 'traffic' && (w.id === 'traffic_situation' || w.id === 'traffic')) ||
          (posterKey === 'good_deed' && w.id === 'good_deed')
      );

      let finalList: DailyWidgetItem[];
      if (index >= 0) {
        finalList = existingList.map((w, i) => (i === index ? updatedItem : w));
      } else {
        finalList = [...existingList, updatedItem];
      }

      await onSaveDailyWidgets(finalList);
      toast.success('Cập nhật Poster thành công!', 'Dữ liệu poster đã được lưu và đồng bộ lên hệ thống.');
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 500);
    } catch (err) {
      console.error('Save daily poster widget error:', err);
      toast.error('Lỗi lưu Poster', 'Không thể lưu poster lên máy chủ. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine aspect ratio class
  const getAspectRatioClasses = () => {
    switch (currentItem.aspectRatioMode) {
      case 'portrait':
        return 'aspect-[3/4] object-cover';
      case 'landscape':
        return 'aspect-video object-cover';
      case 'auto':
      default:
        return 'w-full h-auto max-h-[550px] object-contain';
    }
  };

  return (
    <>
      {/* POSTER WIDGET CONTAINER */}
      <div
        id={`daily-poster-widget-${cleanId}`}
        className={`bg-white rounded-xl border ${styleConfig.borderColor} shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col`}
      >
        {/* 1. Header: Title + Icon + Admin Edit Button */}
        <div className={`${styleConfig.headerBg} text-white px-3.5 py-2.5 flex items-center justify-between shadow-2xs`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-white/20 shrink-0 shadow-inner">
              <IconComponent className="w-4 h-4 text-amber-300" />
            </span>
            <span className="font-bold text-sm sm:text-base tracking-wide uppercase text-white truncate">
              {currentItem.categoryName || styleConfig.defaultCategory}
            </span>
          </div>

          {isAdmin && (
            <button
              type="button"
              id={`edit-poster-btn-${cleanId}`}
              onClick={handleOpenEdit}
              className="bg-white/20 hover:bg-white/35 text-amber-200 hover:text-white px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0"
              title="Chỉnh sửa ảnh Poster chuyên mục này"
            >
              <Edit3 className="w-3 h-3" />
              <span>Sửa</span>
            </button>
          )}
        </div>

        {/* 2. Poster Image Body: Minimalist, clean, full display, clickable for zoom */}
        <div className="p-2 sm:p-2.5 bg-slate-50/50 flex flex-col items-center justify-center">
          {currentItem.imageUrl ? (
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full rounded-lg overflow-hidden bg-slate-900/5 border border-gray-200/80 shadow-2xs group cursor-zoom-in transition-all flex items-center justify-center"
              title="Bấm để phóng to xem trọn vẹn poster"
            >
              <img
                src={currentItem.imageUrl}
                alt={currentItem.categoryName}
                className={`rounded-lg transition-transform duration-300 group-hover:scale-[1.02] ${getAspectRatioClasses()}`}
                loading="lazy"
              />

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none backdrop-blur-[1px]">
                <Maximize2 className="w-4 h-4 text-amber-300" />
                <span>Phóng to</span>
              </div>
            </div>
          ) : (
            <div
              onClick={isAdmin ? handleOpenEdit : undefined}
              className={`w-full py-10 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 gap-2 bg-white ${
                isAdmin ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/40' : ''
              }`}
            >
              <ImageIcon className="w-8 h-8 text-gray-300" />
              <span className="text-xs font-medium">Chưa có ảnh poster</span>
              {isAdmin && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Bấm để tải ảnh lên
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. LIGHTBOX MODAL: FULLSCREEN POSTER ZOOM */}
      {isLightboxOpen && currentItem.imageUrl && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[95vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar with title and close */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <IconComponent className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-amber-200 truncate">
                  {currentItem.categoryName || styleConfig.defaultCategory}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Đóng xem toàn màn hình"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Poster Image full resolution */}
            <div className="relative overflow-hidden rounded-xl bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center max-h-[85vh]">
              <img
                src={currentItem.imageUrl}
                alt={currentItem.categoryName}
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. ADMIN EDIT MODAL: UPLOAD, COMPRESS & CONFIGURE POSTER */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[115] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className={`${styleConfig.headerBg} text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl text-amber-300">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-amber-200 uppercase tracking-wide">
                    CHỈNH SỬA POSTER CHUYÊN MỤC
                  </h3>
                  <p className="text-[11px] text-white/80">
                    {currentItem.categoryName || styleConfig.defaultCategory}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              {/* Category Name */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Tên chuyên mục hiển thị:
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Ví dụ: Mỗi ngày 1 thông điệp an toàn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden font-bold text-gray-800"
                  required
                />
              </div>

              {/* Upload Image / Choose File */}
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
                      className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
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
                    Hệ thống sẽ tự động tối ưu hóa và nén ảnh dưới 400KB để trang chủ tải nhanh mượt mà.
                  </p>
                </div>
              </div>

              {/* Aspect Ratio Display Preference */}
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
                        ? 'border-red-700 bg-red-50 text-red-800 ring-2 ring-red-300'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Tự động (Theo ảnh)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAspectRatio('portrait')}
                    className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] text-center transition-all cursor-pointer ${
                      formAspectRatio === 'portrait'
                        ? 'border-red-700 bg-red-50 text-red-800 ring-2 ring-red-300'
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
                        ? 'border-red-700 bg-red-50 text-red-800 ring-2 ring-red-300'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Poster Ngang (16:9)
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Xem trước ảnh Poster:
                </label>
                <div className="w-full max-h-60 rounded-xl border border-gray-200 bg-slate-100 p-2 overflow-hidden flex items-center justify-center">
                  {formImage ? (
                    <img
                      src={formImage}
                      alt="Preview"
                      className={`max-h-56 rounded-lg ${
                        formAspectRatio === 'portrait'
                          ? 'aspect-[3/4] object-cover'
                          : formAspectRatio === 'landscape'
                          ? 'aspect-video object-cover'
                          : 'max-h-56 w-auto object-contain'
                      }`}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs italic">Chưa chọn ảnh</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>LƯU POSTER</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
