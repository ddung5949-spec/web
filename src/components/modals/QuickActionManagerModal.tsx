import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  FileText,
  FolderLock,
  GraduationCap,
  Link,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { PageView, QuickActionCard } from '../../types';

interface QuickActionManagerModalProps {
  cards: QuickActionCard[];
  onSave: (cards: QuickActionCard[]) => void;
  onClose: () => void;
}

const ICON_OPTIONS = [
  { id: 'exam', label: 'Cuộc thi / Huy hiệu', icon: Award },
  { id: 'doc', label: 'Tài liệu / Văn bản', icon: FolderLock },
  { id: 'video', label: 'Bài giảng / Video', icon: GraduationCap },
  { id: 'meeting', label: 'Phòng họp / Biểu quyết', icon: Shield },
  { id: 'book', label: 'Sách báo / Tạp chí', icon: BookOpen },
  { id: 'link', label: 'Liên kết ngoài', icon: Link },
];

const GRADIENT_PRESETS = [
  {
    id: 'red',
    label: 'Đỏ quân kỳ',
    gradient: 'from-red-700 via-red-800 to-rose-900',
    border: 'border-red-500/30',
    text: 'text-yellow-300',
  },
  {
    id: 'green',
    label: 'Xanh lá quân đội',
    gradient: 'from-emerald-800 via-emerald-900 to-teal-950',
    border: 'border-emerald-500/30',
    text: 'text-emerald-200',
  },
  {
    id: 'blue',
    label: 'Xanh dương học tập',
    gradient: 'from-blue-800 via-blue-900 to-indigo-950',
    border: 'border-blue-500/30',
    text: 'text-cyan-200',
  },
  {
    id: 'purple',
    label: 'Tím hồng chính trị',
    gradient: 'from-rose-900 via-pink-900 to-purple-950',
    border: 'border-pink-500/30',
    text: 'text-pink-200',
  },
  {
    id: 'amber',
    label: 'Vàng cam rực rỡ',
    gradient: 'from-amber-700 via-orange-800 to-red-900',
    border: 'border-amber-500/30',
    text: 'text-amber-200',
  },
  {
    id: 'dark',
    label: 'Xám đen cao cấp',
    gradient: 'from-slate-800 via-gray-900 to-zinc-950',
    border: 'border-gray-500/30',
    text: 'text-gray-200',
  },
];

export const QuickActionManagerModal: React.FC<QuickActionManagerModalProps> = ({
  cards,
  onSave,
  onClose,
}) => {
  const [items, setItems] = useState<QuickActionCard[]>(() =>
    cards && cards.length > 0 ? JSON.parse(JSON.stringify(cards)) : []
  );

  React.useEffect(() => {
    if (cards && cards.length > 0) {
      setItems(JSON.parse(JSON.stringify(cards)));
    }
  }, [cards]);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const handleUpdateItem = (id: string, updates: Partial<QuickActionCard>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleAddNewCard = () => {
    const newId = `card-${Date.now()}`;
    const newCard: QuickActionCard = {
      id: newId,
      title: 'TIỆN ÍCH MỚI',
      subtitle: 'Mô tả ngắn gọn nội dung tiện ích',
      iconName: 'exam',
      type: 'external',
      externalUrl: 'https://',
      openNewTab: true,
      bgGradient: 'from-red-700 via-red-800 to-rose-900',
      borderColor: 'border-red-500/30',
      textColor: 'text-yellow-300',
      heightSize: 'md',
      enabled: true,
    };
    setItems((prev) => [...prev, newCard]);
    setEditingCardId(newId);
  };

  const handleDeleteCard = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingCardId === id) setEditingCardId(null);
  };

  const handleSaveAll = () => {
    onSave(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide text-white">
                Quản lý Tiện ích & Cuộc thi trực tuyến
              </h3>
              <p className="text-[11px] text-amber-200/80">
                Tùy chỉnh link điều hướng, kích thước, tiêu đề và màu sắc
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

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              Danh sách các nút tiện ích ({items.length})
            </span>
            <button
              type="button"
              onClick={handleAddNewCard}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm nút tiện ích</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((card, idx) => {
              const isEditing = editingCardId === card.id;
              const IconComp =
                ICON_OPTIONS.find((i) => i.id === card.iconName)?.icon || Award;

              return (
                <div
                  key={card.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden transition-all"
                >
                  {/* Card Row Summary */}
                  <div className="p-3 flex items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-lg bg-linear-to-r ${card.bgGradient || 'from-red-700 to-rose-900'} flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        <IconComp className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs uppercase text-gray-900 truncate">
                            {card.title}
                          </h4>
                          {card.type === 'external' ? (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                              <ExternalLink className="w-2.5 h-2.5" /> Link ngoài
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                              Nội bộ ({card.targetPage})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {card.subtitle || 'Không có mô tả'} • {card.externalUrl || `Trang: ${card.targetPage}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCardId(isEditing ? null : card.id)
                        }
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 cursor-pointer"
                      >
                        {isEditing ? 'Thu gọn' : 'Chỉnh sửa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Xóa nút này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Form */}
                  {isEditing && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Tiêu đề nút (In hoa)
                          </label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) =>
                              handleUpdateItem(card.id, {
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Mô tả phụ
                          </label>
                          <input
                            type="text"
                            value={card.subtitle || ''}
                            onChange={(e) =>
                              handleUpdateItem(card.id, {
                                subtitle: e.target.value,
                              })
                            }
                            placeholder="Ví dụ: Tìm hiểu Đại hội Đảng & Nghị quyết"
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Link Type Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Loại điều hướng
                          </label>
                          <select
                            value={card.type}
                            onChange={(e) =>
                              handleUpdateItem(card.id, {
                                type: e.target.value as 'internal' | 'external',
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-900 outline-hidden"
                          >
                            <option value="external">Liên kết ngoài (URL / Cuộc thi trang khác)</option>
                            <option value="internal">Trang nội bộ hệ thống</option>
                          </select>
                        </div>

                        {card.type === 'external' ? (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Đường dẫn liên kết (URL cuộc thi)
                            </label>
                            <input
                              type="text"
                              value={card.externalUrl || ''}
                              onChange={(e) =>
                                handleUpdateItem(card.id, {
                                  externalUrl: e.target.value,
                                })
                              }
                              placeholder="https://thitructuyen.qdnd.vn"
                              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Trang nội bộ đích
                            </label>
                            <select
                              value={card.targetPage || 'doc'}
                              onChange={(e) =>
                                handleUpdateItem(card.id, {
                                  targetPage: e.target.value as PageView,
                                })
                              }
                              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-900 outline-hidden"
                            >
                              <option value="doc">Thư viện tài liệu văn bản</option>
                              <option value="lecture">Bài giảng & Video số</option>
                              <option value="meeting">Phòng họp Đảng ủy</option>
                              <option value="ctd">Công tác Đảng - CTCT</option>
                              <option value="hl">Huấn luyện - SSCĐ</option>
                              <option value="bac">Học tập theo Bác</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Icon & Height Size Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Biểu tượng (Icon)
                          </label>
                          <select
                            value={card.iconName}
                            onChange={(e) =>
                              handleUpdateItem(card.id, {
                                iconName: e.target.value as any,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-900 outline-hidden"
                          >
                            {ICON_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Kích thước khung (Chiều cao / Padding)
                          </label>
                          <div className="flex items-center gap-2">
                            {(['sm', 'md', 'lg'] as const).map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(card.id, {
                                    heightSize: size,
                                  })
                                }
                                className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                  card.heightSize === size
                                    ? 'bg-red-700 text-white border-red-700'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {size === 'sm' ? 'Nhỏ' : size === 'md' ? 'Vừa' : 'Lớn'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Gradient Preset */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Màu nền hiệu ứng Gradient
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {GRADIENT_PRESETS.map((preset) => {
                            const isSelected = card.bgGradient === preset.gradient;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(card.id, {
                                    bgGradient: preset.gradient,
                                    borderColor: preset.border,
                                    textColor: preset.text,
                                  })
                                }
                                className={`h-8 rounded-lg bg-linear-to-r ${preset.gradient} border-2 flex items-center justify-center transition-transform cursor-pointer ${
                                  isSelected ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                                }`}
                                title={preset.label}
                              >
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-gray-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu tất cả thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
