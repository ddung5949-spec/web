import React, { useRef, useState } from 'react';
import {
  Calendar,
  Camera,
  Check,
  Clock,
  Edit3,
  FileImage,
  FolderArchive,
  FolderPlus,
  FolderUp,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { UncleHoQuote, UncleHoSettings } from '../../types';
import { compressImageFile, validateImageFile } from '../../utils/imageUtils';

interface UncleHoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: UncleHoQuote[];
  settings: UncleHoSettings;
  onSaveQuotes: (quotes: UncleHoQuote[]) => void;
  onSaveSettings: (settings: UncleHoSettings) => void;
}

export const UncleHoManagerModal: React.FC<UncleHoManagerModalProps> = ({
  isOpen,
  onClose,
  quotes,
  settings,
  onSaveQuotes,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'schedule' | 'upload_folder' | 'quote_list' | 'add_quote'>('schedule');

  // Settings local state
  const [localSettings, setLocalSettings] = useState<UncleHoSettings>(settings);

  // Form local state for add/edit quote
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [formDayMonth, setFormDayMonth] = useState('19/08');
  const [formYear, setFormYear] = useState('1945');
  const [formQuote, setFormQuote] = useState('');
  const [formContext, setFormContext] = useState('');
  const [formLesson, setFormLesson] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  // Folder upload batch state
  const [uploadedFolderImages, setUploadedFolderImages] = useState<{ name: string; url: string }[]>([]);
  const [folderBatchName, setFolderBatchName] = useState('Thư mục ảnh tư liệu Bác Hồ');
  const [folderTargetDate, setFolderTargetDate] = useState('19/08');
  const [searchQuoteTerm, setSearchQuoteTerm] = useState('');
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);

  // Handle Save Settings
  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    alert('Đã cập nhật cấu hình tự động đăng "Lời Bác dạy ngày này năm xưa" thành công!');
  };

  // Handle Form Image File Upload (Single / Multiple)
  const handleFormImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingUpload(true);
      const fileList: File[] = Array.from(files);
      const newCompressedUrls: string[] = [];

      for (const file of fileList) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          alert(validation.error || `Tệp ${file.name} không hợp lệ.`);
          continue;
        }
        const dataUrl = await compressImageFile(file, 1280, 1280, 0.82);
        newCompressedUrls.push(dataUrl);
      }

      if (newCompressedUrls.length > 0) {
        setFormImages((prev) => [...prev, ...newCompressedUrls]);
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể xử lý hình ảnh. Vui lòng thử lại.');
    } finally {
      setIsProcessingUpload(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle Folder Upload via input
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingFolder(true);
      const newImgs: { name: string; url: string }[] = [];
      const fileList: File[] = Array.from(files);

      for (const file of fileList) {
        if (file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp)$/i)) {
          try {
            const dataUrl = await compressImageFile(file, 1280, 1280, 0.80);
            newImgs.push({
              name: file.name,
              url: dataUrl,
            });
          } catch {
            // Ignore unreadable image
          }
        }
      }

      if (newImgs.length > 0) {
        setUploadedFolderImages((prev) => [...prev, ...newImgs]);
        alert(`Đã tối ưu hóa và nạp thành công ${newImgs.length} ảnh tư liệu từ thư mục.`);
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi đọc thư mục hình ảnh.');
    } finally {
      setIsProcessingFolder(false);
      if (e.target) e.target.value = '';
    }
  };

  // Apply uploaded folder images to target date
  const handleApplyFolderToDate = () => {
    if (uploadedFolderImages.length === 0) {
      alert('Vui lòng chọn hoặc tải thư mục ảnh lên trước.');
      return;
    }

    const targetDay = folderTargetDate.trim();
    if (!targetDay) {
      alert('Vui lòng nhập ngày/tháng áp dụng (DD/MM).');
      return;
    }

    const imageUrls = uploadedFolderImages.map((img) => img.url);

    const existsIndex = quotes.findIndex((q) => q.dayMonth === targetDay);
    let updatedQuotes = [...quotes];

    if (existsIndex >= 0) {
      updatedQuotes[existsIndex] = {
        ...updatedQuotes[existsIndex],
        images: [...(updatedQuotes[existsIndex].images || []), ...imageUrls],
      };
    } else {
      updatedQuotes.push({
        id: `custom-${Date.now()}`,
        dayMonth: targetDay,
        yearRecorded: '1945',
        quote: 'Dân ta xin nhớ chữ đồng: Đồng tình, đồng sức, đồng lòng, đồng minh.',
        context: 'Chủ tịch Hồ Chí Minh căn dặn toàn dân, toàn quân đoàn kết vượt qua mọi khó khăn thử thách.',
        lesson: 'Cán bộ, chiến sĩ Sư đoàn 10 luôn nêu cao tinh thần đoàn kết nội bộ, thi đua Quyết thắng.',
        images: imageUrls,
        publishTime: localSettings.dailyPostTime || '06:00',
        status: 'active',
        isAutoPublish: true,
      });
    }

    onSaveQuotes(updatedQuotes);
    alert(`Đã gán ${uploadedFolderImages.length} ảnh tư liệu vào bài Lời Bác dạy ngày ${targetDay} thành công!`);
  };

  // Start editing a quote
  const handleStartEditQuote = (q: UncleHoQuote) => {
    setEditingQuoteId(q.id);
    setFormDayMonth(q.dayMonth);
    setFormYear(q.yearRecorded || '1945');
    setFormQuote(q.quote);
    setFormContext(q.context);
    setFormLesson(q.lesson);
    setFormImages(q.images || []);
    setActiveTab('add_quote');
  };

  // Reset form for adding new quote
  const handleStartAddNewQuote = () => {
    setEditingQuoteId(null);
    setFormDayMonth('24/08');
    setFormYear('1945');
    setFormQuote('');
    setFormContext('');
    setFormLesson('');
    setFormImages([]);
    setActiveTab('add_quote');
  };

  // Submit add/edit quote form
  const handleSaveQuoteForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDayMonth.trim() || !formQuote.trim()) {
      alert('Vui lòng nhập đầy đủ ngày/tháng và nội dung Lời Bác dạy!');
      return;
    }

    let updatedQuotes = [...quotes];
    if (editingQuoteId) {
      updatedQuotes = updatedQuotes.map((q) =>
        q.id === editingQuoteId
          ? {
              ...q,
              dayMonth: formDayMonth.trim(),
              yearRecorded: formYear.trim() || undefined,
              quote: formQuote.trim(),
              context: formContext.trim(),
              lesson: formLesson.trim(),
              images: formImages.length > 0 ? formImages : q.images,
            }
          : q
      );
    } else {
      const newQuote: UncleHoQuote = {
        id: `quote-${Date.now()}`,
        dayMonth: formDayMonth.trim(),
        yearRecorded: formYear.trim() || undefined,
        quote: formQuote.trim(),
        context: formContext.trim(),
        lesson: formLesson.trim(),
        images:
          formImages.length > 0
            ? formImages
            : ['https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop'],
        publishTime: localSettings.dailyPostTime || '06:00',
        status: 'active',
        isAutoPublish: true,
      };
      updatedQuotes.push(newQuote);
    }

    onSaveQuotes(updatedQuotes);
    alert('Đã lưu bài viết Lời Bác dạy ngày này năm xưa thành công!');
    setActiveTab('quote_list');
  };

  // Delete a quote
  const handleDeleteQuote = (id: string) => {
    if (confirm('Đồng chí có chắc chắn muốn xóa bài Lời Bác dạy này?')) {
      const updated = quotes.filter((q) => q.id !== id);
      onSaveQuotes(updated);
    }
  };

  const filteredQuotes = quotes.filter(
    (q) =>
      q.dayMonth.includes(searchQuoteTerm.trim()) ||
      q.quote.toLowerCase().includes(searchQuoteTerm.toLowerCase()) ||
      q.context.toLowerCase().includes(searchQuoteTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-red-900 via-red-800 to-amber-900 text-white p-4 px-6 flex items-center justify-between shrink-0 border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-300 uppercase tracking-wide">
                QUẢN LÝ CHUYÊN MỤC "LỜI BÁC DẠY NGÀY NÀY NĂM XƯA"
              </h3>
              <p className="text-[11px] text-amber-100/80">
                Thiết lập tự động đăng hằng ngày • Tải thư mục ảnh tư liệu • Soạn thảo nội dung theo ngày
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-red-700 text-red-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>1. Thiết lập Tự động đăng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload_folder')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'upload_folder'
                ? 'border-red-700 text-red-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>2. Tải cả Folder ảnh lên</span>
            {uploadedFolderImages.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {uploadedFolderImages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quote_list')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'quote_list'
                ? 'border-red-700 text-red-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3. Danh sách ngày ({quotes.length})</span>
          </button>

          <button
            type="button"
            onClick={handleStartAddNewQuote}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'add_quote'
                ? 'border-red-700 text-red-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>{editingQuoteId ? 'Chỉnh sửa bài' : '+ Soạn bài mới'}</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 text-xs space-y-4">
          {/* TAB 1: SCHEDULE & AUTO PUBLISH */}
          {activeTab === 'schedule' && (
            <form onSubmit={handleSaveSettingsSubmit} className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-900 block mb-0.5">
                      Bật tính năng tự động đăng Lời Bác dạy hằng ngày
                    </label>
                    <p className="text-[11px] text-gray-600">
                      Hệ thống sẽ tự động đối soát ngày hiện tại của năm (DD/MM) và cập nhật bài giảng tư tưởng tương ứng vào đúng khung giờ chỉ định.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoPostEnabled}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        autoPostEnabled: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 accent-red-700 rounded cursor-pointer shrink-0 mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-red-700" />
                      <span>Khung giờ tự động đăng hàng ngày:</span>
                    </label>
                    <input
                      type="time"
                      value={localSettings.dailyPostTime || '06:00'}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          dailyPostTime: e.target.value,
                        }))
                      }
                      className="w-full text-xs font-bold p-2 border border-gray-300 rounded-lg bg-white focus:border-red-700 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Gợi ý: 06:00 sáng trước giờ báo thức và sinh hoạt chính trị sáng.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-700" />
                      <span>Chế độ hiển thị ngày:</span>
                    </label>
                    <select
                      value={localSettings.autoSelectToday ? 'auto' : 'manual'}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          autoSelectToday: e.target.value === 'auto',
                        }))
                      }
                      className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white focus:border-red-700 focus:outline-hidden font-medium"
                    >
                      <option value="auto">Tự động chọn theo ngày thực tế (Hôm nay)</option>
                      <option value="manual">Cho phép chọn thủ công ngày bất kỳ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status summary preview */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Trạng thái hoạt động hiện tại:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="text-gray-500 block">Số bài tư liệu đã có:</span>
                    <strong className="text-red-800 text-xs">{quotes.length} ngày</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="text-gray-500 block">Tự động đăng:</span>
                    <strong className={localSettings.autoPostEnabled ? 'text-emerald-700' : 'text-gray-500'}>
                      {localSettings.autoPostEnabled ? 'ĐANG BẬT' : 'TẮT'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="text-gray-500 block">Giờ đăng hằng ngày:</span>
                    <strong className="text-blue-800 text-xs">{localSettings.dailyPostTime || '06:00'} hàng ngày</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-red-800 hover:bg-red-900 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu cấu hình tự động đăng</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: UPLOAD ENTIRE FOLDER */}
          {activeTab === 'upload_folder' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-blue-800" />
                  <div>
                    <h4 className="font-bold text-xs text-blue-950 uppercase">
                      Tải lên trọn bộ thư mục ảnh tư liệu Bác Hồ
                    </h4>
                    <p className="text-[11px] text-blue-800/80">
                      Cho phép chọn một thư mục trên máy tính để tải hàng loạt ảnh tư liệu lịch sử và tự động gán vào chuyên mục.
                    </p>
                  </div>
                </div>

                {/* Upload Inputs (Both Directory and Multi-files) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Folder picker */}
                  <label className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2">
                    <FolderUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <span className="font-bold text-xs text-blue-900 block">
                        Chọn CẢ THƯ MỤC ảnh (Folder)
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Hỗ trợ định dạng .jpg, .png, .webp
                      </span>
                    </div>
                    {/* @ts-ignore */}
                    <input
                      type="file"
                      // @ts-ignore
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={handleFolderUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>

                  {/* Multi files picker */}
                  <label className="border-2 border-dashed border-gray-300 hover:border-blue-400 bg-white rounded-xl p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2">
                    <Upload className="w-8 h-8 text-gray-500" />
                    <div>
                      <span className="font-bold text-xs text-gray-800 block">
                        Chọn nhiều tệp ảnh cùng lúc
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Giữ phím Ctrl / Shift để chọn nhiều ảnh
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFolderUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded Images List & Assignment */}
              {uploadedFolderImages.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                      <FileImage className="w-4 h-4 text-emerald-600" />
                      <span>Các ảnh tư liệu vừa tải ({uploadedFolderImages.length} ảnh):</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setUploadedFolderImages([])}
                      className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                    >
                      Xóa danh sách tải
                    </button>
                  </div>

                  {/* Grid of uploaded images */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                    {uploadedFolderImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-lg border border-gray-300 overflow-hidden group aspect-square bg-gray-900 shadow-xs">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-1 left-1 right-1">
                          <span className="text-[9px] text-white/90 font-medium truncate block">
                            {img.name}
                          </span>
                        </div>
                        {/* Delete button on top-right */}
                        <button
                          type="button"
                          onClick={() => setUploadedFolderImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="Xóa ảnh này khỏi danh sách"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Assignment Controls */}
                  <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="font-bold text-gray-700 whitespace-nowrap text-xs">
                        Gán toàn bộ vào ngày:
                      </label>
                      <input
                        type="text"
                        value={folderTargetDate}
                        onChange={(e) => setFolderTargetDate(e.target.value)}
                        placeholder="DD/MM (ví dụ: 19/08)"
                        className="w-28 p-1.5 border border-gray-300 rounded font-bold text-center text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyFolderToDate}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Áp dụng vào Lời Bác dạy ngày {folderTargetDate}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUOTES LIST */}
          {activeTab === 'quote_list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuoteTerm}
                    onChange={(e) => setSearchQuoteTerm(e.target.value)}
                    placeholder="Tìm kiếm theo ngày (19/08), từ khóa lời dạy..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleStartAddNewQuote}
                  className="bg-red-800 hover:bg-red-900 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ngày mới</span>
                </button>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 hover:bg-amber-50/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            Ngày {q.dayMonth}
                          </span>
                          {q.yearRecorded && (
                            <span className="text-[10px] text-gray-500 font-medium">
                              (Năm {q.yearRecorded})
                            </span>
                          )}
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                            {q.images?.length || 0} ảnh tư liệu
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 line-clamp-1 italic">
                          “{q.quote}”
                        </p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          Hoàn cảnh: {q.context}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEditQuote(q)}
                          className="bg-gray-100 hover:bg-blue-100 text-blue-800 p-1.5 px-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuote(q.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Không tìm thấy bài Lời Bác dạy nào phù hợp.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ADD / EDIT QUOTE FORM */}
          {activeTab === 'add_quote' && (
            <form onSubmit={handleSaveQuoteForm} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ngày / Tháng (* DD/MM):
                  </label>
                  <input
                    type="text"
                    value={formDayMonth}
                    onChange={(e) => setFormDayMonth(e.target.value)}
                    placeholder="Ví dụ: 19/08, 02/09, 22/12..."
                    className="w-full text-xs p-2 border border-gray-300 rounded font-bold text-red-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Năm lịch sử (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="Ví dụ: 1945, 1954, 1968..."
                    className="w-full text-xs p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung Lời Bác dạy cốt lõi (*):
                </label>
                <textarea
                  value={formQuote}
                  onChange={(e) => setFormQuote(e.target.value)}
                  rows={2}
                  placeholder="Nhập trích dẫn nguyên văn lời Bác dạy..."
                  className="w-full text-xs p-2 border border-gray-300 rounded font-serif italic text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hoàn cảnh lịch sử / Nguồn tư liệu:
                </label>
                <textarea
                  value={formContext}
                  onChange={(e) => setFormContext(e.target.value)}
                  rows={2}
                  placeholder="Hoàn cảnh ra đời bài viết, bức thư hoặc bài phát biểu của Bác..."
                  className="w-full text-xs p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ý nghĩa & Bài học vận dụng đối với cán bộ, chiến sĩ Sư đoàn 10:
                </label>
                <textarea
                  value={formLesson}
                  onChange={(e) => setFormLesson(e.target.value)}
                  rows={2}
                  placeholder="Định hướng tư tưởng, hành động cụ thể trong huấn luyện, SSCĐ và rèn luyện kỷ luật..."
                  className="w-full text-xs p-2 border border-gray-300 rounded"
                />
              </div>

              {/* Photos List with File Upload & Previews */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Ảnh tư liệu lịch sử đính kèm ({formImages.length} ảnh):
                  </label>
                  {formImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormImages([])}
                      className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Xóa tất cả ảnh đã chọn
                    </button>
                  )}
                </div>

                {/* File Upload Trigger Box */}
                <input
                  ref={formFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={handleFormImageUpload}
                  className="hidden"
                />

                <div
                  onClick={() => formFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-red-600 hover:bg-red-50/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-gray-800">
                    Bấm để tải tệp ảnh lên từ máy tính / điện thoại
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Hỗ trợ định dạng: .png, .jpg, .jpeg, .webp (Có thể chọn nhiều ảnh cùng lúc)
                  </div>
                </div>

                {/* Previews Grid */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    {formImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl border border-gray-300 overflow-hidden bg-gray-900 shadow-xs aspect-4/3 group"
                      >
                        <img
                          src={url}
                          alt={`Tư liệu Bác Hồ ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                        {/* Sequence badge */}
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {idx === 0 ? 'Ảnh đại diện' : `Ảnh phụ ${idx + 1}`}
                        </div>

                        {/* Red Delete Button on Top Right */}
                        <button
                          type="button"
                          onClick={() => setFormImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('quote_list')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-red-800 hover:bg-red-900 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingQuoteId ? 'Cập nhật bài viết' : 'Lưu bài viết mới'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
