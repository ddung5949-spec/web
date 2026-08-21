import React, { useState, useEffect } from 'react';
import { FilePlus, Save, ShieldAlert, X, Edit3 } from 'lucide-react';
import { DocumentItem } from '../../types';

interface AddDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: string[];
  editingDoc?: DocumentItem | null;
  onAddDoc: (doc: Omit<DocumentItem, 'id'>) => void;
  onUpdateDoc?: (doc: DocumentItem) => void;
}

const DEFAULT_CATEGORIES = [
  'Nghị quyết - Chỉ thị',
  'Kế hoạch - Mệnh lệnh tác chiến',
  'Hướng dẫn CTĐ - CTCT',
  'Quy định - Điều lệnh & Kỷ luật',
  'Hậu cần - Kỹ thuật & Quân y',
  'Biểu mẫu & Báo cáo số',
  'Văn bản khác',
];

export const AddDocModal: React.FC<AddDocModalProps> = ({
  isOpen,
  onClose,
  categories = DEFAULT_CATEGORIES,
  editingDoc,
  onAddDoc,
  onUpdateDoc,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Nghị quyết - Chỉ thị');
  const [description, setDescription] = useState('');
  const [issuer, setIssuer] = useState('Phòng Chính trị - Sư đoàn 10');
  const [type, setType] = useState<'pdf' | 'docx' | 'xlsx' | 'pptx'>('pdf');
  const [secretLevel, setSecretLevel] = useState<'normal' | 'mat' | 'toi_mat'>('normal');

  useEffect(() => {
    if (editingDoc) {
      setCode(editingDoc.code);
      setTitle(editingDoc.title);
      setCategory(editingDoc.category || categories[0] || 'Nghị quyết - Chỉ thị');
      setDescription(editingDoc.description || '');
      setIssuer(editingDoc.issuer || 'Bộ Tư lệnh Sư đoàn 10');
      setType(
        editingDoc.type === 'docx' || editingDoc.type === 'xlsx' || editingDoc.type === 'pptx'
          ? editingDoc.type
          : 'pdf'
      );
      setSecretLevel(editingDoc.secretLevel || 'normal');
    } else {
      setCode('');
      setTitle('');
      setCategory(categories[0] || 'Nghị quyết - Chỉ thị');
      setDescription('');
      setIssuer('Phòng Chính trị - Sư đoàn 10');
      setType('pdf');
      setSecretLevel('normal');
    }
  }, [editingDoc, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !issuer.trim()) {
      alert('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)!');
      return;
    }

    const cleanCode = code.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const autoFileName = `${cleanCode}_${type}.${type === 'docx' ? 'docx' : type === 'xlsx' ? 'xlsx' : type === 'pptx' ? 'pptx' : 'pdf'}`;

    if (editingDoc && onUpdateDoc) {
      onUpdateDoc({
        ...editingDoc,
        code: code.trim(),
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        issuer: issuer.trim(),
        type,
        fileName: editingDoc.fileName || autoFileName,
        secretLevel,
      });
      alert('Đã cập nhật thông tin văn bản thành công!');
    } else {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      onAddDoc({
        code: code.trim(),
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        issuer: issuer.trim(),
        date: dateStr,
        type,
        fileName: autoFileName,
        fileSize: '2.5 MB',
        downloads: 0,
        secretLevel,
      });
      alert('Đã lưu văn bản vào Kho lưu trữ điện tử thành công!');
    }

    onClose();
  };

  const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white p-3.5 px-5 flex items-center justify-between shrink-0 border-b-2 border-amber-400">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            {editingDoc ? <Edit3 className="w-4 h-4 text-amber-300" /> : <FilePlus className="w-4 h-4 text-amber-300" />}
            <span>{editingDoc ? 'HIỆU CHỈNH THÔNG TIN VĂN BẢN' : 'LƯU TRỮ VĂN BẢN - CHỈ THỊ MỚI'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số / Ký hiệu văn bản (*):
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: 128/CT-PCT, 45/KH-f10..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:border-blue-600 focus:outline-hidden font-bold text-red-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tiểu mục phân loại (*):
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-gray-300 rounded focus:border-blue-600 focus:outline-hidden bg-white font-bold text-gray-800"
              >
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Trích yếu nội dung văn bản (*):
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              placeholder="Về việc triển khai công tác giáo dục chính trị..."
              className="w-full text-xs p-2 border border-gray-300 rounded focus:border-blue-600 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tóm tắt nội dung chính / Ghi chú thực hiện:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Tóm tắt yêu cầu, phạm vi thi hành, thời hạn báo cáo..."
              className="w-full text-xs p-2 border border-gray-300 rounded focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Cơ quan ban hành (*):
            </label>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded focus:border-blue-600 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Định dạng tệp đính kèm:
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs p-2 border border-gray-300 rounded focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="pdf">Tài liệu PDF (.pdf)</option>
                <option value="docx">Văn bản Word (.docx)</option>
                <option value="xlsx">Bảng tính Excel (.xlsx)</option>
                <option value="pptx">PowerPoint (.pptx)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Độ mật văn bản:
              </label>
              <select
                value={secretLevel}
                onChange={(e) => setSecretLevel(e.target.value as any)}
                className="w-full text-xs p-2 border border-gray-300 rounded focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="normal">Lưu hành nội bộ (Thường)</option>
                <option value="mat">Văn bản Mật</option>
                <option value="toi_mat">Văn bản Tối mật</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu văn bản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
