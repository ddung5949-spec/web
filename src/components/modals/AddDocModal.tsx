import React, { useState, useEffect, useRef } from 'react';
import {
  FilePlus,
  Save,
  ShieldAlert,
  X,
  Edit3,
  UploadCloud,
  FileText,
  FileType,
  FileSpreadsheet,
  Presentation,
  Archive,
  Check,
  Trash2,
  Paperclip,
  Link as LinkIcon,
} from 'lucide-react';
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
  const [type, setType] = useState<string>('pdf');
  const [secretLevel, setSecretLevel] = useState<'normal' | 'mat' | 'toi_mat'>('normal');

  // File upload states
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingDoc) {
      setCode(editingDoc.code);
      setTitle(editingDoc.title);
      setCategory(editingDoc.category || categories[0] || 'Nghị quyết - Chỉ thị');
      setDescription(editingDoc.description || '');
      setIssuer(editingDoc.issuer || 'Bộ Tư lệnh Sư đoàn 10');
      setType(editingDoc.type || 'pdf');
      setSecretLevel(editingDoc.secretLevel || 'normal');
      setFileName(editingDoc.fileName || '');
      setFileSize(editingDoc.fileSize || '');
      setFileUrl(editingDoc.fileUrl || '');
      setUseCustomUrl(Boolean(editingDoc.fileUrl && !editingDoc.fileUrl.startsWith('data:')));
    } else {
      setCode('');
      setTitle('');
      setCategory(categories[0] || 'Nghị quyết - Chỉ thị');
      setDescription('');
      setIssuer('Phòng Chính trị - Sư đoàn 10');
      setType('pdf');
      setSecretLevel('normal');
      setFileName('');
      setFileSize('');
      setFileUrl('');
      setUseCustomUrl(false);
    }
  }, [editingDoc, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    const name = file.name;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr =
      file.size >= 1024 * 1024
        ? `${sizeInMB} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setFileName(name);
    setFileSize(sizeStr);

    // Auto infer title or code if empty
    if (!title) {
      const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;
      setTitle(nameWithoutExt);
    }

    // Detect format type from extension
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['doc', 'docx'].includes(ext)) {
      setType('docx');
    } else if (['xls', 'xlsx'].includes(ext)) {
      setType('xlsx');
    } else if (['ppt', 'pptx'].includes(ext)) {
      setType('pptx');
    } else if (['zip', 'rar', '7z'].includes(ext)) {
      setType('zip');
    } else {
      setType('pdf');
    }

    // Convert file to Base64 Data URL for real in-browser & DB persistence
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileSize('');
    setFileUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !issuer.trim()) {
      alert('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)!');
      return;
    }

    const cleanCode = code.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const autoFileName = fileName.trim() || `${cleanCode}_${type}.${type}`;
    const autoFileSize = fileSize.trim() || '1.8 MB';

    if (editingDoc && onUpdateDoc) {
      onUpdateDoc({
        ...editingDoc,
        code: code.trim(),
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        issuer: issuer.trim(),
        type,
        fileName: autoFileName,
        fileSize: autoFileSize,
        fileUrl: fileUrl.trim() || editingDoc.fileUrl || undefined,
        secretLevel,
      });
      alert('Đã cập nhật thông tin văn bản thành công!');
    } else {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1
      ).padStart(2, '0')}/${now.getFullYear()}`;

      onAddDoc({
        code: code.trim(),
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        issuer: issuer.trim(),
        date: dateStr,
        type,
        fileName: autoFileName,
        fileSize: autoFileSize,
        fileUrl: fileUrl.trim() || undefined,
        downloads: 0,
        secretLevel,
      });
      alert('Đã lưu văn bản vào Kho lưu trữ điện tử thành công!');
    }

    onClose();
  };

  const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const getFormatIcon = () => {
    switch (type) {
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'pptx':
      case 'ppt':
        return <Presentation className="w-5 h-5 text-orange-600" />;
      case 'zip':
      case 'rar':
        return <Archive className="w-5 h-5 text-purple-600" />;
      case 'pdf':
      default:
        return <FileType className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white p-3.5 px-5 flex items-center justify-between shrink-0 border-b-2 border-amber-400">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            {editingDoc ? <Edit3 className="w-4 h-4 text-amber-300" /> : <FilePlus className="w-4 h-4 text-amber-300" />}
            <span>{editingDoc ? 'HIỆU CHỈNH THÔNG TIN VĂN BẢN' : 'LƯU TRỮ VĂN BẢN & TẢI TỆP TIN MỚI'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* 1. Tải tệp tin đính kèm */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-700" />
                <span>TỆP TIN VĂN BẢN (.pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .zip, .rar)</span>
              </label>
              <button
                type="button"
                onClick={() => setUseCustomUrl(!useCustomUrl)}
                className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{useCustomUrl ? 'Tải tệp trực tiếp' : 'Nhập Link Storage'}</span>
              </button>
            </div>

            {useCustomUrl ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/... hoặc link trực tiếp"
                  className="w-full text-xs p-2.5 border border-blue-300 rounded-lg focus:border-blue-600 focus:outline-hidden bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Tên tệp (ví dụ: QuyDinh128.pdf)"
                    className="text-xs p-2 border border-blue-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="Dung lượng (ví dụ: 3.2 MB)"
                    className="text-xs p-2 border border-blue-300 rounded bg-white"
                  />
                </div>
              </div>
            ) : fileName ? (
              <div className="bg-white border border-blue-300 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-blue-100/60 rounded-md shrink-0">
                    {getFormatIcon()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-xs truncate">{fileName}</p>
                    <p className="text-[11px] text-gray-500">{fileSize || 'Kích thước chuẩn'} • Sẵn sàng tải về</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  title="Xóa tệp này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-600 bg-blue-100/50'
                    : 'border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                <p className="font-bold text-blue-900 text-xs">
                  Nhấp để chọn tệp từ máy tính hoặc kéo thả vào đây
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Hỗ trợ: PDF, Word (DOCX/DOC), PowerPoint (PPT/PPTX), Excel (XLS/XLSX), ZIP/RAR
                </p>
              </div>
            )}
          </div>

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
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden font-bold text-red-800 bg-white"
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
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden bg-white font-bold text-gray-800"
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
              placeholder="Về việc triển khai công tác giáo dục chính trị, sẵn sàng chiến đấu..."
              className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tóm tắt nội dung chính / Hướng dẫn thực hiện:
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Tóm tắt yêu cầu, phạm vi thi hành, thời hạn báo cáo đối với các cơ quan, đơn vị..."
              className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden bg-white"
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
              className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Định dạng tệp:
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden bg-white"
              >
                <option value="pdf">Tài liệu PDF (.pdf)</option>
                <option value="docx">Văn bản Word (.docx)</option>
                <option value="doc">Văn bản Word cũ (.doc)</option>
                <option value="xlsx">Bảng tính Excel (.xlsx)</option>
                <option value="xls">Bảng tính Excel (.xls)</option>
                <option value="pptx">PowerPoint (.pptx)</option>
                <option value="ppt">PowerPoint (.ppt)</option>
                <option value="zip">Tệp nén (.zip)</option>
                <option value="rar">Tệp nén (.rar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Độ mật văn bản:
              </label>
              <select
                value={secretLevel}
                onChange={(e) => setSecretLevel(e.target.value as any)}
                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden bg-white"
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
              <span>{editingDoc ? 'Lưu cập nhật' : 'Lưu vào Kho văn bản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
