import React, { useState } from 'react';
import {
  ChevronRight,
  Crosshair,
  Download,
  Edit2,
  Edit3,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FileType,
  FolderLock,
  FolderOpen,
  HardDriveUpload,
  Heart,
  Home,
  Laptop,
  Layers,
  PlusCircle,
  Presentation,
  Search,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { LectureItem, PageView, SiteConfig, User as UserType } from '../types';
import { CategoryManagerModal } from './modals/CategoryManagerModal';

interface LectureLibraryViewProps {
  lectures: LectureItem[];
  currentUser: UserType | null;
  siteConfig?: SiteConfig;
  onOpenAddLectureModal: () => void;
  onOpenEditLectureModal?: (lec: LectureItem) => void;
  onDeleteLecture: (id: number) => void;
  onUpdateLecture?: (lec: LectureItem) => void;
  onSelectSection?: (section: PageView) => void;
  onGoHome?: () => void;
  onOpenTabIntroModal?: (tabKey: string) => void;
  onSaveCategories?: (categories: string[]) => void;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

export const LectureLibraryView: React.FC<LectureLibraryViewProps> = ({
  lectures,
  currentUser,
  siteConfig,
  onOpenAddLectureModal,
  onOpenEditLectureModal,
  onDeleteLecture,
  onUpdateLecture,
  onSelectSection,
  onGoHome,
  onOpenTabIntroModal,
  onSaveCategories,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const canUpload = !!(currentUser && (isAdmin || currentUser.canUploadDoc || currentUser.role === 'editor'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const title = siteConfig?.sections?.lecture?.title || 'Thư viện Bài giảng điện tử & Giáo án số hóa';
  const subtitle =
    siteConfig?.sections?.lecture?.subTitle ||
    siteConfig?.sections?.lecture?.desc ||
    'Kho lưu trữ slide trình chiếu, giáo án và học liệu đa phương tiện phục vụ huấn luyện toàn Sư đoàn 10';

  const availableCategories = siteConfig?.sections?.lecture?.categories || [
    'Giáo án Chính trị',
    'Huấn luyện Quân sự',
    'Kỹ thuật Khí tài & Hậu cần',
    'Điều lệnh & Thể lực',
    'Tin học & Chuyển đổi số',
    'Tài liệu bồi dưỡng Sĩ quan',
  ];

  const handleDownloadLecture = (lec: LectureItem) => {
    // Increment download count
    const updatedDownloads = (lec.downloads || 0) + 1;
    if (onUpdateLecture) {
      onUpdateLecture({
        ...lec,
        downloads: updatedDownloads,
      });
    }

    const defaultFileName =
      lec.fileName ||
      `${lec.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.${
        lec.fileType === 'word' ? 'docx' : lec.fileType === 'pdf' ? 'pdf' : 'pptx'
      }`;

    if (lec.fileUrl && lec.fileUrl.startsWith('data:')) {
      // Direct Data URL download
      const link = document.createElement('a');
      link.href = lec.fileUrl;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate sample military lecture document blob
      const content = `QUÂN ĐỘI NHÂN DÂN VIỆT NAM\nSƯ ĐOÀN 10 - ĐOÀN MANG YANG\n\nTÀI LIỆU BÀI GIẢNG ĐIỆN TỬ:\n${lec.title}\n\nĐối tượng: ${lec.target}\nGiáo viên biên soạn: ${lec.author}\nNgày ban hành: ${lec.date}\nĐịnh dạng: ${lec.fileType || 'PowerPoint'}\n\nNội dung tóm tắt:\n${lec.desc}\n\n(Tài liệu lưu hành nội bộ phục vụ công tác huấn luyện - sẵn sàng chiến đấu)`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getFileIcon = (type?: string) => {
    switch (type) {
      case 'word':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'pdf':
        return <FileType className="w-4 h-4 text-red-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'powerpoint':
      default:
        return <Presentation className="w-4 h-4 text-orange-600" />;
    }
  };

  const getFileBadge = (type?: string) => {
    switch (type) {
      case 'word':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Word (.docx)
          </span>
        );
      case 'pdf':
        return (
          <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            PDF (.pdf)
          </span>
        );
      case 'excel':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Excel (.xlsx)
          </span>
        );
      case 'powerpoint':
      default:
        return (
          <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            PowerPoint (.pptx)
          </span>
        );
    }
  };

  // Filter lectures
  const filteredLectures = lectures.filter((lec) => {
    const matchesSearch =
      lec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lec.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lec.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lec.desc.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedFileType === 'all' ||
      (lec.fileType || 'powerpoint').toLowerCase() === selectedFileType.toLowerCase();

    const matchesCat =
      selectedCategory === 'all' ||
      lec.target === selectedCategory ||
      (lec as any).category === selectedCategory;

    return matchesSearch && matchesType && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* 1. Clickable Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={onGoHome}
          className="hover:text-teal-800 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span className="text-gray-900 font-bold">{title}</span>
      </nav>

      {/* 2. Top Header Banner */}
      <div className="rounded-2xl p-4 sm:p-5 text-white shadow-md bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 border-2 border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-400/20 rounded-xl border border-amber-300/30 text-amber-300 shrink-0">
            <Laptop className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-teal-950">
                Học liệu số hóa
              </span>
              <span className="text-xs text-white/80 font-medium hidden sm:inline">
                • {lectures.length} bài giảng chính trị & quân sự
              </span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide text-amber-200 mt-1">
              {title}
            </h1>
            <p className="text-xs text-white/85 max-w-2xl mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {isAdmin && onOpenTabIntroModal && (
            <button
              type="button"
              onClick={() => onOpenTabIntroModal('lecture')}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-xs"
              title="Chỉnh sửa nội dung giới thiệu tab này"
            >
              <Edit3 className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">SỬA GIỚI THIỆU TAB</span>
            </button>
          )}

          {canUpload && (
            <button
              type="button"
              id="btn-upload-lecture"
              onClick={onOpenAddLectureModal}
              className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 border border-amber-200"
            >
              <HardDriveUpload className="w-4 h-4 text-teal-900" />
              <span>TẢI LÊN BÀI GIẢNG</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Structure: Left 1/4 (Cabinet & Stats), Right 3/4 (Content News Frames) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        {/* ================= LEFT COLUMN: 1/4 ================= */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card 1: Danh mục phân loại bài giảng */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-teal-700" />
                <span>Danh mục bài giảng</span>
              </span>
              <div className="flex items-center gap-1.5">
                {isAdmin && onSaveCategories && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 border border-amber-300 transition-colors cursor-pointer"
                    title="Quản lý / chỉnh sửa phân loại danh mục bài giảng"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Sửa danh mục</span>
                  </button>
                )}
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {availableCategories.length + 1}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">Tất cả bài giảng</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {lectures.length}
                </span>
              </button>

              {availableCategories.map((cat) => {
                const count = lectures.filter(
                  (l) => l.target === cat || (l as any).category === cat
                ).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ChevronRight
                        className={`w-3 h-3 shrink-0 ${
                          isSelected ? 'text-amber-300' : 'text-gray-400'
                        }`}
                      />
                      <span className="truncate text-left">{cat}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Định dạng học liệu */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FileType className="w-3.5 h-3.5 text-teal-700" />
                <span>Định dạng bài giảng</span>
              </span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                {lectures.length}
              </span>
            </div>

            <div className="p-2 space-y-1">
              {[
                { id: 'all', label: 'Tất cả định dạng', icon: Laptop, count: lectures.length },
                {
                  id: 'powerpoint',
                  label: 'PowerPoint (.pptx)',
                  icon: Presentation,
                  count: lectures.filter((l) => (l.fileType || 'powerpoint') === 'powerpoint').length,
                },
                {
                  id: 'word',
                  label: 'Giáo án Word (.docx)',
                  icon: FileText,
                  count: lectures.filter((l) => l.fileType === 'word').length,
                },
                {
                  id: 'pdf',
                  label: 'Tài liệu PDF',
                  icon: FileCheck,
                  count: lectures.filter((l) => l.fileType === 'pdf').length,
                },
              ].map((item) => {
                const isSelected = selectedFileType === item.id;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFileType(item.id)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Thống kê học tập số */}
          <div className="bg-gradient-to-br from-teal-950 to-slate-900 text-white rounded-xl p-3.5 shadow-xs border border-teal-800/60 space-y-3">
            <span className="font-extrabold text-xs uppercase tracking-wide text-amber-300 block border-b border-teal-800/60 pb-2">
              Chỉ số học tập điện tử
            </span>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <div className="text-base font-black text-amber-300">
                  {lectures.reduce((acc, l) => acc + (l.downloads || 0), 0)}
                </div>
                <div className="text-[10px] text-gray-300 font-medium uppercase mt-0.5">
                  Lượt tải về
                </div>
              </div>
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <div className="text-base font-black text-cyan-300">100%</div>
                <div className="text-[10px] text-gray-300 font-medium uppercase mt-0.5">
                  Chính quy
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 3/4 ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search Bar */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bài giảng, giáo viên biên soạn, đối tượng..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
              />
            </div>
            <span className="text-gray-500 font-semibold text-right sm:text-left">
              Hiển thị: <strong>{filteredLectures.length}</strong> bài giảng
            </span>
          </div>

          {/* Lecture Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLectures.length > 0 ? (
              filteredLectures.map((lec) => {
                const isCustom = lec.id > 1000;
                return (
                  <div
                    key={lec.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-block bg-teal-50 text-teal-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-teal-200">
                          {lec.target}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {getFileBadge(lec.fileType)}
                          <span className="text-[10px] text-gray-400 font-medium">
                            {lec.fileSize || '10.5 MB'}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-teal-800 transition-colors leading-snug">
                        {lec.title}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {lec.desc}
                      </p>

                      {lec.fileName && (
                        <div className="bg-gray-50 p-2 rounded-md border border-gray-200/80 flex items-center gap-2 text-[11px] text-gray-700">
                          {getFileIcon(lec.fileType)}
                          <span className="font-semibold truncate flex-1">{lec.fileName}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {lec.downloads || 0} lượt tải
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50/80 p-3 px-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 font-medium truncate max-w-[180px]">
                        <User className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                        <span className="truncate">
                          Giáo viên: <strong>{lec.author}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Admin Edit Lecture */}
                        {isAdmin && onOpenEditLectureModal && (
                          <button
                            type="button"
                            onClick={() => onOpenEditLectureModal(lec)}
                            className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 p-1 px-1.5 rounded transition-colors flex items-center gap-1 font-bold text-[10px]"
                            title="Chỉnh sửa thông tin / đổi tệp"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                        )}

                        {/* Admin or Creator Delete */}
                        {(isAdmin || isCustom) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Đồng chí có chắc chắn muốn xóa bài giảng "${lec.title}"?`
                                )
                              ) {
                                onDeleteLecture(lec.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa bài giảng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadLecture(lec)}
                          className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          title="Tải về bộ giáo án bài giảng"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải về</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white p-8 text-center text-gray-500 rounded-lg border border-gray-200 space-y-2">
                <p className="text-xs">Không tìm thấy bài giảng nào phù hợp với bộ lọc.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFileType('all');
                  }}
                  className="text-xs text-teal-800 underline font-semibold"
                >
                  Đặt lại bộ lọc tìm kiếm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          sectionTitle={title}
          themeColor="#0f766e"
          categories={availableCategories}
          itemCountByCategory={(() => {
            const map: Record<string, number> = {};
            availableCategories.forEach((cat: string) => {
              map[cat] = lectures.filter((l) => l.category === cat).length;
            });
            return map;
          })()}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={(newCats) => {
            if (onSaveCategories) onSaveCategories(newCats);
          }}
          onRenameCategory={onRenameCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
};
