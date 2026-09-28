import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FileType,
  HardDriveUpload,
  Laptop,
  Link as LinkIcon,
  Paperclip,
  Presentation,
  Save,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { LectureItem, User } from '../../types';
import { toast } from '../Toast';

interface AddLectureModalProps {
  isOpen: boolean;
  currentUser: User | null;
  lectureToEdit?: LectureItem | null;
  categories?: string[];
  onClose: () => void;
  onAddLecture: (lec: Omit<LectureItem, 'id'>) => void;
  onUpdateLecture?: (lec: LectureItem) => void;
}

const DEFAULT_CATEGORIES = [
  'Giáo án Chính trị',
  'Huấn luyện Quân sự',
  'Kỹ thuật Khí tài & Hậu cần',
  'Điều lệnh & Thể lực',
  'Tin học & Chuyển đổi số',
  'Tài liệu bồi dưỡng Sĩ quan',
];

export const AddLectureModal: React.FC<AddLectureModalProps> = ({
  isOpen,
  currentUser,
  lectureToEdit = null,
  categories = DEFAULT_CATEGORIES,
  onClose,
  onAddLecture,
  onUpdateLecture,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Giáo án Chính trị');
  const [target, setTarget] = useState('Sĩ quan & QNCN');
  const [desc, setDesc] = useState('');
  const [author, setAuthor] = useState('');
  const [fileType, setFileType] = useState<'powerpoint' | 'word' | 'pdf' | 'excel' | string>(
    'powerpoint'
  );
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('10.5 MB');
  const [fileUrl, setFileUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(lectureToEdit);

  useEffect(() => {
    if (lectureToEdit) {
      setCode(lectureToEdit.code || `BG-${lectureToEdit.id}`);
      setTitle(lectureToEdit.title);
      setCategory(lectureToEdit.category || categories[0] || 'Giáo án Chính trị');
      setTarget(lectureToEdit.target || 'Sĩ quan & QNCN');
      setDesc(lectureToEdit.desc || '');
      setAuthor(lectureToEdit.author || '');
      setFileType(lectureToEdit.fileType || 'powerpoint');
      setFileName(lectureToEdit.fileName || '');
      setFileSize(lectureToEdit.fileSize || '10.5 MB');
      setFileUrl(lectureToEdit.fileUrl || '');
      setUploadMode(
        lectureToEdit.fileUrl && !lectureToEdit.fileUrl.startsWith('data:') ? 'link' : 'file'
      );
    } else {
      const randomCode = `BG-${Math.floor(100 + Math.random() * 900)}/e95`;
      setCode(randomCode);
      setTitle('');
      setCategory(categories[0] || 'Giáo án Chính trị');
      setTarget('Sĩ quan & QNCN');
      setDesc('');
      setAuthor(
        currentUser
          ? `${currentUser.rank || ''} ${currentUser.fullName}`.trim() +
              (currentUser.position ? ` - ${currentUser.position}` : '')
          : 'Trung tá Nguyễn Văn Thành'
      );
      setFileType('powerpoint');
      setFileName('');
      setFileSize('10.5 MB');
      setFileUrl('');
      setUploadMode('file');
    }
  }, [lectureToEdit, currentUser, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    const name = file.name;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr =
      file.size >= 1024 * 1024
        ? `${sizeInMB} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setFileName(name);
    setFileSize(sizeStr);

    if (!title.trim()) {
      const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;
      setTitle(nameWithoutExt);
    }

    // Detect type from extension
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['ppt', 'pptx', 'pps'].includes(ext)) {
      setFileType('powerpoint');
    } else if (['doc', 'docx'].includes(ext)) {
      setFileType('word');
    } else if (['pdf'].includes(ext)) {
      setFileType('pdf');
    } else if (['xls', 'xlsx'].includes(ext)) {
      setFileType('excel');
    }

    // Convert file to Base64 Data URL for real download & offline persistence
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      toast.warning('Thiếu thông tin bắt buộc', 'Vui lòng điền đầy đủ Tên bài giảng và Giáo viên biên soạn (*)!');
      return;
    }

    const cleanTitle = title.trim();
    const finalCode = code.trim() || `BG-${Date.now().toString().slice(-4)}`;
    const finalFileName =
      fileName.trim() ||
      (fileType === 'powerpoint'
        ? `${finalCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${cleanTitle.slice(0, 30)}.pptx`
        : fileType === 'word'
        ? `${finalCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${cleanTitle.slice(0, 30)}.docx`
        : fileType === 'excel'
        ? `${finalCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${cleanTitle.slice(0, 30)}.xlsx`
        : `${finalCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${cleanTitle.slice(0, 30)}.pdf`);

    const finalFileSize = fileSize.trim() || '10.5 MB';

    if (isEditing && lectureToEdit && onUpdateLecture) {
      onUpdateLecture({
        ...lectureToEdit,
        code: finalCode,
        title: cleanTitle,
        category,
        target: target.trim(),
        desc: desc.trim() || 'Giáo án điện tử và học liệu đa phương tiện phục vụ huấn luyện.',
        author: author.trim(),
        fileType,
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileUrl: fileUrl.trim() || lectureToEdit.fileUrl || '',
      });
      toast.success('Cập nhật thành công', 'Đã cập nhật thông tin và tệp bài giảng thành công!');
    } else {
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${today.getFullYear()}`;

      onAddLecture({
        code: finalCode,
        title: cleanTitle,
        category,
        target: target.trim(),
        desc: desc.trim() || 'Giáo án điện tử và học liệu đa phương tiện phục vụ huấn luyện.',
        author: author.trim(),
        date: dateStr,
        fileType,
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileUrl: fileUrl.trim() || undefined,
        downloads: 0,
      });
      toast.success('Tải lên thành công', 'Đã thêm và lưu trữ bài giảng số vào hệ thống thành công!');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-950 text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <Laptop className="w-4 h-4 text-amber-300" />
            <span>
              {isEditing
                ? 'CHỈNH SỬA BÀI GIẢNG & HỌC LIỆU SỐ'
                : 'TẢI LÊN BÀI GIẢNG ĐIỆN TỬ & GIÁO ÁN SỐ HÓA'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Mã bài giảng & Loại file */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Mã bài giảng / Số hiệu (*):
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: BG-01/CT, BG-12/QS"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-bold text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Loại định dạng tệp (*):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFileType('powerpoint')}
                  className={`py-1.5 px-1 rounded border font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    fileType === 'powerpoint'
                      ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50'
                  }`}
                >
                  <span className="bg-orange-600 text-white px-1.5 py-0.2 rounded text-[10px] font-black">P</span>
                  <span className="text-[10px]">PowerPoint</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFileType('word')}
                  className={`py-1.5 px-1 rounded border font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    fileType === 'word'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50'
                  }`}
                >
                  <span className="bg-blue-700 text-white px-1.5 py-0.2 rounded text-[10px] font-black">W</span>
                  <span className="text-[10px]">Word</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFileType('excel')}
                  className={`py-1.5 px-1 rounded border font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    fileType === 'excel'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
                  }`}
                >
                  <span className="bg-emerald-700 text-white px-1.5 py-0.2 rounded text-[10px] font-black">X</span>
                  <span className="text-[10px]">Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFileType('pdf')}
                  className={`py-1.5 px-1 rounded border font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                    fileType === 'pdf'
                      ? 'bg-red-600 text-white border-red-700 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-red-50'
                  }`}
                >
                  <span className="bg-red-700 text-white px-1.5 py-0.2 rounded text-[10px] font-black">PDF</span>
                  <span className="text-[10px]">PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tên bài giảng / Trích yếu nội dung (*):
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Chuyên đề: Phát huy phẩm chất Bộ đội Cụ Hồ thời kỳ mới..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-bold text-gray-900"
              required
            />
          </div>

          {/* Category & Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Tiểu mục lưu trữ:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-medium text-gray-800"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Đối tượng huấn luyện (*):
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-medium text-gray-800"
              >
                <option value="Sĩ quan & QNCN">Sĩ quan & QNCN</option>
                <option value="Hạ sĩ quan - Binh sĩ">Hạ sĩ quan - Binh sĩ</option>
                <option value="Chiến sĩ mới">Chiến sĩ mới</option>
                <option value="Đối tượng kết nạp Đảng">Đối tượng kết nạp Đảng</option>
                <option value="Toàn đơn vị">Toàn đơn vị</option>
              </select>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Giáo viên / Cơ quan biên soạn (*):
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Cấp bậc - Họ tên - Ban/Phòng (ví dụ: Trung tá Nguyễn Văn Thành - Trưởng ban Tuyên huấn)"
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-medium text-gray-800"
              required
            />
          </div>

          {/* Tệp đính kèm: Chọn từ máy hoặc Dán link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-700 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-teal-700" />
                <span>Tệp bài giảng đính kèm:</span>
              </label>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-teal-700 text-white font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Tải từ máy
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setUploadMode('link')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    uploadMode === 'link'
                      ? 'bg-teal-700 text-white font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Dán link tải / Google Drive
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  accept=".ppt,.pptx,.doc,.docx,.pdf,.xls,.xlsx,.zip"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-3.5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50/80 scale-[1.01]'
                      : fileName
                      ? 'border-teal-400 bg-teal-50/40'
                      : 'border-gray-300 hover:border-teal-600 bg-gray-50/60'
                  }`}
                >
                  {fileName ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          {fileType === 'powerpoint' ? (
                            <Presentation className="w-4 h-4 text-orange-600" />
                          ) : fileType === 'word' ? (
                            <FileText className="w-4 h-4 text-blue-600" />
                          ) : fileType === 'pdf' ? (
                            <FileType className="w-4 h-4 text-red-600" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{fileName}</p>
                          <p className="text-[11px] text-gray-500">
                            Kích thước: <strong>{fileSize}</strong> • Định dạng:{' '}
                            <span className="uppercase font-semibold text-teal-800">
                              {fileType}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileName('');
                          setFileSize('10.5 MB');
                          setFileUrl('');
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                        title="Gỡ tệp này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-1.5">
                      <UploadCloud className="w-6 h-6 text-teal-700" />
                      <p className="font-bold text-gray-800">
                        Bấm để chọn tệp hoặc kéo thả file bài giảng vào đây
                      </p>
                      <p className="text-[11px] text-gray-500">
                        PowerPoint (.pptx), Word (.docx), PDF giáo trình hoặc Excel (.xlsx)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-teal-700 shrink-0" />
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... hoặc link tải trực tiếp"
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-gray-500 font-semibold">Tên tệp hiển thị:</label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Giao_an_chinh_tri.pptx"
                      className="w-full p-1.5 bg-white border border-gray-300 rounded text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 font-semibold">Dung lượng ước lượng:</label>
                    <input
                      type="text"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      placeholder="12.5 MB"
                      className="w-full p-1.5 bg-white border border-gray-300 rounded text-xs mt-0.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Mô tả tóm tắt nội dung & hướng dẫn sử dụng:
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Gồm slide trình chiếu đa phương tiện, video clip minh họa, bộ câu hỏi thảo luận..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden leading-relaxed text-gray-800"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3.5 py-2 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-extrabold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer border border-amber-300 transition-all"
            >
              {isEditing ? <Save className="w-4 h-4 text-teal-900" /> : <HardDriveUpload className="w-4 h-4 text-teal-900" />}
              <span>{isEditing ? 'LƯU CHỈNH SỬA' : '+ TẢI LÊN BÀI GIẢNG / GIÁO ÁN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
