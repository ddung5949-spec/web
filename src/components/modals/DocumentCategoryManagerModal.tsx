import React, { useState } from 'react';
import {
  Edit2,
  FolderArchive,
  FolderPlus,
  Plus,
  Save,
  Trash2,
  X,
  Check,
  ArrowUpDown,
  Tag,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { toast } from '../Toast';

interface DocumentCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  documents: DocumentItem[];
  onSaveCategories?: (categories: string[]) => void | Promise<void>;
  onSave?: (categories: string[]) => void | Promise<void>;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

export const DocumentCategoryManagerModal: React.FC<DocumentCategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  documents,
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
      setSaveSuccessMessage('Đã lưu cấu trúc danh mục văn bản thành công vào Cơ sở dữ liệu!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 3500);
    } catch (e) {
      setIsSaving(false);
      console.error('Error saving doc categories:', e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (catList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('Trùng tên danh mục', 'Tên danh mục này đã tồn tại!');
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
    const docCount = documents.filter((d) => d.category === catToDelete).length;

    if (
      window.confirm(
        `Đồng chí có chắc chắn muốn xóa danh mục "${catToDelete}"?${
          docCount > 0
            ? ` Hiện có ${docCount} văn bản thuộc danh mục này, các văn bản sẽ được chuyển về "Văn bản khác".`
            : ''
        }`
      )
    ) {
      const updated = catList.filter((_, idx) => idx !== index);
      setCatList(updated);
      handleManualSave(updated);
      if (onDeleteCategory) {
        onDeleteCategory(catToDelete, 'Văn bản khác');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 rounded-lg text-amber-300 border border-amber-300/30">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-300 uppercase tracking-wide">
                QUẢN LÝ DANH MỤC & PHÂN LOẠI VĂN BẢN
              </h3>
              <p className="text-[11px] text-blue-100">
                Thêm mới, đổi tên hoặc xóa các tủ phân loại văn kiện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Notification / Success status */}
          {saveSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleAdd} className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2">
            <label className="block font-bold text-blue-950">
              Thêm danh mục phân loại mới:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ví dụ: Chỉ thị tác chiến, Hướng dẫn Quân y, Quy chế thi đua..."
                className="flex-1 p-2 bg-white border border-blue-300 rounded-lg font-bold text-gray-900 focus:outline-hidden focus:border-blue-700 text-xs"
              />
              <button
                type="submit"
                disabled={!newCatName.trim() || isSaving}
                className="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
          </form>

          {/* List of categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold px-1">
              <span>DANH SÁCH TIỂU MỤC ({catList.length})</span>
              <span>SỐ VĂN BẢN TRONG MỤC</span>
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
              {catList.map((cat, index) => {
                const docCount = documents.filter(
                  (d) => d.category?.toLowerCase() === cat.toLowerCase()
                ).length;
                const isEditing = editingIndex === index;

                return (
                  <div
                    key={index}
                    className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2 hover:bg-gray-100/80 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 p-1.5 bg-white border border-blue-500 rounded-md font-bold text-gray-900 text-xs focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(index)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
                          title="Lưu thay đổi tên"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md cursor-pointer"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="font-bold text-gray-800 truncate">{cat}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                            {docCount} VB
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(index)}
                            className="p-1 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                            title="Đổi tên danh mục"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(index)}
                            className="p-1 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Xóa danh mục"
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
          </div>

          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Khi đổi tên danh mục, hệ thống sẽ tự động cập nhật lại phân loại cho tất cả các văn bản hiện có thuộc danh mục đó.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 text-xs shrink-0">
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
            className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-extrabold rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all"
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
