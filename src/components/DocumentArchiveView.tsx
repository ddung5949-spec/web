import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Download,
  Edit2,
  Edit3,
  Eye,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileType,
  Filter,
  FolderArchive,
  FolderLock,
  Grid,
  HardDriveUpload,
  Heart,
  Home,
  Info,
  Laptop,
  LayoutGrid,
  List,
  Lock,
  Plus,
  PlusCircle,
  Presentation,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Tag,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { DocumentItem, PageView, SiteConfig, User } from '../types';
import { DocumentCategoryManagerModal } from './modals/DocumentCategoryManagerModal';

interface DocumentArchiveViewProps {
  documents: DocumentItem[];
  currentUser: User | null;
  siteConfig: SiteConfig;
  onOpenAuth: () => void;
  onOpenAddDocModal: () => void;
  onDeleteDoc: (id: number) => void;
  onUpdateDoc?: (doc: DocumentItem) => void;
  onEditDoc?: (doc: DocumentItem) => void;
  onSelectSection?: (section: PageView) => void;
  onGoHome?: () => void;
  onSaveCategories?: (newCats: string[]) => void;
  onRenameCategory?: (oldCat: string, newCat: string) => void;
  onDeleteCategory?: (catToDelete: string, fallbackCat: string) => void;
  onOpenTabIntroModal?: (tabKey: string) => void;
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

export const DocumentArchiveView: React.FC<DocumentArchiveViewProps> = ({
  documents,
  currentUser,
  siteConfig,
  onOpenAuth,
  onOpenAddDocModal,
  onDeleteDoc,
  onUpdateDoc,
  onEditDoc,
  onSelectSection,
  onGoHome,
  onSaveCategories,
  onRenameCategory,
  onDeleteCategory,
  onOpenTabIntroModal,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const canUpload = !!(currentUser && (isAdmin || currentUser.canUploadDoc || currentUser.role === 'editor'));

  // Categories from config
  const configuredCategories = siteConfig.sections?.doc?.categories || DEFAULT_CATEGORIES;

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedIssuer, setSelectedIssuer] = useState<string>('all');
  const [selectedSecretLevel, setSelectedSecretLevel] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Extract unique issuers for filtering
  const uniqueIssuers = Array.from(
    new Set(documents.map((d) => d.issuer).filter(Boolean))
  );

  // Calculate total downloads
  const totalDownloads = documents.reduce((sum, d) => sum + (d.downloads || 0), 0);

  // Download handler
  const handleDownload = (doc: DocumentItem) => {
    // Increment downloads count if updater exists
    if (onUpdateDoc) {
      onUpdateDoc({
        ...doc,
        downloads: (doc.downloads || 0) + 1,
      });
    }

    const ext =
      doc.type === 'docx' || doc.type === 'doc'
        ? 'docx'
        : doc.type === 'xlsx' || doc.type === 'xls'
        ? 'xlsx'
        : doc.type === 'pptx' || doc.type === 'ppt'
        ? 'pptx'
        : doc.type === 'zip' || doc.type === 'rar'
        ? 'zip'
        : 'pdf';

    const defaultFileName =
      doc.fileName ||
      `${doc.code.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}_${doc.title.slice(0, 25)}.${ext}`;

    if (doc.fileUrl) {
      if (doc.fileUrl.startsWith('data:') || doc.fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = defaultFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Direct remote storage URL
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.target = '_blank';
        link.download = defaultFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      const blobContent = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nBỘ TƯ LỆNH SƯ ĐOÀN 10 - ĐOÀN MANG YANG\n${doc.issuer.toUpperCase()}\n--------------------\n\nSố/Ký hiệu: ${doc.code}\nNgày ban hành: ${doc.date}\nTiểu mục: ${doc.category || 'Văn bản hành chính quân sự'}\n\nTRÍCH YẾU NỘI DUNG:\n${doc.title}\n\nNỘI DUNG TÓM TẮT & HƯỚNG DẪN:\n${doc.description || 'Văn bản quy định nội bộ phục vụ công tác lãnh đạo, chỉ huy và duy trì nền nếp chính quy trong toàn đơn vị.'}\n\n(Tài liệu lưu trữ tại Kho Văn bản số - Sư đoàn 10 Anh hùng)`;
      const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName.endsWith('.txt') ? defaultFileName : `${defaultFileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getFormatBadge = (type?: string) => {
    switch (type) {
      case 'docx':
      case 'doc':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase flex items-center gap-1">
            <FileText className="w-3 h-3 text-blue-600" />
            <span>Word (.docx)</span>
          </span>
        );
      case 'xlsx':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </span>
        );
      case 'pptx':
        return (
          <span className="bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase flex items-center gap-1">
            <Presentation className="w-3 h-3 text-orange-600" />
            <span>PowerPoint</span>
          </span>
        );
      case 'pdf':
      default:
        return (
          <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase flex items-center gap-1">
            <FileType className="w-3 h-3 text-red-600" />
            <span>PDF (.pdf)</span>
          </span>
        );
    }
  };

  const getFormatIcon = (type?: string) => {
    switch (type) {
      case 'docx':
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'pptx':
        return <Presentation className="w-4 h-4 text-orange-600" />;
      case 'pdf':
      default:
        return <FileType className="w-4 h-4 text-red-600" />;
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      doc.code.toLowerCase().includes(term) ||
      doc.title.toLowerCase().includes(term) ||
      doc.issuer.toLowerCase().includes(term) ||
      (doc.description && doc.description.toLowerCase().includes(term)) ||
      (doc.category && doc.category.toLowerCase().includes(term)) ||
      doc.date.toLowerCase().includes(term);

    const matchesCategory =
      selectedCategory === 'all' ||
      doc.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesFormat =
      selectedFormat === 'all' ||
      (selectedFormat === 'docx' && (doc.type === 'docx' || doc.type === 'doc')) ||
      (selectedFormat === 'pdf' && (doc.type === 'pdf' || !doc.type)) ||
      (selectedFormat === 'xlsx' && doc.type === 'xlsx') ||
      (selectedFormat === 'pptx' && doc.type === 'pptx');

    const matchesIssuer = selectedIssuer === 'all' || doc.issuer === selectedIssuer;

    const matchesSecret =
      selectedSecretLevel === 'all' ||
      (selectedSecretLevel === 'normal' && (!doc.secretLevel || doc.secretLevel === 'normal')) ||
      (selectedSecretLevel === 'mat' && doc.secretLevel === 'mat') ||
      (selectedSecretLevel === 'toi_mat' && doc.secretLevel === 'toi_mat');

    return matchesSearch && matchesCategory && matchesFormat && matchesIssuer && matchesSecret;
  });

  const docTitle = siteConfig.sections?.doc?.title || 'Kho Văn bản - Tài liệu Quân sự';
  const docSubtitle =
    siteConfig.sections?.doc?.subTitle ||
    siteConfig.sections?.doc?.desc ||
    'Hệ thống lưu trữ chỉ thị, nghị quyết, kế hoạch tác chiến & hướng dẫn nghiệp vụ Sư đoàn 10';

  return (
    <div className="space-y-4">
      {/* 1. Clickable Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={onGoHome}
          className="hover:text-blue-800 flex items-center gap-1 cursor-pointer font-medium"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span className="text-gray-900 font-bold">{docTitle}</span>
      </nav>

      {/* 2. Top Header Banner - Matching LectureLibraryView */}
      <div className="rounded-2xl p-4 sm:p-5 text-white shadow-md bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-2 border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-400/20 rounded-xl border border-amber-300/30 text-amber-300 shrink-0">
            <FolderLock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-blue-950">
                Kho văn kiện số hóa
              </span>
              <span className="text-xs text-white/80 font-medium hidden sm:inline">
                • {documents.length} văn bản & chỉ thị lưu hành nội bộ
              </span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide text-amber-200 mt-1">
              {docTitle}
            </h1>
            <p className="text-xs text-white/85 max-w-2xl mt-0.5">
              {docSubtitle}
            </p>
          </div>
        </div>

        {/* Action buttons (Admin Edit Intro + Upload permission restricted) */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
          {isAdmin && onOpenTabIntroModal && (
            <button
              type="button"
              onClick={() => onOpenTabIntroModal('doc')}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-xs"
              title="Chỉnh sửa nội dung giới thiệu tab này"
            >
              <Edit3 className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">SỬA GIỚI THIỆU TAB</span>
            </button>
          )}

          {/* Upload Button: STRICTLY RESTRICTED by canUpload permission */}
          {canUpload && (
            <button
              type="button"
              id="btn-upload-doc"
              onClick={onOpenAddDocModal}
              className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 border border-amber-200"
            >
              <HardDriveUpload className="w-4 h-4 text-blue-900" />
              <span>LƯU TRỮ VĂN BẢN MỚI</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Structure: Left 1/4 (Categories & Stats), Right 3/4 (Content News Frames) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        {/* ================= LEFT COLUMN: 1/4 ================= */}
        <div className="lg:col-span-1 space-y-4">
          {/* Card 1: Ngăn Phân loại Danh mục Văn bản (Admin Editable Categories) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FolderArchive className="w-3.5 h-3.5 text-blue-700" />
                <span>Danh mục văn bản</span>
              </span>
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[10px] text-blue-800 hover:text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5 cursor-pointer transition-colors"
                    title="Đổi tên hoặc thêm danh mục"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Sửa mục</span>
                  </button>
                )}
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {configuredCategories.length}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderLock className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">Tất cả văn bản</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                    selectedCategory === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {documents.length}
                </span>
              </button>

              {configuredCategories.map((cat) => {
                const count = documents.filter(
                  (d) => d.category?.toLowerCase() === cat.toLowerCase()
                ).length;
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-700 text-white font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-300' : 'text-gray-400'}`} />
                      <span className="truncate">{cat}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Định dạng tệp văn bản */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="bg-gray-100/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5">
                <FileType className="w-3.5 h-3.5 text-blue-700" />
                <span>Định dạng tài liệu</span>
              </span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                5 loại
              </span>
            </div>

            <div className="p-2 space-y-1">
              {[
                { id: 'all', label: 'Tất cả định dạng', icon: FolderArchive, count: documents.length },
                {
                  id: 'docx',
                  label: 'Văn bản Word (.docx)',
                  icon: FileText,
                  count: documents.filter((d) => d.type === 'docx' || d.type === 'doc').length,
                },
                {
                  id: 'pdf',
                  label: 'Tài liệu PDF (.pdf)',
                  icon: FileType,
                  count: documents.filter((d) => d.type === 'pdf' || !d.type).length,
                },
                {
                  id: 'xlsx',
                  label: 'Bảng tính Excel (.xlsx)',
                  icon: FileSpreadsheet,
                  count: documents.filter((d) => d.type === 'xlsx').length,
                },
                {
                  id: 'pptx',
                  label: 'Báo cáo PowerPoint (.pptx)',
                  icon: Presentation,
                  count: documents.filter((d) => d.type === 'pptx').length,
                },
              ].map((item) => {
                const isSelected = selectedFormat === item.id;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFormat(item.id)}
                    className={`w-full px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-800 text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Chỉ số số hóa văn kiện */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-3.5 space-y-3">
            <div className="font-extrabold text-xs uppercase tracking-wide text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              <span>Chỉ số số hóa văn kiện</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100">
                <div className="text-base font-black text-blue-900">{documents.length}</div>
                <div className="text-[10px] text-blue-700 font-bold uppercase mt-0.5">Tổng số VB</div>
              </div>
              <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100">
                <div className="text-base font-black text-emerald-800">{totalDownloads}</div>
                <div className="text-[10px] text-emerald-700 font-bold uppercase mt-0.5">Lượt tải về</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] text-gray-600">
              <div className="flex items-center justify-between">
                <span>Cấp độ an toàn:</span>
                <span className="font-bold text-emerald-700">100% Nội bộ QS</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quản trị viên:</span>
                <span className="font-bold text-blue-800">Ban Cơ yếu / Tuyên huấn</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: 3/4 ================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search, Issuer Filter & View Controls */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              {/* Instant Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo số/ký hiệu (12/CT), trích yếu, cơ quan ban hành, từ khóa..."
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:border-blue-700 focus:outline-hidden text-xs font-medium text-gray-800"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 px-2.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Chế độ thẻ thư viện"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Dạng Thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 px-2.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Chế độ bảng danh mục"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Dạng Bảng</span>
                </button>
              </div>
            </div>

            {/* Dropdown Filters (Issuer & Secret Level) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500">Cơ quan:</span>
                <select
                  value={selectedIssuer}
                  onChange={(e) => setSelectedIssuer(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-hidden focus:border-blue-700"
                >
                  <option value="all">Tất cả cơ quan ban hành</option>
                  {uniqueIssuers.map((iss) => (
                    <option key={iss} value={iss}>
                      {iss}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500">Độ mật:</span>
                <select
                  value={selectedSecretLevel}
                  onChange={(e) => setSelectedSecretLevel(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-hidden focus:border-blue-700"
                >
                  <option value="all">Tất cả độ mật</option>
                  <option value="normal">Lưu hành nội bộ (Thường)</option>
                  <option value="mat">Văn bản Mật</option>
                  <option value="toi_mat">Văn bản Tối mật</option>
                </select>
              </div>

              <div className="ml-auto text-[11px] text-gray-500">
                Hiển thị <strong className="text-blue-800">{filteredDocuments.length}</strong> / {documents.length} văn bản
              </div>
            </div>
          </div>

          {/* Content Views: Grid or Table */}
          {filteredDocuments.length === 0 ? (
            <div className="p-10 bg-white rounded-xl border border-gray-200 text-center space-y-3">
              <FolderArchive className="w-12 h-12 text-gray-300 mx-auto" />
              <div className="text-sm font-bold text-gray-700">Không tìm thấy văn bản phù hợp</div>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Vui lòng thử đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc danh mục và cơ quan ban hành.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedFormat('all');
                  setSelectedIssuer('all');
                  setSelectedSecretLevel('all');
                }}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Top badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                        {doc.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {doc.secretLevel === 'toi_mat' ? (
                          <span className="bg-red-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>TỐI MẬT</span>
                          </span>
                        ) : doc.secretLevel === 'mat' ? (
                          <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>MẬT</span>
                          </span>
                        ) : null}
                        {getFormatBadge(doc.type)}
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => setPreviewDoc(doc)}
                      className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-800 transition-colors line-clamp-2 cursor-pointer leading-snug"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>

                    {/* Description preview */}
                    {doc.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-y-1">
                      <div className="font-semibold text-gray-700 truncate max-w-[180px]">
                        {doc.issuer}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono">{doc.date}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {doc.downloads || 0} tải
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isAdmin && onEditDoc && (
                        <button
                          type="button"
                          onClick={() => onEditDoc(doc)}
                          className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                          title="Sửa văn bản"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Đồng chí có chắc muốn xóa văn bản "${doc.code}"?`)) {
                              onDeleteDoc(doc.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Xóa văn bản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải về</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= TABLE VIEW ================= */
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100/90 text-gray-800 font-extrabold uppercase text-[11px] border-b border-gray-200">
                      <th className="p-3 w-10 text-center">STT</th>
                      <th className="p-3 w-32">Ký hiệu</th>
                      <th className="p-3">Trích yếu nội dung</th>
                      <th className="p-3 w-40">Cơ quan</th>
                      <th className="p-3 w-24 text-center">Ngày</th>
                      <th className="p-3 w-28 text-center">Định dạng</th>
                      <th className="p-3 w-28 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocuments.map((doc, idx) => (
                      <tr key={doc.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="p-3 font-mono font-black text-red-700 whitespace-nowrap">
                          {doc.code}
                        </td>
                        <td className="p-3">
                          <div
                            onClick={() => setPreviewDoc(doc)}
                            className="font-bold text-gray-900 hover:text-blue-800 cursor-pointer line-clamp-2"
                          >
                            {doc.title}
                          </div>
                          {doc.category && (
                            <span className="inline-block mt-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {doc.category}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-700 font-medium">{doc.issuer}</td>
                        <td className="p-3 text-center text-gray-500 font-mono whitespace-nowrap">
                          {doc.date}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {getFormatBadge(doc.type)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                              title="Tải về"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {isAdmin && onEditDoc && (
                              <button
                                type="button"
                                onClick={() => onEditDoc(doc)}
                                className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                                title="Sửa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Xóa văn bản "${doc.code}"?`)) {
                                    onDeleteDoc(doc.id);
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: DOCUMENT PREVIEW */}
      {previewDoc && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <span className="font-extrabold text-sm text-amber-300 uppercase tracking-wide">
                  CHI TIẾT VĂN BẢN QUÂN SỰ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                    Số: {previewDoc.code}
                  </span>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Cơ quan: <strong className="text-gray-800">{previewDoc.issuer}</strong>
                  </div>
                </div>
                <div className="text-right">
                  {getFormatBadge(previewDoc.type)}
                  <div className="text-[11px] text-gray-400 mt-1">Ngày ban hành: {previewDoc.date}</div>
                </div>
              </div>

              <div>
                <h2 className="text-sm sm:text-base font-black text-blue-950 uppercase leading-snug">
                  {previewDoc.title}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                    {previewDoc.category || 'Văn bản nội bộ'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {previewDoc.downloads || 0} lượt tải
                  </span>
                </div>
              </div>

              {previewDoc.description && (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <div className="font-bold text-gray-700 uppercase text-[10px]">Tóm tắt nội dung:</div>
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                    {previewDoc.description}
                  </p>
                </div>
              )}

              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 text-[11px] text-blue-950 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-800" />
                  <span>Quy định lưu trữ & khai thác:</span>
                </div>
                <p className="text-blue-900/90 leading-relaxed">
                  Văn bản được số hóa và lưu trữ tại Kho Tư liệu điện tử Sư đoàn 10. Phục vụ công tác tra cứu, học tập và triển khai nhiệm vụ chính trị - quân sự trong toàn đơn vị.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 px-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg cursor-pointer text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewDoc)}
                className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-lg flex items-center gap-2 shadow-xs cursor-pointer text-xs"
              >
                <Download className="w-4 h-4" />
                <span>TẢI TỆP VĂN BẢN VỀ MÁY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CATEGORY MANAGER */}
      {isCategoryModalOpen && (
        <DocumentCategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={configuredCategories}
          documents={documents}
          onSaveCategories={(newCats) => {
            if (onSaveCategories) {
              onSaveCategories(newCats);
            }
          }}
          onRenameCategory={(oldCat, newCat) => {
            if (onRenameCategory) {
              onRenameCategory(oldCat, newCat);
            }
          }}
          onDeleteCategory={(catToDelete, fallbackCat) => {
            if (onDeleteCategory) {
              onDeleteCategory(catToDelete, fallbackCat);
            }
          }}
        />
      )}
    </div>
  );
};
