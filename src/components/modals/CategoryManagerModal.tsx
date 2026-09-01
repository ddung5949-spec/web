import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Edit2,
  FolderArchive,
  FolderPlus,
  Layers,
  Loader2,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from '../Toast';

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionSubtitle?: string;
  themeColor?: string;
  categories: string[];
  itemCountByCategory?: Record<string, number>;
  fallbackCategory?: string;
  onSaveCategories?: (categories: string[]) => void | Promise<void>;
  onSave?: (categories: string[]) => void | Promise<void>;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  sectionTitle,
  sectionSubtitle,
  themeColor = '#b91c1c',
  categories,
  itemCountByCategory = {},
  fallbackCategory = 'Chưa phân loại',
  onSaveCategories,
  onSave,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [catList, setCatList] = useState<string[]>(categories);
  const [newCatName, setNewCatName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync state when opened with updated categories
  React.useEffect(() => {
    setCatList(categories);
    setSaveSuccessMessage(null);
  }, [categories, isOpen]);

  if (!isOpen) return null;

  const handleManualSave = async (updatedList = catList) => {
    setIsSaving(true);
    setSaveSuccessMessage(null);
    try {
      if (onSaveCategories) await onSaveCategories(updatedList);
      if (onSave) await onSave(updatedList);
      setIsSaving(false);
      setSaveSuccessMessage('Đã lưu cấu trúc danh mục thành công vào Cơ sở dữ liệu!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 3500);
    } catch (e) {
      setIsSaving(false);
      console.error('Error saving categories:', e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (catList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('Trùng tên danh mục', 'Tên danh mục này đã tồn tại trong danh sách!');
      return;
    }
    const updated = [...catList, trimmed];
    setCatList(updated);
    handleManualSave(updated);
    setNewCatName('');
    toast.success('Đã thêm danh mục', `Đã thêm danh mục "${trimmed}" thành công!`);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(catList[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      toast.warning('Thiếu thông tin', 'Tên danh mục không được để trống!');
      return;
    }
    const oldName = catList[index];
    if (oldName !== trimmed) {
      if (
        catList.some(
          (c, idx) => idx !== index && c.toLowerCase() === trimmed.toLowerCase()
        )
      ) {
        toast.warning('Trùng tên danh mục', 'Tên danh mục này đã trùng với một danh mục khác!');
        return;
      }
      const updated = [...catList];
      updated[index] = trimmed;
      setCatList(updated);
      handleManualSave(updated);
      if (onRenameCategory) {
        onRenameCategory(oldName, trimmed);
      }
      toast.success('Đã cập nhật danh mục', `Đã đổi tên danh mục thành "${trimmed}".`);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDelete = (index: number) => {
    const catToDelete = catList[index];
    const itemCount = itemCountByCategory[catToDelete] || 0;

    if (
      window.confirm(
        `Đồng chí có chắc chắn muốn xóa danh mục "${catToDelete}"?\n${
          itemCount > 0
            ? `Hiện có ${itemCount} bài viết/tài liệu thuộc danh mục này, các mục sẽ được chuyển về "${fallbackCategory}".`
            : ''
        }`
      )
    ) {
      const updated = catList.filter((_, idx) => idx !== index);
      setCatList(updated);
      handleManualSave(updated);
      if (onDeleteCategory) {
        onDeleteCategory(catToDelete, fallbackCategory);
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...catList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setCatList(updated);
    handleManualSave(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= catList.length - 1) return;
    const updated = [...catList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setCatList(updated);
    handleManualSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          style={{ backgroundColor: themeColor }}
          className="p-4 text-white flex items-center justify-between shadow-xs shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <FolderArchive className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide">
                Quản lý danh mục • {sectionTitle}
              </h3>
              <p className="text-[11px] text-white/80">
                {sectionSubtitle || 'Thêm mới, đổi tên hoặc xóa các danh mục phân loại'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Notification / Success status */}
          {saveSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nhập tên phân loại / danh mục mới..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:border-red-600 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={!newCatName.trim() || isSaving}
              style={{ backgroundColor: themeColor }}
              className="px-3.5 py-2 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>
          </form>

          {/* List of Categories */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 px-1">
              <span>Danh sách danh mục hiện tại ({catList.length})</span>
              <span className="text-[10px] text-gray-400">Số bài / tài liệu</span>
            </div>

            {catList.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Chưa có danh mục nào. Hãy tạo danh mục đầu tiên ở trên.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                {catList.map((cat, index) => {
                  const isEditing = editingIndex === index;
                  const count = itemCountByCategory[cat] || 0;

                  return (
                    <div
                      key={`${cat}-${index}`}
                      className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(index);
                              if (e.key === 'Escape') setEditingIndex(null);
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1 text-xs border-2 border-amber-500 rounded-lg focus:outline-hidden font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(index)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                            title="Lưu đổi tên"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-5 text-center text-xs font-bold text-gray-400">
                              {index + 1}.
                            </span>
                            <span className="text-xs font-bold text-gray-800 truncate">
                              {cat}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {count}
                            </span>

                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 cursor-pointer"
                              title="Di chuyển lên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === catList.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 cursor-pointer"
                              title="Di chuyển xuống"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(index)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Đổi tên danh mục"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa danh mục này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Explicit "Lưu thay đổi danh mục" Button */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleManualSave()}
            style={{ backgroundColor: themeColor }}
            className="px-5 py-2 text-white font-extrabold rounded-xl hover:opacity-90 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu lên CSDL...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi danh mục</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

