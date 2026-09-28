import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Download,
  Edit2,
  Edit3,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FileType,
  FolderOpen,
  HardDriveUpload,
  Home,
  Layers,
  Lock,
  PlusCircle,
  Presentation,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { DocumentItem, PageView, SiteConfig, User as UserType } from "../types";
import { CategoryManagerModal } from "./modals/CategoryManagerModal";
import { supabase } from "../utils/supabase";

interface DocumentLibraryViewProps {
  documents: DocumentItem[];
  currentUser: UserType | null;
  siteConfig?: SiteConfig;
  selectedSubcategory?: string;
  onSelectSubcategory?: (sub: string) => void;
  onOpenAuth?: () => void;
  onOpenAddDocModal: () => void;
  onEditDoc?: (doc: DocumentItem) => void;
  onDeleteDoc: (id: number) => void;
  onUpdateDoc?: (doc: DocumentItem) => void;
  onSelectSection?: (section: PageView) => void;
  onGoHome?: () => void;
  onBackHome?: () => void;
  onOpenTabIntroModal?: (tabKey: string) => void;
  onSaveCategories?: (categories: string[]) => void;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
}

const DEFAULT_DOC_CATEGORIES = [
  "Nghị quyết - Chỉ thị",
  "Kế hoạch - Mệnh lệnh tác chiến",
  "Hướng dẫn CTĐ - CTCT",
  "Công tác Quân sự - Hậu cần - Kỹ thuật",
  "Quy định & Kỷ luật quân đội",
  "Văn bản hướng dẫn chuyển đổi số",
];

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  documents: initialDocuments,
  currentUser,
  siteConfig,
  selectedSubcategory = "all",
  onSelectSubcategory,
  onOpenAuth,
  onOpenAddDocModal,
  onEditDoc,
  onDeleteDoc,
  onUpdateDoc,
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

  const [documents, setDocuments] = useState<any[]>(initialDocuments || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const [localCategory, setLocalCategory] = useState<string>(
    selectedSubcategory || "all"
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Modal tải lên văn bản mới
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [formData, setFormData] = useState({
    documentNumber: "",
    title: "",
    subCategory: "Nghị quyết - Chỉ thị",
    issuingBody: "Trung đoàn 95",
    signer: "Chỉ huy đơn vị",
    fileName: "van-ban.pdf",
    fileUrl: "#",
    fileType: "PDF",
    fileSize: "1.5 MB",
  });

  // Tải danh sách văn bản vĩnh viễn từ Supabase
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('published_at', { ascending: false });
      if (data && data.length > 0) {
        setDocuments(data);
      } else if (initialDocuments && initialDocuments.length > 0) {
        setDocuments(initialDocuments);
      }
    } catch (err) {
      console.warn("fetchDocuments error:", err);
      if (initialDocuments) setDocuments(initialDocuments);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Lưu văn bản trực tiếp vào Supabase
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Vui lòng nhập trích yếu văn bản!");
      return;
    }

    setIsSubmittingDoc(true);
    const docNumber = formData.documentNumber.trim() || 'Số: ...';
    const issuer = formData.issuingBody.trim() || 'Trung đoàn 95';

    try {
      const { error } = await supabase.from('documents').insert([{
        id: crypto.randomUUID(),
        document_number: docNumber,
        code: docNumber,
        title: formData.title.trim(),
        category: 'VĂN BẢN - CHỈ THỊ',
        sub_category: formData.subCategory || 'Nghị quyết - Chỉ thị',
        issuing_body: issuer,
        issuer: issuer,
        signer: formData.signer || 'Chỉ huy đơn vị',
        file_name: formData.fileName || 'van-ban.pdf',
        file_url: formData.fileUrl || '#',
        file_type: formData.fileType || 'PDF',
        type: (formData.fileType || 'PDF').toLowerCase(),
        file_size: formData.fileSize || '1.5 MB',
        downloads: 0,
        download_count: 0,
        published_at: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
      }]);

      if (error) {
        alert('Lỗi: ' + error.message);
        setIsSubmittingDoc(false);
        return;
      }

      alert('✅ Lưu văn bản thành công!');
      setIsUploadModalOpen(false);
      setFormData({
        documentNumber: "",
        title: "",
        subCategory: "Nghị quyết - Chỉ thị",
        issuingBody: "Trung đoàn 95",
        signer: "Chỉ huy đơn vị",
        fileName: "van-ban.pdf",
        fileUrl: "#",
        fileType: "PDF",
        fileSize: "1.5 MB",
      });
      await fetchDocuments();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể lưu văn bản'));
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  const handleBack = onBackHome || onGoHome;

  const title =
    siteConfig?.sections?.doc?.title ||
    "KHO VĂN BẢN - CHỈ THỊ & TÀI LIỆU QUÂN SỰ";
  const subtitle =
    siteConfig?.sections?.doc?.subTitle ||
    siteConfig?.sections?.doc?.desc ||
    "Hệ thống lưu trữ chỉ thị, nghị quyết, kế hoạch tác chiến, hướng dẫn nghiệp vụ và văn bản mật/thường toàn đơn vị";

  const rawCategories =
    siteConfig?.sections?.doc?.categories || DEFAULT_DOC_CATEGORIES;
  const availableCategories = (
    Array.isArray(rawCategories) ? rawCategories : []
  )
    .map((c: any) =>
      typeof c === "string"
        ? c
        : c?.name || c?.label || c?.shortLabel || String(c || "")
    )
    .filter(Boolean);

  const handleCategorySelect = (catStr: string) => {
    setLocalCategory(catStr);
    if (onSelectSubcategory) {
      onSelectSubcategory(catStr);
    }
  };

  const handleDownloadDoc = (doc: DocumentItem) => {
    const currentDownloads = (doc.downloads ?? (doc as any).download_count ?? 0) as number;
    const updatedDownloads = currentDownloads + 1;
    if (onUpdateDoc) {
      onUpdateDoc({
        ...doc,
        downloads: updatedDownloads,
        download_count: updatedDownloads,
      });
    }

    const ext =
      doc.type === "docx" || doc.type === "doc"
        ? "docx"
        : doc.type === "xlsx" || doc.type === "xls"
        ? "xlsx"
        : doc.type === "pptx" || doc.type === "ppt"
        ? "pptx"
        : "pdf";

    const defaultFileName =
      doc.fileName ||
      `${doc.code.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, "_")}_${doc.title
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, "_")}.${ext}`;

    if (doc.fileUrl && doc.fileUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (doc.fileUrl && doc.fileUrl.startsWith("http")) {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    } else {
      const content = `QUÂN ĐỘI NHÂN DÂN VIỆT NAM\nTRUNG ĐOÀN 95 - SƯ ĐOÀN 2\n\nVĂN BẢN QUÂN SỰ CHÍNH THỨC\nSố/Ký hiệu: ${doc.code}\nTrích yếu: ${doc.title}\nCơ quan ban hành: ${doc.issuer}\nNgày ban hành: ${doc.date}\nĐộ mật: ${doc.secretLevel || "Thường"}\nĐịnh dạng: ${doc.type}\n\nNội dung văn bản:\n${doc.description || "Nội dung chỉ đạo, mệnh lệnh và hướng dẫn thi hành theo quy định của Trung đoàn."}\n\n(Tài liệu quân sự lưu trữ nội bộ - Nghiêm cấm sao chép, phổ biến trái quy định)`;
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

  const handleQuickView = (doc: DocumentItem) => {
    if (doc.fileUrl && !doc.fileUrl.startsWith("data:")) {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    } else {
      setPreviewDoc(doc);
    }
  };

  const getFormatBadge = (type?: string, fileSize?: string) => {
    const t = (type || "pdf").toLowerCase();
    const sizeStr = fileSize ? ` - ${fileSize}` : "";
    switch (t) {
      case "docx":
      case "doc":
      case "word":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-blue-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              W
            </span>
            <span>Word{sizeStr}</span>
          </span>
        );
      case "xlsx":
      case "xls":
      case "excel":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              X
            </span>
            <span>Excel{sizeStr}</span>
          </span>
        );
      case "pptx":
      case "ppt":
      case "powerpoint":
        return (
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-900 border border-orange-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-orange-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              P
            </span>
            <span>PPT{sizeStr}</span>
          </span>
        );
      case "pdf":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-900 border border-red-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
            <span className="bg-red-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
              PDF
            </span>
            <span>PDF{sizeStr}</span>
          </span>
        );
    }
  };

  const getFormatIcon = (type?: string) => {
    const t = (type || "pdf").toLowerCase();
    switch (t) {
      case "docx":
      case "doc":
      case "word":
        return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
      case "xlsx":
      case "xls":
      case "excel":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
      case "pptx":
      case "ppt":
      case "powerpoint":
        return <Presentation className="w-4 h-4 text-orange-600 shrink-0" />;
      case "pdf":
      default:
        return <FileType className="w-4 h-4 text-red-600 shrink-0" />;
    }
  };

  const safeDocs = Array.isArray(documents) ? documents : [];

  const filteredDocuments = safeDocs.filter((doc) => {
    if (!doc) return false;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (doc.code || "").toLowerCase().includes(term) ||
      (doc.title || "").toLowerCase().includes(term) ||
      (doc.issuer || "").toLowerCase().includes(term) ||
      (doc.description || "").toLowerCase().includes(term);

    const docType = (doc.type || "pdf").toLowerCase();
    let matchesType = true;
    if (selectedFileType !== "all") {
      if (selectedFileType === "word") {
        matchesType = docType === "docx" || docType === "doc" || docType === "word";
      } else if (selectedFileType === "excel") {
        matchesType = docType === "xlsx" || docType === "xls" || docType === "excel";
      } else if (selectedFileType === "powerpoint") {
        matchesType = docType === "pptx" || docType === "ppt" || docType === "powerpoint";
      } else {
        matchesType = docType === selectedFileType;
      }
    }

    const docCategory =
      (doc as any).sub_category || doc.category || "";
    const matchesCat =
      localCategory === "all" ||
      docCategory.toLowerCase() === localCategory.toLowerCase() ||
      docCategory.toLowerCase().includes(localCategory.toLowerCase()) ||
      localCategory.toLowerCase().includes(docCategory.toLowerCase());

    return matchesSearch && matchesType && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* 1. Clickable Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={handleBack}
          className="hover:text-emerald-800 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span className="text-gray-900 font-bold">{title}</span>
      </nav>

      {/* 2. Top Header Banner - Xanh quân đội chuyên nghiệp */}
      <div className="rounded-2xl p-4 sm:p-5 text-white shadow-md bg-gradient-to-r from-emerald-950 via-teal-900 to-green-950 border-2 border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-400/20 rounded-xl border border-amber-300/30 text-amber-300 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-teal-950">
                Kho hồ sơ & Mệnh lệnh
              </span>
              <span className="text-xs text-white/80 font-medium hidden sm:inline">
                • {documents.length} văn bản & chỉ thị chính quy
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
              onClick={() => onOpenTabIntroModal("doc")}
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
              id="btn-upload-doc"
              onClick={onOpenAddDocModal}
              className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 border border-amber-200"
            >
              <HardDriveUpload className="w-4 h-4 text-teal-900" />
              <span>+ TẢI LÊN TÀI LIỆU / VĂN BẢN MỚI</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Structure: Left 1/4 (Cabinet & Stats), Right 3/4 (Documents Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        {/* ================= LEFT COLUMN: 1/4 ================= */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card 1: Danh mục phân loại văn bản */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-teal-700" />
                <span>Danh mục văn bản</span>
              </span>
              <div className="flex items-center gap-1.5">
                {isAdmin && onSaveCategories && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 border border-amber-300 transition-colors cursor-pointer"
                    title="Quản lý / chỉnh sửa phân loại danh mục văn bản"
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
                onClick={() => handleCategorySelect("all")}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  localCategory === "all"
                    ? "bg-teal-800 text-white shadow-xs"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">Tất cả văn bản</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    localCategory === "all"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {documents.length}
                </span>
              </button>

              {availableCategories.map((cat, catIdx) => {
                const catStr =
                  typeof cat === "string"
                    ? cat
                    : cat?.name || cat?.label || String(cat || "");
                const count = documents.filter((d) => {
                  const dc = (d as any).sub_category || d.category || "";
                  return (
                    dc.toLowerCase() === catStr.toLowerCase() ||
                    dc.toLowerCase().includes(catStr.toLowerCase())
                  );
                }).length;
                const isSelected = localCategory === catStr;
                return (
                  <button
                    key={`${catStr}-${catIdx}`}
                    type="button"
                    onClick={() => handleCategorySelect(catStr)}
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

          {/* Card 2: Định dạng tệp tin văn bản */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FileType className="w-3.5 h-3.5 text-teal-700" />
                <span>Định dạng tệp tin</span>
              </span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                {documents.length}
              </span>
            </div>

            <div className="p-2 space-y-1">
              {[
                {
                  id: "all",
                  label: "Tất cả định dạng",
                  icon: FileText,
                  count: documents.length,
                },
                {
                  id: "word",
                  label: "Văn bản Word (.docx, .doc)",
                  icon: FileText,
                  count: documents.filter(
                    (d) =>
                      d.type === "docx" ||
                      d.type === "doc" ||
                      d.type === "word"
                  ).length,
                },
                {
                  id: "pdf",
                  label: "Tài liệu PDF (.pdf)",
                  icon: FileCheck,
                  count: documents.filter((d) => (d.type || "pdf") === "pdf").length,
                },
                {
                  id: "excel",
                  label: "Bảng tính Excel (.xlsx, .xls)",
                  icon: FileSpreadsheet,
                  count: documents.filter(
                    (d) =>
                      d.type === "xlsx" ||
                      d.type === "xls" ||
                      d.type === "excel"
                  ).length,
                },
                {
                  id: "powerpoint",
                  label: "Trình chiếu PowerPoint (.pptx)",
                  icon: Presentation,
                  count: documents.filter(
                    (d) =>
                      d.type === "pptx" ||
                      d.type === "ppt" ||
                      d.type === "powerpoint"
                  ).length,
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

          {/* Card 3: Thống kê lưu trữ văn bản */}
          <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-xl p-3.5 shadow-xs border border-teal-800/60 space-y-3">
            <span className="font-extrabold text-xs uppercase tracking-wide text-amber-300 block border-b border-teal-800/60 pb-2">
              Chỉ số lưu trữ văn bản
            </span>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <div className="text-base font-black text-amber-300">
                  {safeDocs.reduce(
                    (acc, d) => acc + (d?.downloads || 0),
                    0
                  )}
                </div>
                <div className="text-[10px] text-gray-300 font-medium uppercase mt-0.5">
                  Lượt tải về
                </div>
              </div>
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <div className="text-base font-black text-cyan-300">
                  100%
                </div>
                <div className="text-[10px] text-gray-300 font-medium uppercase mt-0.5">
                  An toàn số
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
                placeholder="Tìm kiếm số hiệu (95/CT-ĐU), trích yếu, cơ quan ban hành..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
              />
            </div>
            <span className="text-gray-500 font-semibold text-right sm:text-left">
              Hiển thị: <strong>{filteredDocuments.length}</strong> văn bản
            </span>
          </div>

          {/* Document Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => {
                const isCustom = doc.id > 1000;
                const isConfidential =
                  doc.secretLevel === "mat" || doc.secretLevel === "toi_mat";

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Số / Ký hiệu */}
                          <span className="font-mono text-[11px] font-black text-emerald-950 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded shadow-2xs">
                            {doc.document_number || doc.code}
                          </span>

                          {/* Mật badge */}
                          {isConfidential && (
                            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                              <ShieldAlert className="w-3 h-3" />
                              <span>MẬT</span>
                            </span>
                          )}

                          {/* Category Badge */}
                          <span className="inline-block bg-teal-50 text-teal-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-teal-200">
                            {doc.sub_category || doc.subCategory || doc.category || "Văn bản"}
                          </span>
                        </div>

                        {/* Format Badge */}
                        <div className="flex items-center gap-1.5">
                          {getFormatBadge(doc.file_type || doc.type, doc.file_size || doc.fileSize || "1.5 MB")}
                        </div>
                      </div>

                      {/* Trích yếu / Tên văn bản */}
                      <h3
                        onClick={() => handleQuickView(doc)}
                        className="text-sm font-bold text-gray-900 group-hover:text-teal-800 transition-colors leading-snug cursor-pointer"
                        title={doc.title}
                      >
                        {doc.title}
                      </h3>

                      {/* Mô tả tóm tắt */}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {doc.description ||
                          "Văn bản chính thức và tài liệu nghiệp vụ phục vụ chỉ huy, huấn luyện và thực hiện nhiệm vụ trong toàn đơn vị."}
                      </p>

                      {/* Tệp đính kèm */}
                      {(doc.file_name || doc.fileName) && (
                        <div className="bg-gray-50 p-2 rounded-md border border-gray-200/80 flex items-center gap-2 text-[11px] text-gray-700">
                          {getFormatIcon(doc.file_type || doc.type)}
                          <span className="font-semibold truncate flex-1">
                            {doc.file_name || doc.fileName}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {doc.downloads ?? doc.download_count ?? 0} lượt tải
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom footer bar */}
                    <div className="bg-gray-50/80 p-3 px-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 font-medium truncate max-w-[180px]">
                        <User className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                        <span className="truncate" title={doc.issuing_body || doc.issuer}>
                          Ban hành: <strong>{doc.issuing_body || doc.issuer || "Trung đoàn 95"}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Xem nhanh Button */}
                        <button
                          type="button"
                          onClick={() => handleQuickView(doc)}
                          className="bg-slate-100 hover:bg-teal-50 text-teal-900 border border-slate-200 hover:border-teal-300 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xem nhanh văn bản"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-700" />
                          <span>Xem nhanh</span>
                        </button>

                        {/* Admin / Creator Edit */}
                        {isAdmin && onEditDoc && (
                          <button
                            type="button"
                            onClick={() => onEditDoc(doc)}
                            className="text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 p-1.5 px-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs cursor-pointer"
                            title="Sửa thông tin văn bản"
                          >
                            <Edit3 className="w-3 h-3 text-amber-700" />
                            <span>Sửa</span>
                          </button>
                        )}

                        {/* Admin / Creator Delete */}
                        {(isAdmin || isCustom) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Đồng chí có chắc chắn muốn xóa văn bản [${doc.code}] "${doc.title}"?`
                                )
                              ) {
                                onDeleteDoc(doc.id);
                              }
                            }}
                            className="text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 p-1.5 px-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                            title="Xóa văn bản"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                            <span>Xóa</span>
                          </button>
                        )}

                        {/* Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          title="Tải tệp văn bản về thiết bị"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải về máy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full w-full py-16 text-center text-slate-500 font-medium bg-white rounded-lg border border-dashed border-slate-300 my-4">
                Chưa có văn bản/tài liệu nào trong mục này
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-green-950 text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <FileText className="w-4 h-4 text-amber-300" />
                <span>XEM NHANH VĂN BẢN QUÂN SỰ</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-gray-100">
                <span className="font-mono text-xs font-black text-emerald-950 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded">
                  Số hiệu: {previewDoc.code}
                </span>
                {getFormatBadge(previewDoc.type, previewDoc.fileSize || "1.8 MB")}
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 leading-snug">
                  {previewDoc.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-600">
                  <span>
                    Cơ quan ban hành: <strong className="text-teal-800">{previewDoc.issuer}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Ngày ban hành: <strong className="font-mono">{previewDoc.date}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Độ mật:{" "}
                    <strong
                      className={
                        previewDoc.secretLevel === "mat" ||
                        previewDoc.secretLevel === "toi_mat"
                          ? "text-red-600"
                          : "text-gray-700"
                      }
                    >
                      {previewDoc.secretLevel === "mat"
                        ? "MẬT"
                        : previewDoc.secretLevel === "toi_mat"
                        ? "TUYỆT MẬT"
                        : "Văn bản thường"}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="font-bold text-gray-700 mb-1">Trích yếu nội dung văn bản:</div>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {previewDoc.description ||
                    "Văn bản chính thức và tài liệu nghiệp vụ phục vụ chỉ huy, huấn luyện và thực hiện nhiệm vụ trong toàn đơn vị."}
                </p>
              </div>
              {previewDoc.fileName && (
                <div className="bg-teal-50/60 p-3 rounded-lg border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFormatIcon(previewDoc.type)}
                    <div>
                      <div className="font-bold text-teal-950">{previewDoc.fileName}</div>
                      <div className="text-[11px] text-teal-700 font-semibold">
                        {previewDoc.fileSize || "1.8 MB"} • Sẵn sàng tải về máy
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(previewDoc)}
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
                onClick={() => setPreviewDoc(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDoc(previewDoc)}
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
          sectionKey="doc"
          sectionTitle={title}
          categories={availableCategories}
          onClose={() => setIsCategoryModalOpen(false)}
          onSaveCategories={(newCats) => {
            if (onSaveCategories) onSaveCategories(newCats);
            setIsCategoryModalOpen(false);
          }}
          onRenameCategory={(oldCat, newCat) => {
            if (onRenameCategory) onRenameCategory(oldCat, newCat);
          }}
          onDeleteCategory={(catToDelete, fallbackCat) => {
            if (onDeleteCategory) onDeleteCategory(catToDelete, fallbackCat);
          }}
        />
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-green-950 text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <FileText className="w-4 h-4 text-amber-300" />
                <span>TẢI LÊN VĂN BẢN & CHỈ THỊ MỚI</span>
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
            <form onSubmit={handleSaveDocument} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Số / Ký hiệu văn bản (*):
                  </label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    placeholder="Ví dụ: 01/TB-e95, 95/CT-ĐU..."
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                    required
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Trích yếu / Tiêu đề văn bản (*):
                </label>
                <textarea
                  rows={2}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập trích yếu, nội dung tóm tắt của văn bản..."
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cơ quan ban hành (*):
                  </label>
                  <input
                    type="text"
                    value={formData.issuingBody}
                    onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
                    placeholder="Ví dụ: Trung đoàn 95, Ban Chính trị..."
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Người ký / Chức vụ:
                  </label>
                  <input
                    type="text"
                    value={formData.signer}
                    onChange={(e) => setFormData({ ...formData, signer: e.target.value })}
                    placeholder="Ví dụ: Chỉ huy đơn vị, Trung đoàn trưởng..."
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
                    placeholder="van-ban.pdf"
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
                    <option value="PDF">PDF</option>
                    <option value="DOCX">Word (DOCX)</option>
                    <option value="XLSX">Excel (XLSX)</option>
                    <option value="PPTX">PowerPoint (PPTX)</option>
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
                    placeholder="1.5 MB"
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đường dẫn tệp / URL tải:
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
                  disabled={isSubmittingDoc}
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoc}
                  className="px-5 py-2 rounded-lg text-xs font-extrabold bg-teal-800 hover:bg-teal-900 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingDoc ? "ĐANG LƯU..." : "LƯU VĂN BẢN VÀO KHO"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
