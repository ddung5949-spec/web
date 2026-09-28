import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Crosshair,
  Download,
  Edit2,
  Edit3,
  Eye,
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
  Save,
  Search,
  Shield,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { LectureItem, PageView, SiteConfig, User as UserType } from "../types";
import { CategoryManagerModal } from "./modals/CategoryManagerModal";
import { supabase } from "../utils/supabase";

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
  onBackHome?: () => void;
  onOpenTabIntroModal?: (tabKey: string) => void;
  onSaveCategories?: (categories: string[]) => void;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

export const LectureLibraryView: React.FC<LectureLibraryViewProps> = ({
  lectures: initialLectures,
  currentUser,
  siteConfig,
  onOpenAddLectureModal,
  onOpenEditLectureModal,
  onDeleteLecture,
  onUpdateLecture,
  onSelectSection,
  onGoHome,
  onBackHome,
  onOpenTabIntroModal,
  onSaveCategories,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const isAdmin = currentUser?.role === "admin";
  const canUpload = !!(
    currentUser &&
    (isAdmin || currentUser.canUploadDoc || currentUser.role === "editor")
  );

  const [lectures, setLectures] = useState<any[]>(initialLectures || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [previewLecture, setPreviewLecture] = useState<any | null>(null);

  // Modal tải lên bài giảng số mới
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmittingLecture, setIsSubmittingLecture] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subCategory: "Giáo án Chính trị",
    instructor: "Giáo viên đơn vị",
    author: "Trung đoàn 95",
    target: "Toàn thể cán bộ, chiến sĩ",
    fileName: "bai-giang.pptx",
    fileUrl: "#",
    fileType: "PPTX",
    fileSize: "5.0 MB",
  });

  // Tải trực tiếp bài giảng từ Supabase
  const fetchLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .order('published_at', { ascending: false });
      if (data && data.length > 0) {
        setLectures(data);
      } else if (initialLectures && initialLectures.length > 0) {
        setLectures(initialLectures);
      }
    } catch (err) {
      console.warn("fetchLectures error:", err);
      if (initialLectures) setLectures(initialLectures);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  // Lưu bài giảng số trực tiếp vào Supabase
  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Vui lòng nhập tên bài giảng!");
      return;
    }

    setIsSubmittingLecture(true);
    try {
      const { error } = await supabase.from('lectures').insert([{
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        category: 'BÀI GIẢNG SỐ',
        sub_category: formData.subCategory || 'Giáo án Chính trị',
        instructor: formData.instructor || 'Giáo viên đơn vị',
        author: formData.author || 'Trung đoàn 95',
        target: formData.target || 'Toàn thể cán bộ, chiến sĩ',
        file_name: formData.fileName || 'bai-giang.pptx',
        file_url: formData.fileUrl || '#',
        file_type: formData.fileType || 'PPTX',
        file_size: formData.fileSize || '5.0 MB',
        downloads: 0,
        download_count: 0,
        published_at: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
      }]);

      if (error) {
        alert('Lỗi: ' + error.message);
        setIsSubmittingLecture(false);
        return;
      }

      alert('✅ Lưu bài giảng thành công!');
      setIsUploadModalOpen(false);
      setFormData({
        title: "",
        subCategory: "Giáo án Chính trị",
        instructor: "Giáo viên đơn vị",
        author: "Trung đoàn 95",
        target: "Toàn thể cán bộ, chiến sĩ",
        fileName: "bai-giang.pptx",
        fileUrl: "#",
        fileType: "PPTX",
        fileSize: "5.0 MB",
      });
      await fetchLectures();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể lưu bài giảng'));
    } finally {
      setIsSubmittingLecture(false);
    }
  };

  const handleBack = onBackHome || onGoHome;

  const title =
    siteConfig?.sections?.lecture?.title ||
    "Thư viện Bài giảng điện tử & Giáo án số hóa";
  const subtitle =
    siteConfig?.sections?.lecture?.subTitle ||
    siteConfig?.sections?.lecture?.desc ||
    "Kho lưu trữ slide trình chiếu, giáo án và học liệu đa phương tiện phục vụ huấn luyện toàn Trung đoàn 95, Sư đoàn 2";

  const rawCategories = siteConfig?.sections?.lecture?.categories || [
    "Giáo án Chính trị",
    "Huấn luyện Quân sự",
    "Kỹ thuật Khí tài & Hậu cần",
    "Điều lệnh & Thể lực",
    "Tin học & Chuyển đổi số",
    "Tài liệu bồi dưỡng Sĩ quan",
  ];
  const availableCategories = (
    Array.isArray(rawCategories) ? rawCategories : []
  )
    .map((c: any) =>
      typeof c === "string"
        ? c
        : c?.name || c?.label || c?.shortLabel || String(c || ""),
    )
    .filter(Boolean);

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
      `${lec.title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, "_")}.${
        lec.fileType === "word"
          ? "docx"
          : lec.fileType === "pdf"
            ? "pdf"
            : "pptx"
      }`;

    if (lec.fileUrl && lec.fileUrl.startsWith("data:")) {
      // Direct Data URL download
      const link = document.createElement("a");
      link.href = lec.fileUrl;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate sample military lecture document blob
      const content = `QUÂN ĐỘI NHÂN DÂN VIỆT NAM\nSƯ ĐOÀN 10 - ĐOÀN MANG YANG\n\nTÀI LIỆU BÀI GIẢNG ĐIỆN TỬ:\n${lec.title}\n\nĐối tượng: ${lec.target}\nGiáo viên biên soạn: ${lec.author}\nNgày ban hành: ${lec.date}\nĐịnh dạng: ${lec.fileType || "PowerPoint"}\n\nNội dung tóm tắt:\n${lec.desc}\n\n(Tài liệu lưu hành nội bộ phục vụ công tác huấn luyện - sẵn sàng chiến đấu)`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
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
      case "word":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "pdf":
        return <FileType className="w-4 h-4 text-red-600" />;
      case "excel":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case "powerpoint":
      default:
        return <Presentation className="w-4 h-4 text-orange-600" />;
    }
  };

  const handleQuickView = (lec: LectureItem) => {
    if (lec.fileUrl) {
      if (lec.fileUrl.startsWith("data:")) {
        setPreviewLecture(lec);
      } else {
        window.open(lec.fileUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      setPreviewLecture(lec);
    }
  };

  const getFileBadge = (type?: string, fileSize?: string) => {
    const t = (type || "powerpoint").toLowerCase();
    const sizeStr = fileSize ? ` - ${fileSize}` : "";
    switch (t) {
      case "word":
      case "doc":
      case "docx":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-blue-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              W
            </span>
            <span>Word{sizeStr}</span>
          </span>
        );
      case "excel":
      case "xls":
      case "xlsx":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              X
            </span>
            <span>Excel{sizeStr}</span>
          </span>
        );
      case "pdf":
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-900 border border-red-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-red-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              PDF
            </span>
            <span>PDF{sizeStr}</span>
          </span>
        );
      case "powerpoint":
      case "ppt":
      case "pptx":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-900 border border-orange-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-orange-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              P
            </span>
            <span>PPT{sizeStr}</span>
          </span>
        );
    }
  };

  // Safe lectures array
  const safeLectures = Array.isArray(lectures) ? lectures : [];

  // Filter lectures
  const filteredLectures = safeLectures.filter((lec) => {
    if (!lec) return false;
    const matchesSearch =
      (lec.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lec.author || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lec.target || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lec.desc || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedFileType === "all" ||
      (lec.fileType || "powerpoint").toLowerCase() ===
        selectedFileType.toLowerCase();

    const matchesCat =
      selectedCategory === "all" ||
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
          onClick={handleBack}
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
            <p className="text-xs text-white/85 max-w-2xl mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {isAdmin && onOpenTabIntroModal && (
            <button
              type="button"
              onClick={() => onOpenTabIntroModal("lecture")}
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
              <span>+ TẢI LÊN BÀI GIẢNG / GIÁO ÁN</span>
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
                onClick={() => setSelectedCategory("all")}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-teal-800 text-white shadow-xs"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">Tất cả bài giảng</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    selectedCategory === "all"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {lectures.length}
                </span>
              </button>

              {availableCategories.map((cat, catIdx) => {
                const catStr =
                  typeof cat === "string"
                    ? cat
                    : cat?.name || cat?.label || String(cat || "");
                const count = lectures.filter(
                  (l) => l.target === catStr || (l as any).category === catStr,
                ).length;
                const isSelected = selectedCategory === catStr;
                return (
                  <button
                    key={`${catStr}-${catIdx}`}
                    type="button"
                    onClick={() => setSelectedCategory(catStr)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-teal-700 text-white font-bold shadow-xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ChevronRight
                        className={`w-3 h-3 shrink-0 ${
                          isSelected ? "text-amber-300" : "text-gray-400"
                        }`}
                      />
                      <span className="truncate text-left">{catStr}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
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
                {
                  id: "all",
                  label: "Tất cả định dạng",
                  icon: Laptop,
                  count: lectures.length,
                },
                {
                  id: "powerpoint",
                  label: "PowerPoint (.pptx)",
                  icon: Presentation,
                  count: lectures.filter(
                    (l) => (l.fileType || "powerpoint") === "powerpoint",
                  ).length,
                },
                {
                  id: "word",
                  label: "Giáo án Word (.docx)",
                  icon: FileText,
                  count: lectures.filter((l) => l.fileType === "word").length,
                },
                {
                  id: "pdf",
                  label: "Tài liệu PDF",
                  icon: FileCheck,
                  count: lectures.filter((l) => l.fileType === "pdf").length,
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
                        ? "bg-teal-800 text-white shadow-xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600"
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
                  {safeLectures.reduce(
                    (acc, l) => acc + (l?.downloads || 0),
                    0,
                  )}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-black text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                            {lec.code || `BG-${lec.id}`}
                          </span>
                          <span className="inline-block bg-teal-50 text-teal-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-teal-200">
                            {lec.target}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getFileBadge(lec.fileType, lec.fileSize || "10.5 MB")}
                        </div>
                      </div>

                      <h3
                        onClick={() => handleQuickView(lec)}
                        className="text-sm font-bold text-gray-900 group-hover:text-teal-800 transition-colors leading-snug cursor-pointer"
                        title={lec.title}
                      >
                        {lec.title}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {lec.desc}
                      </p>

                      {lec.fileName && (
                        <div className="bg-gray-50 p-2 rounded-md border border-gray-200/80 flex items-center gap-2 text-[11px] text-gray-700">
                          {getFileIcon(lec.fileType)}
                          <span className="font-semibold truncate flex-1">
                            {lec.fileName}
                          </span>
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
                        {/* Xem nhanh Button */}
                        <button
                          type="button"
                          onClick={() => handleQuickView(lec)}
                          className="bg-slate-100 hover:bg-teal-50 text-teal-900 border border-slate-200 hover:border-teal-300 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xem nhanh bài giảng"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-700" />
                          <span>Xem nhanh</span>
                        </button>

                        {/* Admin Edit Lecture */}
                        {isAdmin && onOpenEditLectureModal && (
                          <button
                            type="button"
                            onClick={() => onOpenEditLectureModal(lec)}
                            className="text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 p-1.5 px-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs cursor-pointer"
                            title="Chỉnh sửa thông tin / đổi tệp"
                          >
                            <Edit3 className="w-3 h-3 text-amber-700" />
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
                                  `Đồng chí có chắc chắn muốn xóa bài giảng "${lec.title}"?`,
                                )
                              ) {
                                onDeleteLecture(lec.id);
                              }
                            }}
                            className="text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 p-1.5 px-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                            title="Xóa bài giảng"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                            <span>Xóa</span>
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
                          <span>Tải về máy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : safeLectures.length === 0 ? (
              <div className="col-span-full w-full py-16 text-center text-slate-500 font-medium bg-white rounded-lg border border-dashed border-slate-300 my-4">
                Chưa có tài liệu/tệp tin nào được tải lên trong mục này
              </div>
            ) : (
              <div className="col-span-full bg-white p-8 text-center text-gray-500 rounded-lg border border-gray-200 space-y-2">
                <p className="text-xs">
                  Không tìm thấy bài giảng nào phù hợp với bộ lọc.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedFileType("all");
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

      {/* Quick Preview Modal */}
      {previewLecture && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-950 text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Laptop className="w-4 h-4 text-amber-300" />
                <span>XEM NHANH BÀI GIẢNG & GIÁO ÁN SỐ HÓA</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLecture(null)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-gray-100">
                <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
                  {previewLecture.code || `BG-${previewLecture.id}`}
                </span>
                {getFileBadge(previewLecture.fileType, previewLecture.fileSize || "10.5 MB")}
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 leading-snug">
                  {previewLecture.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-600">
                  <span>
                    Đối tượng: <strong className="text-teal-800">{previewLecture.target}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Giáo viên: <strong>{previewLecture.author}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Ngày ban hành: <strong className="font-mono">{previewLecture.date}</strong>
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="font-bold text-gray-700 mb-1">Trích yếu nội dung bài giảng:</div>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {previewLecture.desc}
                </p>
              </div>
              {previewLecture.fileName && (
                <div className="bg-teal-50/60 p-3 rounded-lg border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(previewLecture.fileType)}
                    <div>
                      <div className="font-bold text-teal-950">{previewLecture.fileName}</div>
                      <div className="text-[11px] text-teal-700 font-semibold">
                        {previewLecture.fileSize || "10.5 MB"} • Sẵn sàng tải về máy
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadLecture(previewLecture)}
                    className="bg-teal-800 hover:bg-teal-900 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 px-5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewLecture(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleDownloadLecture(previewLecture)}
                className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-extrabold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer border border-amber-300"
              >
                <Download className="w-4 h-4 text-teal-900" />
                <span>Tải về máy</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
              map[cat] = safeLectures.filter(
                (l) => l?.category === cat || l?.target === cat,
              ).length;
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

      {/* Upload Lecture Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Laptop className="w-4 h-4 text-amber-300" />
                <span>TẢI LÊN BÀI GIẢNG ĐIỆN TỬ & GIÁO ÁN MỚI</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveLecture} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên bài giảng / Giáo án (*):
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tên bài giảng điện tử..."
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nhóm danh mục:
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden bg-white"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Đối tượng huấn luyện:
                  </label>
                  <input
                    type="text"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    placeholder="Ví dụ: Sĩ quan, QNCN, Hạ sĩ quan - Binh sĩ..."
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giáo viên đơn vị:
                  </label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="Ví dụ: Thiếu tá Nguyễn Văn A..."
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cơ quan / Đơn vị biên soạn:
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Trung đoàn 95"
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên tệp đính kèm:
                  </label>
                  <input
                    type="text"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    placeholder="bai-giang.pptx"
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Định dạng:
                  </label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden bg-white"
                  >
                    <option value="PPTX">PowerPoint (PPTX)</option>
                    <option value="PDF">PDF</option>
                    <option value="DOCX">Word (DOCX)</option>
                    <option value="XLSX">Excel (XLSX)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dung lượng:
                  </label>
                  <input
                    type="text"
                    value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    placeholder="5.0 MB"
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đường dẫn tệp / URL:
                </label>
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://... hoặc #"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  disabled={isSubmittingLecture}
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLecture}
                  className="px-5 py-2 rounded-lg text-xs font-extrabold bg-teal-800 hover:bg-teal-900 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingLecture ? "ĐANG LƯU..." : "LƯU BÀI GIẢNG VÀO THƯ VIỆN"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
