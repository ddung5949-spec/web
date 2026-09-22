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
import { getSupabase } from '../../utils/supabase';

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  themeColor?: string;
  categories?: any[];
  initialCategories?: any[];
  itemCountByCategory?: Record<string, number>;
  fallbackCategory?: string;
  onSaveCategories?: (categories: any[]) => void | Promise<void>;
  onSave?: (categories: any[]) => void | Promise<void>;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  sectionKey,
  sectionTitle = 'Hệ thống chuyên mục',
  sectionSubtitle,
  themeColor = '#b91c1c',
  categories,
  initialCategories,
  itemCountByCategory = {},
  fallbackCategory = 'Chưa phân loại',
  onSaveCategories,
  onSave,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const sourceCategories = initialCategories || categories || [];
  const [catList, setCatList] = useState<any[]>(sourceCategories);
  const [newCatName, setNewCatName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Helper to extract display name whether item is a string or object
  const getCatName = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.name || item.navName || item.shortLabel || item.id || '';
  };

  // Sync state when opened with updated categories
  React.useEffect(() => {
    const list = initialCategories || categories || [];
    setCatList(list);
    setSaveSuccessMessage(null);
  }, [initialCategories, categories, isOpen]);

  if (!isOpen) return null;

  // Exact handleSave implementing user direct specifications
  const handleSave = async (updatedList = catList) => {
    setIsSaving(true);
    setSaveSuccessMessage(null);

    // Resolve what to save
    let categoriesToSave: any = updatedList;

    // If sectionKey is specified, we are managing subcategories of a section inside full categories_config
    if (sectionKey) {
      try {
        const cachedRaw =
          localStorage.getItem('cached_categories') ||
          localStorage.getItem('cached_site_config') ||
          localStorage.getItem('site_config_cache');
        let fullList: any[] = [];
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            fullList = Array.isArray(parsed)
              ? parsed
              : parsed?.categories_config || parsed?.categories || [];
          } catch {}
        }
        if (Array.isArray(fullList) && fullList.length > 0) {
          const matchIndex = fullList.findIndex(
            (c: any) =>
              (sectionKey && c.id === sectionKey) ||
              c.name === sectionTitle ||
              c.navName === sectionTitle ||
              c.shortLabel === sectionTitle
          );
          if (matchIndex >= 0) {
            fullList[matchIndex] = {
              ...fullList[matchIndex],
              subcategories: updatedList,
              categories: updatedList,
            };
          } else {
            fullList.push({
              id: sectionKey,
              name: sectionTitle,
              navName: sectionTitle,
              targetPage: sectionKey,
              subcategories: updatedList,
              categories: updatedList,
            });
          }
          categoriesToSave = fullList;
        }
      } catch (err) {
        console.warn('[CategoryManagerModal] Section categories merge notice:', err);
      }
    }

    // Filter out any legacy meeting items
    const filterMeeting = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.filter(
        (it) => it && it.id !== 'meeting' && it.targetPage !== 'meeting' && it.sectionKey !== 'meeting'
      );
    };

    const cleanCategoriesToSave = filterMeeting(categoriesToSave);

    try {
      // 1. Gọi TRỰC TIẾP supabase.from('site_config').upsert
      const supabase = getSupabase();
      if (supabase) {
        const { error: upErr } = await supabase
          .from('site_config')
          .upsert(
            {
              id: 'default',
              categories_config: cleanCategoriesToSave,
              navigation_tabs: cleanCategoriesToSave,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (upErr) {
          setIsSaving(false);
          window.alert('Lỗi lưu Database: ' + upErr.message);
          return;
        }
      }

      // 2. Cập nhật đồng thời vào State toàn cục và ghi đè localStorage.setItem('cached_categories', ...)
      localStorage.setItem('cached_categories', JSON.stringify(cleanCategoriesToSave));
      try {
        const cachedSiteCfg = localStorage.getItem('cached_site_config') || localStorage.getItem('site_config_cache');
        if (cachedSiteCfg) {
          const cfg = JSON.parse(cachedSiteCfg);
          cfg.categories_config = cleanCategoriesToSave;
          cfg.navigation_tabs = cleanCategoriesToSave;
          localStorage.setItem('cached_site_config', JSON.stringify(cfg));
          localStorage.setItem('site_config_cache', JSON.stringify(cfg));
        }
      } catch {}

      // 3. Callback props
      if (onSave) await onSave(cleanCategoriesToSave);
      if (onSaveCategories) await onSaveCategories(cleanCategoriesToSave);

      setIsSaving(false);

      // 4. Hiển thị thông báo thành công và đóng modal
      window.alert('✅ Đã lưu và đồng bộ thanh chuyên mục lên hệ thống thành công!');
      onClose();
    } catch (e: any) {
      setIsSaving(false);
      console.error('Error saving categories:', e);
      window.alert('Lỗi lưu Database: ' + (e?.message || 'Lỗi kết nối'));
    }
  };

  const handleManualSave = handleSave;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (catList.some((c) => getCatName(c).toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('Trùng tên danh mục', 'Tên danh mục này đã tồn tại trong danh sách!');
      return;
    }
    const isObjectList = catList.length > 0 && typeof catList[0] === 'object' && catList[0] !== null;
    const newItem = isObjectList
      ? {
          id: 'cat_' + Date.now(),
          name: trimmed,
          navName: trimmed,
          shortLabel: trimmed,
          subcategories: [],
          order: catList.length + 1,
          enabled: true,
        }
      : trimmed;
    const updated = [...catList, newItem];
    setCatList(updated);
    setNewCatName('');
    toast.success('Đã thêm danh mục', `Đã thêm "${trimmed}" vào danh sách. Hãy bấm "Lưu thay đổi" để đồng bộ!`);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(getCatName(catList[index]));
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      toast.warning('Thiếu thông tin', 'Tên danh mục không được để trống!');
      return;
    }
    const oldName = getCatName(catList[index]);
    if (oldName !== trimmed) {
      if (
        catList.some(
          (c, idx) => idx !== index && getCatName(c).toLowerCase() === trimmed.toLowerCase()
        )
      ) {
        toast.warning('Trùng tên danh mục', 'Tên danh mục này đã trùng với một danh mục khác!');
        return;
      }
      const updated = [...catList];
      const cur = updated[index];
      if (typeof cur === 'object' && cur !== null) {
        updated[index] = {
          ...cur,
          name: trimmed,
          navName: trimmed,
          shortLabel: trimmed,
        };
      } else {
        updated[index] = trimmed;
      }
      setCatList(updated);
      if (onRenameCategory) {
        onRenameCategory(oldName, trimmed);
      }
      toast.success('Đã cập nhật danh mục', `Đã đổi tên danh mục thành "${trimmed}".`);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDelete = (index: number) => {
    const item = catList[index];
    const catToDelete = getCatName(item);
    const count =
      typeof item === 'object' && item !== null && Array.isArray(item.subcategories)
        ? item.subcategories.length
        : itemCountByCategory[catToDelete] || 0;

    if (
      window.confirm(
        `Đồng chí có chắc chắn muốn xóa danh mục "${catToDelete}"?\n${
          count > 0
            ? `Hiện có ${count} bài viết/tiểu mục thuộc danh mục này, các mục sẽ được chuyển về "${fallbackCategory}".`
            : ''
        }`
      )
    ) {
      const updated = catList.filter((_, idx) => idx !== index);
      setCatList(updated);
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
  };

  const handleMoveDown = (index: number) => {
    if (index >= catList.length - 1) return;
    const updated = [...catList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setCatList(updated);
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

                    const itemKey = typeof cat === 'string' ? `${cat}-${index}` : `${cat.id || index}-${index}`;
                    const displayName = getCatName(cat);

                    return (
                      <div
                        key={itemKey}
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
                                {displayName}
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
            onClick={() => handleSave()}
            style={{ backgroundColor: themeColor }}
            className="px-5 py-2 text-white font-extrabold rounded-xl hover:opacity-90 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu lên máy chủ...</span>
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

