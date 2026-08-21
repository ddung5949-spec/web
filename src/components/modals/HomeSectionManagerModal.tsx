import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Check,
  Code,
  Crosshair,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Globe,
  Heart,
  LayoutGrid,
  Maximize2,
  Plus,
  Save,
  Shield,
  Star,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { defaultHomeCategoryColumns } from '../../data/initialData';
import { HomeCategoryColumn, SectionType, SiteConfig } from '../../types';

interface HomeSectionManagerModalProps {
  isOpen: boolean;
  siteConfig: SiteConfig;
  onClose: () => void;
  onSaveColumns: (columns: HomeCategoryColumn[]) => void;
}

const COLOR_PRESETS = [
  { id: 'bg-red-800', label: 'Đỏ quân kỳ (CTĐ - CTCT)', preview: 'bg-red-800' },
  { id: 'bg-emerald-800', label: 'Xanh lá quân sự (Huấn luyện)', preview: 'bg-emerald-800' },
  { id: 'bg-amber-800', label: 'Nâu hổ phách (Bác Hồ)', preview: 'bg-amber-800' },
  { id: 'bg-blue-800', label: 'Xanh dương (Văn bản / Pháp luật)', preview: 'bg-blue-800' },
  { id: 'bg-indigo-900', label: 'Chàm đậm (Truyền hình / Video)', preview: 'bg-indigo-900' },
  { id: 'bg-slate-900', label: 'Xám đen hiện đại (Bản tin số)', preview: 'bg-slate-900' },
];

const ICON_OPTIONS = [
  { id: 'flag', label: 'Lá cờ Đảng / Quân kỳ', icon: Flag },
  { id: 'crosshair', label: 'Mục tiêu / Huấn luyện', icon: Crosshair },
  { id: 'heart', label: 'Trái tim / Bác Hồ', icon: Heart },
  { id: 'book', label: 'Quyển sách / Giáo trình', icon: BookOpen },
  { id: 'shield', label: 'Khiên bảo vệ / Quân sự', icon: Shield },
  { id: 'award', label: 'Huân chương / Thi đua', icon: Award },
  { id: 'star', label: 'Ngôi sao / Tiêu biểu', icon: Star },
  { id: 'video', label: 'Phát thanh / Video', icon: Video },
  { id: 'code', label: 'Mã nhúng / Iframe', icon: Code },
  { id: 'globe', label: 'Toàn cảnh / Thời sự', icon: Globe },
];

export const HomeSectionManagerModal: React.FC<HomeSectionManagerModalProps> = ({
  isOpen,
  siteConfig,
  onClose,
  onSaveColumns,
}) => {
  const currentColumns =
    siteConfig.homeCategoryColumns !== undefined
      ? siteConfig.homeCategoryColumns
      : defaultHomeCategoryColumns;

  const [columns, setColumns] = useState<HomeCategoryColumn[]>(currentColumns);
  const [editingCol, setEditingCol] = useState<HomeCategoryColumn | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<'category_articles' | 'embed_code'>('category_articles');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formSectionKey, setFormSectionKey] = useState<SectionType | string>('ctd');
  const [formCategoryFilter, setFormCategoryFilter] = useState('');
  const [formEmbedCode, setFormEmbedCode] = useState('');
  const [formHeaderBgColor, setFormHeaderBgColor] = useState('bg-red-800');
  const [formIconName, setFormIconName] = useState('flag');
  const [formArticleLimit, setFormArticleLimit] = useState(5);
  const [formColSpan, setFormColSpan] = useState<'1' | '2' | '3' | 'full'>('1');
  const [formHeightMode, setFormHeightMode] = useState<'auto' | 'compact' | 'expanded'>('auto');

  React.useEffect(() => {
    if (siteConfig.homeCategoryColumns !== undefined) {
      setColumns(siteConfig.homeCategoryColumns);
    } else {
      setColumns(defaultHomeCategoryColumns);
    }
  }, [siteConfig.homeCategoryColumns, isOpen]);

  if (!isOpen) return null;

  const handleStartCreate = (type: 'category_articles' | 'embed_code' = 'category_articles') => {
    setIsCreating(true);
    setEditingCol(null);
    setConfirmDeleteId(null);
    setFormType(type);
    setFormTitle(type === 'embed_code' ? 'BẢN TIN NHÚNG TRUYỀN HÌNH / BÁO CHÍ' : 'CHUYÊN MỤC TIN MỚI');
    setFormSubtitle(type === 'embed_code' ? 'Khung phát sóng hoặc tin tức nhúng từ nguồn ngoài' : 'Tổng hợp các bài viết mới');
    setFormSectionKey('ctd');
    setFormCategoryFilter('');
    setFormEmbedCode(
      type === 'embed_code'
        ? '<div class="p-4 bg-slate-900 text-white rounded-xl text-center"><p class="text-sm font-bold text-amber-300">Khung truyền thông / Video nhúng</p><p class="text-xs text-gray-300 mt-1">Dán thẻ iframe, YouTube embed hoặc mã nhúng HTML vào đây</p></div>'
        : ''
    );
    setFormHeaderBgColor(type === 'embed_code' ? 'bg-indigo-900' : 'bg-red-800');
    setFormIconName(type === 'embed_code' ? 'video' : 'flag');
    setFormArticleLimit(5);
    setFormColSpan('1');
    setFormHeightMode('auto');
  };

  const handleStartEdit = (col: HomeCategoryColumn) => {
    setEditingCol(col);
    setIsCreating(false);
    setConfirmDeleteId(null);
    setFormType(col.type || 'category_articles');
    setFormTitle(col.title);
    setFormSubtitle(col.subtitle || '');
    setFormSectionKey(col.sectionKey || 'ctd');
    setFormCategoryFilter(col.categoryFilter || '');
    setFormEmbedCode(col.embedCode || col.embedHtml || '');
    setFormHeaderBgColor(col.headerBgColor || 'bg-red-800');
    setFormIconName(col.iconName || 'flag');
    setFormArticleLimit(col.articleLimit || 5);
    setFormColSpan(col.colSpan || '1');
    setFormHeightMode(col.heightMode || 'auto');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tiêu đề chuyên mục!');
      return;
    }

    const payload: HomeCategoryColumn = {
      id: editingCol ? editingCol.id : `col-${Date.now()}`,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      type: formType,
      sectionKey: formType === 'category_articles' ? formSectionKey : undefined,
      categoryFilter: formType === 'category_articles' ? formCategoryFilter : undefined,
      embedCode: formType === 'embed_code' ? formEmbedCode : undefined,
      embedHtml: formType === 'embed_code' ? formEmbedCode : undefined,
      headerBgColor: formHeaderBgColor,
      headerTextColor: 'text-amber-200',
      iconName: formIconName,
      articleLimit: formArticleLimit,
      colSpan: formColSpan,
      heightMode: formHeightMode,
      enabled: editingCol ? editingCol.enabled : true,
    };

    let updated: HomeCategoryColumn[];
    if (editingCol) {
      updated = columns.map((c) => (c.id === editingCol.id ? payload : c));
    } else {
      updated = [...columns, payload];
    }

    setColumns(updated);
    onSaveColumns(updated);
    setEditingCol(null);
    setIsCreating(false);
  };

  const handleDeleteColumn = (id: string) => {
    const updated = columns.filter((c) => c.id !== id);
    setColumns(updated);
    onSaveColumns(updated);
    if (editingCol?.id === id) {
      setEditingCol(null);
    }
    setConfirmDeleteId(null);
  };

  const handleToggleColumn = (id: string) => {
    const updated = columns.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setColumns(updated);
    onSaveColumns(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...columns];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setColumns(updated);
    onSaveColumns(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= columns.length - 1) return;
    const updated = [...columns];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setColumns(updated);
    onSaveColumns(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-linear-to-r from-red-900 via-red-800 to-rose-950 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl border border-white/20">
              <LayoutGrid className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide">
                Quản lý Chuyên mục & Nội dung nhúng Trang chủ
              </h3>
              <p className="text-[11px] text-white/80">
                Tùy biến kích thước, số bài viết, chiều cao tự động và nhúng nguồn tin linh hoạt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-gray-50/50">
          {/* Main Action Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs font-bold text-gray-700">
              Danh sách chuyên mục cuối Trang chủ ({columns.length})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartCreate('category_articles')}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm chuyên mục tin</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartCreate('embed_code')}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Code className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Thêm khối nhúng (Iframe/Video)</span>
              </button>
            </div>
          </div>

          {/* Form Editor when creating or editing */}
          {(isCreating || editingCol) && (
            <form
              onSubmit={handleSaveForm}
              className="bg-white p-4 rounded-xl border-2 border-red-500/40 shadow-md space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-extrabold text-xs text-red-900 uppercase flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-red-700" />
                  <span>
                    {editingCol ? 'Chỉnh sửa chuyên mục' : 'Thêm mới chuyên mục Trang chủ'}
                  </span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                  {formType === 'embed_code' ? 'Khung nhúng HTML / Iframe' : 'Bài viết chuyên mục'}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tiêu đề chuyên mục <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="VD: CÔNG TÁC ĐẢNG - CTCT, HUẤN LUYỆN & SSCĐ..."
                    className="w-full text-xs font-bold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dòng mô tả phụ (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="VD: Tin tức tư tưởng & xây dựng Đảng..."
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Width / Grid Span & Height customization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <div>
                  <label className="block text-xs font-extrabold text-amber-950 mb-1">
                    Kích thước chiều rộng:
                  </label>
                  <select
                    value={formColSpan}
                    onChange={(e) => setFormColSpan(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-1.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="1">1 Cột (Tiêu chuẩn 1/3)</option>
                    <option value="2">2 Cột (Rộng 2/3 trang)</option>
                    <option value="3">3 Cột (Toàn chiều rộng)</option>
                    <option value="full">Toàn chiều rộng (Full Grid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-amber-950 mb-1">
                    Chiều cao khung:
                  </label>
                  <select
                    value={formHeightMode}
                    onChange={(e) => setFormHeightMode(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-1.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="auto">Tự động co giãn theo tin tức</option>
                    <option value="compact">Gọn gàng (Compact)</option>
                    <option value="expanded">Mở rộng (Expanded)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-amber-950 mb-1">
                    Số bài viết hiển thị:
                  </label>
                  <select
                    value={formArticleLimit}
                    onChange={(e) => setFormArticleLimit(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-1.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value={3}>3 bài viết</option>
                    <option value={4}>4 bài viết</option>
                    <option value={5}>5 bài viết</option>
                    <option value={6}>6 bài viết</option>
                    <option value={8}>8 bài viết</option>
                    <option value={10}>10 bài viết</option>
                  </select>
                </div>
              </div>

              {/* If Type is category_articles */}
              {formType === 'category_articles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Thuộc mục chính (Section)
                    </label>
                    <select
                      value={formSectionKey}
                      onChange={(e) => setFormSectionKey(e.target.value as SectionType)}
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
                    >
                      <option value="ctd">Công tác Đảng - CTCT (ctd)</option>
                      <option value="hl">Huấn luyện & SSCĐ (hl)</option>
                      <option value="bac">Học tập theo Bác (bac)</option>
                      <option value="doc">Kho Văn bản - Chỉ thị (doc)</option>
                      <option value="lecture">Bài giảng số hóa (lecture)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Lọc chuyên mục con (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={formCategoryFilter}
                      onChange={(e) => setFormCategoryFilter(e.target.value)}
                      placeholder="Để trống để hiển thị tất cả các bài trong mục"
                      className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* If Type is embed_code */}
              {formType === 'embed_code' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Mã nhúng HTML / Thẻ Iframe / Video / Widget</span>
                    <span className="text-[10px] text-gray-400 font-normal">Hỗ trợ iframe YouTube, bản đồ, bản tin đài TH</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formEmbedCode}
                    onChange={(e) => setFormEmbedCode(e.target.value)}
                    placeholder='VD: <iframe src="https://..." width="100%" height="240"></iframe>'
                    className="w-full font-mono text-[11px] p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-900 text-emerald-400"
                  />
                </div>
              )}

              {/* Visual Colors & Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Màu nền tiêu đề
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setFormHeaderBgColor(color.id)}
                        className={`w-7 h-7 rounded-lg ${color.preview} border-2 transition-all cursor-pointer flex items-center justify-center ${
                          formHeaderBgColor === color.id ? 'border-amber-400 scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        title={color.label}
                      >
                        {formHeaderBgColor === color.id && <Check className="w-3.5 h-3.5 text-amber-300" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Biểu tượng đại diện
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ICON_OPTIONS.map((ico) => {
                      const IconComp = ico.icon;
                      return (
                        <button
                          key={ico.id}
                          type="button"
                          onClick={() => setFormIconName(ico.id)}
                          className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-center ${
                            formIconName === ico.id
                              ? 'bg-red-800 text-amber-300 border-red-900 shadow-2xs scale-105'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                          title={ico.label}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCol(null);
                    setIsCreating(false);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingCol ? 'Lưu thay đổi' : 'Thêm chuyên mục'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Columns */}
          <div className="space-y-2">
            {columns.map((col, index) => {
              const isEmbed = col.type === 'embed_code';
              return (
                <div
                  key={col.id}
                  className={`p-3 bg-white rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                    col.enabled !== false ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-6 text-center font-bold text-xs text-gray-400 shrink-0">
                      {index + 1}.
                    </div>
                    <div
                      className={`w-8 h-8 rounded-lg ${
                        col.headerBgColor || 'bg-red-800'
                      } text-amber-300 flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {isEmbed ? <Code className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-gray-900 uppercase truncate">
                          {col.title}
                        </span>
                        {col.colSpan && col.colSpan !== '1' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                            {col.colSpan === 'full' || col.colSpan === '3' ? 'Toàn chiều rộng' : `${col.colSpan} Cột`}
                          </span>
                        )}
                        {isEmbed && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                            Nhúng mã nguồn
                          </span>
                        )}
                        {col.enabled === false && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-200 text-gray-600">
                            Đang ẩn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {col.subtitle || (isEmbed ? 'Mã nhúng iframe / video' : `Section: ${col.sectionKey}`)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleColumn(col.id)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        col.enabled !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      }`}
                      title={col.enabled !== false ? 'Ẩn chuyên mục' : 'Hiện chuyên mục'}
                    >
                      {col.enabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Di chuyển lên trước"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === columns.length - 1}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Di chuyển xuống sau"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(col)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa nội dung / kích thước"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Safe in-modal deletion without window.confirm */}
                    {confirmDeleteId === col.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(col.id)}
                          className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[11px] font-bold cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(col.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa chuyên mục này khỏi Trang chủ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>* Chiều cao các chuyên mục tự động co giãn theo tin bài hiển thị thực tế.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
