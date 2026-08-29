import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Car,
  HeartHandshake,
  Edit3,
  Calendar,
  Image as ImageIcon,
  Upload,
  Check,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { DailyWidgetItem, User } from '../types';
import { defaultDailyWidgets } from '../data/initialData';

interface DailyWidgetsSectionProps {
  dailyWidgets?: DailyWidgetItem[];
  currentUser: User | null;
  onSaveDailyWidgets: (widgets: DailyWidgetItem[]) => Promise<void> | void;
}

/**
 * Utility: Auto-compress an image using HTML5 Canvas to keep base64 payload light (< 150KB)
 * Max width 900px, JPEG quality 0.75
 */
export function compressImage(file: File, maxWidth = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
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

export const DailyWidgetsSection: React.FC<DailyWidgetsSectionProps> = ({
  dailyWidgets,
  currentUser,
  onSaveDailyWidgets,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Merge with default list to ensure all 3 widgets exist
  const widgets: DailyWidgetItem[] = [
    defaultDailyWidgets[0],
    defaultDailyWidgets[1],
    defaultDailyWidgets[2],
  ].map((def) => {
    const custom = dailyWidgets?.find((w) => w.id === def.id);
    return custom ? { ...def, ...custom } : def;
  });

  // Modal editing state
  const [editingWidget, setEditingWidget] = useState<DailyWidgetItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImage, setFormImage] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = (w: DailyWidgetItem) => {
    setEditingWidget(w);
    setFormTitle(w.title);
    setFormContent(w.content);
    setFormImage(w.imageUrl || '');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImage(file, 900, 0.75);
      setFormImage(compressedBase64);
    } catch (err) {
      console.error('Error compressing image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWidget) return;

    try {
      setIsSaving(true);
      const todayStr = new Date().toLocaleDateString('vi-VN');
      const updatedList = widgets.map((w) =>
        w.id === editingWidget.id
          ? {
              ...w,
              title: formTitle.trim() || w.title,
              content: formContent.trim() || w.content,
              imageUrl: formImage || w.imageUrl,
              updatedAt: todayStr,
            }
          : w
      );

      await onSaveDailyWidgets(updatedList);
      setEditingWidget(null);
    } catch (err) {
      console.error('Save daily widget error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getWidgetConfig = (id: string) => {
    switch (id) {
      case 'safety_message':
        return {
          icon: ShieldAlert,
          badgeColor: 'bg-red-700 text-white',
          headerBg: 'bg-gradient-to-r from-red-800 to-rose-900',
          borderColor: 'border-red-200 hover:border-red-400',
          titleColor: 'text-red-900',
          defaultCategory: 'MỖI NGÀY MỘT THÔNG ĐIỆP AN TOÀN',
        };
      case 'traffic_situation':
        return {
          icon: Car,
          badgeColor: 'bg-amber-600 text-white',
          headerBg: 'bg-gradient-to-r from-amber-700 to-yellow-800',
          borderColor: 'border-amber-200 hover:border-amber-400',
          titleColor: 'text-amber-950',
          defaultCategory: 'MỖI NGÀY MỘT TÌNH HUỐNG GIAO THÔNG',
        };
      case 'good_deed':
      default:
        return {
          icon: HeartHandshake,
          badgeColor: 'bg-emerald-700 text-white',
          headerBg: 'bg-gradient-to-r from-emerald-800 to-teal-900',
          borderColor: 'border-emerald-200 hover:border-emerald-400',
          titleColor: 'text-emerald-950',
          defaultCategory: 'MỖI NGÀY MỘT HÀNH ĐỘNG ĐẸP',
        };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {widgets.map((widget, index) => {
        const config = getWidgetConfig(widget.id);
        const IconComponent = config.icon;

        return (
          <div
            key={widget.id}
            id={`daily-widget-${widget.id}`}
            className={`bg-white rounded-xl border ${config.borderColor} shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col`}
          >
            {/* Widget Header */}
            <div className={`${config.headerBg} text-white px-3.5 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1 rounded bg-white/20 shrink-0">
                  <IconComponent className="w-4 h-4 text-amber-300" />
                </span>
                <span className="font-bold text-sm sm:text-base tracking-wide uppercase text-white truncate">
                  {widget.categoryName || config.defaultCategory}
                </span>
              </div>

              {/* Admin Edit Button */}
              {isAdmin && (
                <button
                  type="button"
                  id={`edit-daily-widget-btn-${widget.id}`}
                  onClick={() => handleOpenEdit(widget)}
                  className="bg-white/20 hover:bg-white/35 text-amber-200 hover:text-white px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  title="Chỉnh sửa nội dung & ảnh chuyên mục này"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa</span>
                </button>
              )}
            </div>

            {/* Widget Content Body */}
            <div className="p-3 flex flex-col gap-2.5">
              {/* Image Frame (16:9 aspect ratio) */}
              {widget.imageUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 border border-gray-200 group">
                  <img
                    src={widget.imageUrl}
                    alt={widget.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Title */}
              <h4 className={`text-[13px] font-bold ${config.titleColor} leading-snug line-clamp-2`}>
                {widget.title}
              </h4>

              {/* Short Quote / Description */}
              <p className="text-xs text-gray-700 leading-relaxed italic bg-gray-50/80 p-2 rounded-md border border-gray-100 line-clamp-3">
                "{widget.content}"
              </p>

              {/* Footer Date */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>Cập nhật: {widget.updatedAt || 'Hôm nay'}</span>
                </span>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Hằng ngày
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Admin Edit Modal */}
      {editingWidget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    Chỉnh sửa chuyên mục hằng ngày
                  </h3>
                  <p className="text-[11px] text-amber-200 font-medium">
                    {editingWidget.categoryName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingWidget(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Tiêu đề thông điệp / tình huống <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nhập tiêu đề nổi bật..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Content / Description */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Nội dung trích dẫn / mô tả ngắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Nhập nội dung thông điệp, hướng dẫn an toàn hoặc hành động đẹp..."
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Image Upload with Auto-Compress */}
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                  Hình ảnh chuyên mục (Tự động nén tối ưu)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isCompressing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Đang nén ảnh...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Chọn ảnh từ thiết bị</span>
                        </>
                      )}
                    </button>

                    {formImage && (
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>

                  {/* Image Preview */}
                  {formImage && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50 mt-2">
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWidget(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
