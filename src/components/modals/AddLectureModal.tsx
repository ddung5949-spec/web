import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FileType,
  HardDriveUpload,
  Laptop,
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
  onClose: () => void;
  onAddLecture: (lec: Omit<LectureItem, 'id'>) => void;
  onUpdateLecture?: (lec: LectureItem) => void;
}

export const AddLectureModal: React.FC<AddLectureModalProps> = ({
  isOpen,
  currentUser,
  lectureToEdit = null,
  onClose,
  onAddLecture,
  onUpdateLecture,
}) => {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('Sĩ quan & QNCN');
  const [desc, setDesc] = useState('');
  const [author, setAuthor] = useState('');
  const [fileType, setFileType] = useState<'powerpoint' | 'word' | 'pdf' | 'excel' | string>(
    'powerpoint'
  );
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('12.5 MB');
  const [fileUrl, setFileUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(lectureToEdit);

  useEffect(() => {
    if (lectureToEdit) {
      setTitle(lectureToEdit.title);
      setTarget(lectureToEdit.target);
      setDesc(lectureToEdit.desc);
      setAuthor(lectureToEdit.author);
      setFileType(lectureToEdit.fileType || 'powerpoint');
      setFileName(lectureToEdit.fileName || '');
      setFileSize(lectureToEdit.fileSize || '10.0 MB');
      setFileUrl(lectureToEdit.fileUrl || '');
    } else {
      setTitle('');
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
      setFileSize('');
      setFileUrl('');
    }
  }, [lectureToEdit, currentUser, isOpen]);

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

    // Convert file to Base64 Data URL for real download
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
    if (!title.trim() || !desc.trim() || !author.trim()) {
      toast.warning('Thiếu thông tin bắt buộc', 'Vui lòng điền đầy đủ các thông tin bài giảng (*)!');
      return;
    }

    const finalFileName =
      fileName.trim() ||
      (fileType === 'powerpoint'
        ? `${title.replace(/\s+/g, '_')}.pptx`
        : fileType === 'word'
        ? `${title.replace(/\s+/g, '_')}.docx`
        : `${title.replace(/\s+/g, '_')}.pdf`);

    const finalFileSize = fileSize.trim() || '8.5 MB';

    if (isEditing && lectureToEdit && onUpdateLecture) {
      onUpdateLecture({
        ...lectureToEdit,
        title: title.trim(),
        target: target.trim(),
        desc: desc.trim(),
        author: author.trim(),
        fileType,
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileUrl: fileUrl || lectureToEdit.fileUrl || '',
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
        title: title.trim(),
        target: target.trim(),
        desc: desc.trim(),
        author: author.trim(),
        date: dateStr,
        fileType,
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileUrl,
        downloads: 0,
      });
      toast.success('Tải lên thành công', 'Đã thêm và tải lên bài giảng điện tử mới thành công!');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-teal-900 text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-teal-400">
          <div className="flex items-center gap-2 font-bold text-teal-200 text-sm">
            <Laptop className="w-4 h-4 text-teal-300" />
            <span>
              {isEditing
                ? 'CHỈNH SỬA BÀI GIẢNG & HỌC LIỆU SỐ'
                : 'TẢI LÊN BÀI GIẢNG ĐIỆN TỬ & GIÁO ÁN'}
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
          {/* File Upload Section (Drag & Drop) */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
              <span>Đính kèm tệp bài giảng (Word, PowerPoint, PDF...) (*):</span>
              <span className="text-[11px] text-teal-700 font-semibold">
                Hỗ trợ .pptx, .docx, .pdf, .xlsx
              </span>
            </label>

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
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
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
                    <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      {fileType === 'powerpoint' ? (
                        <Presentation className="w-5 h-5 text-orange-600" />
                      ) : fileType === 'word' ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : fileType === 'pdf' ? (
                        <FileType className="w-5 h-5 text-red-600" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
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
                      setFileSize('');
                      setFileUrl('');
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                    title="Gỡ tệp này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                  <UploadCloud className="w-7 h-7 text-teal-700" />
                  <p className="font-bold text-gray-800">
                    Bấm để chọn tệp hoặc kéo thả file bài giảng vào đây
                  </p>
                  <p className="text-[11px] text-gray-500">
                    PowerPoint (.pptx), Word (.docx), PDF giáo trình hoặc Excel
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form details */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Tên bài giảng / Giáo án (*):
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Chuyên đề: Phát huy phẩm chất Bộ đội Cụ Hồ..."
              className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-bold text-gray-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Đối tượng huấn luyện (*):
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full p-2 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-medium text-gray-800"
              >
                <option value="Sĩ quan & QNCN">Sĩ quan & QNCN</option>
                <option value="Hạ sĩ quan - Binh sĩ">Hạ sĩ quan - Binh sĩ</option>
                <option value="Chiến sĩ mới">Chiến sĩ mới</option>
                <option value="Đối tượng kết nạp Đảng">Đối tượng kết nạp Đảng</option>
                <option value="Toàn đơn vị">Toàn đơn vị</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Loại định dạng tệp:
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full p-2 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-medium text-gray-800"
              >
                <option value="powerpoint">PowerPoint Presentation (.pptx / .ppt)</option>
                <option value="word">Văn bản Word (.docx / .doc)</option>
                <option value="pdf">Tài liệu PDF (.pdf)</option>
                <option value="excel">Bảng tính Excel (.xlsx)</option>
                <option value="zip">Gói nén tổng hợp (.zip)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Giáo viên / Cơ quan biên soạn (*):
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Cấp bậc - Họ tên - Ban/Phòng"
              className="w-full p-2 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden font-medium text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Mô tả tóm tắt nội dung & hướng dẫn sử dụng (*):
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Gồm slide trình chiếu đa phương tiện, video clip minh họa, bộ câu hỏi trắc nghiệm củng cố bài giảng..."
              className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-teal-700 focus:outline-hidden leading-relaxed text-gray-800"
              required
            />
          </div>

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
              className="bg-teal-800 hover:bg-teal-900 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isEditing ? <Save className="w-3.5 h-3.5" /> : <HardDriveUpload className="w-4 h-4" />}
              <span>{isEditing ? 'LƯU CHỈNH SỬA' : 'TẢI LÊN THƯ VIỆN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
