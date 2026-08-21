import React, { useState } from 'react';
import { Bell, Check, Edit2, Plus, Trash2, X } from 'lucide-react';
import { HomeAnnouncement } from '../../types';

interface HomeAnnouncementManagerModalProps {
  isOpen: boolean;
  announcements: HomeAnnouncement[];
  onClose: () => void;
  onSaveAnnouncements: (updatedList: HomeAnnouncement[]) => void;
}

export const HomeAnnouncementManagerModal: React.FC<HomeAnnouncementManagerModalProps> = ({
  isOpen,
  announcements,
  onClose,
  onSaveAnnouncements,
}) => {
  const [list, setList] = useState<HomeAnnouncement[]>(announcements || []);
  const [editingItem, setEditingItem] = useState<HomeAnnouncement | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [highlightInput, setHighlightInput] = useState(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    setEditingItem({
      id: `ann-${Date.now()}`,
      title: '',
      date: todayStr,
      highlight: false,
    });
    setTitleInput('');
    setDateInput(todayStr);
    setHighlightInput(false);
  };

  const handleStartEdit = (item: HomeAnnouncement) => {
    setEditingItem(item);
    setTitleInput(item.title);
    setDateInput(item.date || '');
    setHighlightInput(!!item.highlight);
  };

  const handleSaveCurrentItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !editingItem) return;

    const newItem: HomeAnnouncement = {
      ...editingItem,
      title: titleInput.trim(),
      date: dateInput.trim() || undefined,
      highlight: highlightInput,
    };

    const exists = list.some((i) => i.id === newItem.id);
    const updatedList = exists
      ? list.map((i) => (i.id === newItem.id ? newItem : i))
      : [newItem, ...list];

    setList(updatedList);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setList((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveAll = () => {
    onSaveAnnouncements(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-700 via-amber-800 to-red-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Quản lý Dải thông báo & Sự kiện</h3>
              <p className="text-[11px] text-amber-200/80">Hiển thị ở cột giữa trang chủ (dưới slider)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {editingItem ? (
            <form onSubmit={handleSaveCurrentItem} className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
              <h4 className="font-bold text-xs uppercase text-amber-900">
                {list.some((i) => i.id === editingItem.id) ? 'Sửa thông báo' : 'Thêm thông báo mới'}
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung thông báo / Tiêu đề sự kiện *
                </label>
                <textarea
                  rows={3}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="VD: Kết quả Cuộc thi tìm hiểu trực tuyến Đại hội XIV của Đảng..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-amber-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ngày thông báo</label>
                  <input
                    type="text"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    placeholder="VD: 19/08/2026"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.checked)}
                      className="rounded text-amber-600 w-4 h-4"
                    />
                    <span>Ghim nổi bật (Khung vàng đậm)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 cursor-pointer"
                >
                  Lưu vào danh sách
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleStartAdd}
              className="w-full py-2.5 px-3 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl text-amber-900 font-bold text-xs bg-amber-50/50 hover:bg-amber-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>+ Thêm thông báo mới</span>
            </button>
          )}

          {/* List of announcements */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-600 uppercase">Danh sách thông báo hiện hành:</h4>
            {list.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 transition-colors ${
                  item.highlight
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                      #{idx + 1}
                    </span>
                    {item.date && (
                      <span className="text-[10px] text-gray-500 font-medium">{item.date}</span>
                    )}
                    {item.highlight && (
                      <span className="text-[9px] font-black uppercase text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                        Nổi bật
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">
                    {item.title}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1 text-gray-500 hover:text-amber-800 hover:bg-amber-100 rounded cursor-pointer"
                    title="Sửa thông báo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">Tổng cộng {list.length} thông báo</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-linear-to-r from-red-700 to-amber-800 hover:from-red-800 hover:to-amber-900 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
