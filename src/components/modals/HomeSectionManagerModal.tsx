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
import { defaultCategoriesConfig } from '../../data/initialData';
import { CategoryConfig, HomeCategoryColumn, SectionType, SiteConfig } from '../../types';
import { toast } from '../Toast';
import { getSupabase, supabase } from '../../utils/supabase';

export function normalizeYouTubeEmbedUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const iframeSrcMatch = trimmed.match(/src=["'](.*?)["']/);
  const target = iframeSrcMatch ? iframeSrcMatch[1] : trimmed;

  const match = target.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return target;
}

export interface HomeSectionManagerModalProps {
  isOpen: boolean;
  siteConfig: SiteConfig;
  categories?: CategoryConfig[];
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
  categories,
  onClose,
  onSaveColumns,
}) => {
  // Lấy danh sách chuyên mục động thực tế từ hệ thống (ưu tiên categories prop, rồi siteConfig.categories_config)
  const availableCategories: CategoryConfig[] = React.useMemo(() => {
    const raw =
      (Array.isArray(categories) && categories.length > 0 ? categories : null) ||
      (Array.isArray(siteConfig.categories_config) && siteConfig.categories_config.length > 0
        ? siteConfig.categories_config
        : null) ||
      (Array.isArray(siteConfig.categories) && siteConfig.categories.length > 0
        ? (siteConfig.categories as any[])
        : null) ||
      defaultCategoriesConfig;
    return raw.filter((c: any) => c && typeof c === 'object');
  }, [categories, siteConfig.categories_config, siteConfig.categories]);

  // Tạo danh sách cột chuyên mục mặc định đồng bộ 100% theo categories thực tế (Không dùng 3 danh mục tĩnh cũ)
  const getDefaultDynamicColumns = React.useCallback((): HomeCategoryColumn[] => {
    const validCats = availableCategories.filter(
      (c) => c.enabled !== false && c.type !== 'external'
    );
    const colorPresets = ['bg-red-800', 'bg-emerald-800', 'bg-amber-800', 'bg-blue-800', 'bg-indigo-900', 'bg-slate-900'];
    return validCats.map((cat, idx) => ({
      id: `col-${cat.id}`,
      title: cat.name,
      subtitle:
        Array.isArray(cat.subcategories) && cat.subcategories.length > 0
          ? cat.subcategories.join(' • ')
          : cat.description || '',
      type: 'category_articles',
      sectionKey: cat.id,
      categoryFilter: 'all',
      articleLimit: 5,
      headerBgColor: colorPresets[idx % colorPresets.length],
      headerTextColor: 'text-amber-200',
      iconName: idx % 3 === 0 ? 'flag' : idx % 3 === 1 ? 'crosshair' : 'heart',
      enabled: true,
      colSpan: '1',
      heightMode: 'auto',
    }));
  }, [availableCategories]);

  // Hàm tự động đồng bộ tên và tiểu mục mới nhất từ Tab 3, Tab 4 vào các cột
  const syncColumnsWithCategories = React.useCallback(
    (cols: HomeCategoryColumn[]): HomeCategoryColumn[] => {
      return cols.map((col) => {
        if (col.type === 'embed_code' || (col.type as string) === 'video' || (col.type as string) === 'embed') return col;
        const matched = availableCategories.find(
          (c) => c.id === col.sectionKey || c.sectionKey === col.sectionKey
        );
        if (matched) {
          return {
            ...col,
            title: matched.name || col.title,
            subtitle:
              Array.isArray(matched.subcategories) && matched.subcategories.length > 0
                ? matched.subcategories.join(' • ')
                : col.subtitle || '',
          };
        }
        return col;
      });
    },
    [availableCategories]
  );

  const getInitialColumns = (): HomeCategoryColumn[] => {
    const rawCols =
      Array.isArray((siteConfig as any)?.home_layout) && (siteConfig as any).home_layout.length > 0
        ? (siteConfig as any).home_layout
        : siteConfig.homeCategoryColumns && siteConfig.homeCategoryColumns.length > 0
        ? siteConfig.homeCategoryColumns
        : getDefaultDynamicColumns();
    return syncColumnsWithCategories(rawCols);
  };

  const [columns, setColumns] = useState<HomeCategoryColumn[]>(getInitialColumns);
  const [editingCol, setEditingCol] = useState<HomeCategoryColumn | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<'category_articles' | 'embed_code'>('category_articles');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formSectionKey, setFormSectionKey] = useState<SectionType | string>('ctd');
  const [formCategoryFilter, setFormCategoryFilter] = useState('all');
  const [formEmbedCode, setFormEmbedCode] = useState('');
  const [formHeaderBgColor, setFormHeaderBgColor] = useState('bg-red-800');
  const [formIconName, setFormIconName] = useState('flag');
  const [formArticleLimit, setFormArticleLimit] = useState(5);
  const [formColSpan, setFormColSpan] = useState<'1' | '2' | '3' | 'full'>('1');
  const [formHeightMode, setFormHeightMode] = useState<'auto' | 'compact' | 'expanded'>('auto');

  React.useEffect(() => {
    const rawCols =
      Array.isArray((siteConfig as any)?.home_layout) && (siteConfig as any).home_layout.length > 0
        ? (siteConfig as any).home_layout
        : siteConfig.homeCategoryColumns && siteConfig.homeCategoryColumns.length > 0
        ? siteConfig.homeCategoryColumns
        : getDefaultDynamicColumns();
    setColumns(syncColumnsWithCategories(rawCols));
  }, [siteConfig.homeCategoryColumns, (siteConfig as any)?.home_layout, availableCategories, isOpen]);

  if (!isOpen) return null;

  // Lưu trực tiếp lên Supabase và cập nhật State Trang chủ
  const persistColumns = async (updated: HomeCategoryColumn[]) => {
    setColumns(updated);
    onSaveColumns(updated);
    try {
      localStorage.setItem('cached_home_layout', JSON.stringify(updated));
      localStorage.setItem('cached_home_category_columns', JSON.stringify(updated));
    } catch {}

    try {
      const client = supabase || getSupabase();
      if (client) {
        let { error } = await client
          .from('site_config')
          .upsert(
            {
              id: 'default',
              home_layout: updated,
              home_category_columns: updated,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (error) {
          await client
            .from('site_config')
            .upsert(
              {
                id: 'default',
                home_layout: updated,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
        }
      }
    } catch (err) {
      console.warn('[HomeSectionManagerModal] Supabase save warning:', err);
    }
  };

  const handleStartCreate = (type: 'category_articles' | 'embed_code' = 'category_articles') => {
    setIsCreating(true);
    setEditingCol(null);
    setConfirmDeleteId(null);
    setFormType(type);
    const firstCat = availableCategories[0];
    const initialKey = firstCat ? firstCat.id : 'ctd';
    setFormSectionKey(initialKey);
    setFormTitle(
      type === 'embed_code'
        ? 'BẢN TIN NHÚNG TRUYỀN HÌNH / BÁO CHÍ'
        : firstCat?.name || 'CHUYÊN MỤC TIN MỚI'
    );
    setFormSubtitle(
      type === 'embed_code'
        ? 'Khung phát sóng hoặc tin tức nhúng từ nguồn ngoài'
        : Array.isArray(firstCat?.subcategories) && firstCat.subcategories.length > 0
        ? firstCat.subcategories.join(' • ')
        : ''
    );
    setFormCategoryFilter('all');
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
    const matched = availableCategories.find(
      (c) => c.id === col.sectionKey || c.sectionKey === col.sectionKey
    );
    setFormTitle(matched?.name || col.title);
    setFormSubtitle(
      Array.isArray(matched?.subcategories) && matched.subcategories.length > 0
        ? matched.subcategories.join(' • ')
        : col.subtitle || ''
    );
    setFormSectionKey(col.sectionKey || availableCategories[0]?.id || 'ctd');
    setFormCategoryFilter(col.categoryFilter || 'all');
    setFormEmbedCode(col.embedCode || col.embedHtml || '');
    setFormHeaderBgColor(col.headerBgColor || 'bg-red-800');
    setFormIconName(col.iconName || 'flag');
    setFormArticleLimit(col.articleLimit || 5);
    setFormColSpan(col.colSpan || '1');
    setFormHeightMode(col.heightMode || 'auto');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tiêu đề chuyên mục!');
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

    await persistColumns(updated);
    toast.success('Thành công', editingCol ? 'Đã cập nhật chuyên mục' : 'Đã thêm chuyên mục mới');
    setEditingCol(null);
    setIsCreating(false);
  };

  const handleDeleteColumn = async (id: string) => {
    const updated = columns.filter((c) => c.id !== id);
    await persistColumns(updated);
    if (editingCol?.id === id) {
      setEditingCol(null);
    }
    setConfirmDeleteId(null);
    toast.info('Đã xóa', 'Đã xóa khối chuyên mục khỏi trang chủ');
  };

  const handleToggleColumn = async (id: string) => {
    const updated = columns.map((c) => (c.id === id ? { ...c, enabled: c.enabled === false } : c));
    await persistColumns(updated);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const updated = [...columns];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    await persistColumns(updated);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= columns.length - 1) return;
    const updated = [...columns];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    await persistColumns(updated);
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
                Tự động đồng bộ theo danh mục và tiểu mục hệ thống, cập nhật trực tiếp lên CSDL
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

              {/* Dynamic Category & Subcategory Selection */}
              {formType === 'category_articles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-red-50/50 rounded-xl border border-red-200">
                  <div>
                    <label className="block text-xs font-black text-red-950 mb-1 flex items-center justify-between">
                      <span>CHỌN CHUYÊN MỤC HỆ THỐNG <span className="text-red-600">*</span></span>
                      <span className="text-[10px] text-red-700 font-normal">Đồng bộ từ Tab 3 & 4</span>
                    </label>
                    <select
                      value={formSectionKey}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setFormSectionKey(newKey);
                        const selCat = availableCategories.find((c) => c.id === newKey);
                        if (selCat) {
                          setFormTitle(selCat.name);
                          setFormSubtitle(
                            Array.isArray(selCat.subcategories) && selCat.subcategories.length > 0
                              ? selCat.subcategories.join(' • ')
                              : selCat.description || ''
                          );
                          setFormCategoryFilter('all');
                        }
                      }}
                      className="w-full text-xs font-bold px-3 py-2 border border-red-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer shadow-2xs"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.navName || cat.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-red-950 mb-1 flex items-center justify-between">
                      <span>LỌC TIỂU MỤC CON</span>
                      <span className="text-[10px] text-red-700 font-normal">Tự động theo chuyên mục</span>
                    </label>
                    {(() => {
                      const currentSelectedCat = availableCategories.find(
                        (c) => c.id === formSectionKey
                      );
                      const subList = currentSelectedCat?.subcategories || [];
                      return (
                        <select
                          value={formCategoryFilter}
                          onChange={(e) => setFormCategoryFilter(e.target.value)}
                          className="w-full text-xs font-medium px-3 py-2 border border-red-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer shadow-2xs"
                        >
                          <option value="all">
                            Tất cả bài viết trong chuyên mục ({currentSelectedCat?.name || formSectionKey})
                          </option>
                          {subList.map((sub, idx) => (
                            <option key={idx} value={sub}>
                              Tiểu mục: {sub}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tiêu đề khối chuyên mục <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="VD: TUYÊN TRUYỀN GIÁO DỤC, THỰC HÀNH THEO BÁC..."
                    className="w-full text-xs font-bold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dòng mô tả tiểu mục phụ bên dưới
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="VD: Tiểu mục 1 • Tiểu mục 2 • Tiểu mục 3..."
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
              const matched = availableCategories.find(
                (c) => c.id === col.sectionKey || c.sectionKey === col.sectionKey
              );
              const displayTitle = matched?.name || col.title;
              const displaySubtitle =
                Array.isArray(matched?.subcategories) && matched.subcategories.length > 0
                  ? matched.subcategories.join(' • ')
                  : col.subtitle;

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
                          {displayTitle}
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
                        {displaySubtitle || (isEmbed ? 'Mã nhúng iframe / video' : `Mục: ${col.sectionKey}`)}
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
          <span>* Các thay đổi được lưu tự động lên CSDL Supabase và cập nhật tức thì ngoài trang chủ.</span>
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
