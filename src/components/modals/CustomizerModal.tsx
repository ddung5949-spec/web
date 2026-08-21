import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  Check,
  Clock,
  Crosshair,
  Edit2,
  ExternalLink,
  FolderLock,
  Globe,
  Heart,
  ImageIcon,
  Info,
  Laptop,
  Layers,
  Link as LinkIcon,
  Maximize2,
  Megaphone,
  Menu as MenuIcon,
  MoveDown,
  MoveUp,
  Newspaper,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  UsersRound,
  X,
} from 'lucide-react';
import {
  Article,
  CustomMenuItem,
  PageView,
  SectionConfigItem,
  SectionType,
  SiteConfig,
} from '../../types';
import { defaultSiteConfig } from '../../data/initialData';
import { UnitLogo } from '../UnitLogo';

interface CustomizerModalProps {
  isOpen: boolean;
  siteConfig: SiteConfig;
  articles?: Article[];
  onClose: () => void;
  onSave: (
    config: SiteConfig,
    categoryRenames?: { sectionKey: SectionType; oldName: string; newName: string }[]
  ) => void;
}

type TabType = 'logo' | 'ticker' | 'sections' | 'menu' | 'theme' | 'footer';

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  siteConfig,
  articles = [],
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('logo');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState(siteConfig?.title || defaultSiteConfig.title);
  const [subtitle, setSubtitle] = useState(siteConfig?.subtitle || defaultSiteConfig.subtitle);
  const [slogan, setSlogan] = useState(siteConfig?.slogan || defaultSiteConfig.slogan);
  const [ticker, setTicker] = useState(siteConfig?.ticker || defaultSiteConfig.ticker);
  const [colorRed, setColorRed] = useState(siteConfig?.colorRed || '#b91c1c');
  const [colorGreen, setColorGreen] = useState(siteConfig?.colorGreen || '#143d2b');
  const [establishedDate, setEstablishedDate] = useState(siteConfig?.establishedDate || '23/8/1945');
  const [logoType, setLogoType] = useState<'official_vector' | 'custom_image'>(
    siteConfig?.logoType || 'official_vector'
  );
  const [customLogoUrl, setCustomLogoUrl] = useState(siteConfig?.customLogoUrl || '');
  const [enableLogoBeam, setEnableLogoBeam] = useState(siteConfig?.enableLogoBeam !== false);
  const [enableLogoGlow, setEnableLogoGlow] = useState(siteConfig?.enableLogoGlow !== false);
  const [logoSizePx, setLogoSizePx] = useState(siteConfig?.logoSizePx || 48);
  const [footerLogoSizePx, setFooterLogoSizePx] = useState(siteConfig?.footerLogoSizePx || 38);

  // Ticker states
  const [tickerMode, setTickerMode] = useState<'manual' | 'auto_today' | 'auto_days' | 'combined'>(
    siteConfig?.tickerMode || 'combined'
  );
  const [tickerDays, setTickerDays] = useState<number>(siteConfig?.tickerDays ?? 3);
  const [tickerCustomList, setTickerCustomList] = useState<string[]>(
    siteConfig?.tickerCustomList || [
      'Chào mừng kỷ niệm ngày truyền thống Sư đoàn 10 - Đoàn Mang Yang anh hùng!',
      'Toàn đơn vị duy trì nghiêm chế độ trực ban, trực chỉ huy, sẵn sàng chiến đấu cao.',
      'Các chi bộ, đảng bộ trực thuộc hoàn thành việc học tập, quán triệt các Nghị quyết mới.',
    ]
  );
  const [tickerSpeed, setTickerSpeed] = useState<'slow' | 'normal' | 'fast'>(
    siteConfig?.tickerSpeed || 'normal'
  );
  const [tickerPrefix, setTickerPrefix] = useState(siteConfig?.tickerPrefix || 'Bản tin nội bộ');
  const [newTickerInput, setNewTickerInput] = useState('');
  const [editingTickerIdx, setEditingTickerIdx] = useState<number | null>(null);
  const [editingTickerVal, setEditingTickerVal] = useState('');

  // Custom Menu items state
  const [customMenuItems, setCustomMenuItems] = useState<CustomMenuItem[]>(
    siteConfig?.customMenuItems || defaultSiteConfig.customMenuItems || []
  );
  const [newMenuTitle, setNewMenuTitle] = useState('');
  const [newMenuType, setNewMenuType] = useState<'internal' | 'external'>('external');
  const [newMenuTargetPage, setNewMenuTargetPage] = useState<PageView>('home');
  const [newMenuExternalUrl, setNewMenuExternalUrl] = useState('');
  const [newMenuOpenNewTab, setNewMenuOpenNewTab] = useState(true);

  // Sections State with safe fallback merging
  const [sections, setSections] = useState({
    ...defaultSiteConfig.sections,
    ...(siteConfig?.sections || {}),
  });
  const [selectedSectionKey, setSelectedSectionKey] = useState<
    'ctd' | 'hl' | 'bac' | 'doc' | 'lecture' | 'meeting'
  >('ctd');

  // Sub-category management states
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState<string>('');
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [pendingRenames, setPendingRenames] = useState<
    { sectionKey: SectionType; oldName: string; newName: string }[]
  >([]);

  // Footer & contact states
  const [footerUnitName, setFooterUnitName] = useState(
    siteConfig?.footerUnitName || defaultSiteConfig.footerUnitName || 'Sư đoàn 10 - Đoàn Mang Yang anh hùng'
  );
  const [footerAddress, setFooterAddress] = useState(
    siteConfig?.footerAddress || defaultSiteConfig.footerAddress || 'Thành phố Pleiku, Tỉnh Gia Lai (Địa bàn đóng quân Sư đoàn 10)'
  );
  const [footerHotline, setFooterHotline] = useState(
    siteConfig?.footerHotline || defaultSiteConfig.footerHotline || '069.xxx.xxx (Trực ban Tác chiến / Ban Tuyên huấn)'
  );
  const [footerEmail, setFooterEmail] = useState(
    siteConfig?.footerEmail || defaultSiteConfig.footerEmail || 'tuyenhuan.mangyang@bqp.vn'
  );
  const [footerBgColor, setFooterBgColor] = useState(
    siteConfig?.footerBgColor || defaultSiteConfig.footerBgColor || '#143d2b'
  );
  const [footerSloganBgColor, setFooterSloganBgColor] = useState(
    siteConfig?.footerSloganBgColor || defaultSiteConfig.footerSloganBgColor || '#0a2318'
  );
  const [footerAccentColor, setFooterAccentColor] = useState(
    siteConfig?.footerAccentColor || defaultSiteConfig.footerAccentColor || '#fbbf24'
  );
  const [footerLayout, setFooterLayout] = useState<'split' | 'centered' | 'compact'>(
    siteConfig?.footerLayout || 'split'
  );
  const [footerShowLogo, setFooterShowLogo] = useState(siteConfig?.footerShowLogo !== false);
  const [footerShowAddress, setFooterShowAddress] = useState(siteConfig?.footerShowAddress !== false);
  const [footerShowContact, setFooterShowContact] = useState(siteConfig?.footerShowContact !== false);
  const [footerShowSlogan, setFooterShowSlogan] = useState(siteConfig?.footerShowSlogan !== false);
  const [footerShowBackToTop, setFooterShowBackToTop] = useState(siteConfig?.footerShowBackToTop !== false);

  useEffect(() => {
    if (isOpen) {
      setTitle(siteConfig?.title || defaultSiteConfig.title);
      setSubtitle(siteConfig?.subtitle || defaultSiteConfig.subtitle);
      setSlogan(siteConfig?.slogan || defaultSiteConfig.slogan);
      setTicker(siteConfig?.ticker || defaultSiteConfig.ticker);
      setColorRed(siteConfig?.colorRed || '#b91c1c');
      setColorGreen(siteConfig?.colorGreen || '#143d2b');
      setEstablishedDate(siteConfig?.establishedDate || '23/8/1945');
      setLogoType(siteConfig?.logoType || 'official_vector');
      setCustomLogoUrl(siteConfig?.customLogoUrl || '');
      setEnableLogoBeam(siteConfig?.enableLogoBeam !== false);
      setEnableLogoGlow(siteConfig?.enableLogoGlow !== false);
      setLogoSizePx(siteConfig?.logoSizePx || 48);
      setFooterLogoSizePx(siteConfig?.footerLogoSizePx || 38);
      setTickerMode(siteConfig?.tickerMode || 'combined');
      setTickerDays(siteConfig?.tickerDays ?? 3);
      setTickerCustomList(
        siteConfig?.tickerCustomList || [
          'Chào mừng kỷ niệm ngày truyền thống Sư đoàn 10 - Đoàn Mang Yang anh hùng!',
          'Toàn đơn vị duy trì nghiêm chế độ trực ban, trực chỉ huy, sẵn sàng chiến đấu cao.',
          'Các chi bộ, đảng bộ trực thuộc hoàn thành việc học tập, quán triệt các Nghị quyết mới.',
        ]
      );
      setTickerSpeed(siteConfig?.tickerSpeed || 'normal');
      setTickerPrefix(siteConfig?.tickerPrefix || 'Bản tin nội bộ');
      setNewTickerInput('');
      setEditingTickerIdx(null);
      setCustomMenuItems(
        siteConfig?.customMenuItems || defaultSiteConfig.customMenuItems || []
      );
      setSections({
        ...defaultSiteConfig.sections,
        ...(siteConfig?.sections || {}),
      });
      setFooterUnitName(siteConfig?.footerUnitName || defaultSiteConfig.footerUnitName || 'Sư đoàn 10 - Đoàn Mang Yang anh hùng');
      setFooterAddress(
        siteConfig?.footerAddress || defaultSiteConfig.footerAddress || 'Thành phố Pleiku, Tỉnh Gia Lai (Địa bàn đóng quân Sư đoàn 10)'
      );
      setFooterHotline(
        siteConfig?.footerHotline || defaultSiteConfig.footerHotline || '069.xxx.xxx (Trực ban Tác chiến / Ban Tuyên huấn)'
      );
      setFooterEmail(siteConfig?.footerEmail || defaultSiteConfig.footerEmail || 'tuyenhuan.mangyang@bqp.vn');
      setFooterBgColor(siteConfig?.footerBgColor || defaultSiteConfig.footerBgColor || '#143d2b');
      setFooterSloganBgColor(siteConfig?.footerSloganBgColor || defaultSiteConfig.footerSloganBgColor || '#0a2318');
      setFooterAccentColor(siteConfig?.footerAccentColor || defaultSiteConfig.footerAccentColor || '#fbbf24');
      setFooterLayout(siteConfig?.footerLayout || 'split');
      setFooterShowLogo(siteConfig?.footerShowLogo !== false);
      setFooterShowAddress(siteConfig?.footerShowAddress !== false);
      setFooterShowContact(siteConfig?.footerShowContact !== false);
      setFooterShowSlogan(siteConfig?.footerShowSlogan !== false);
      setFooterShowBackToTop(siteConfig?.footerShowBackToTop !== false);
      setPendingRenames([]);
      setEditingCategoryIndex(null);
      setNewCategoryInput('');
    }
  }, [siteConfig, isOpen]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, JPEG, WEBP, SVG)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setCustomLogoUrl(result);
        setLogoType('custom_image');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Handle section fields change
  const handleSectionFieldChange = (field: string, val: string) => {
    setSections((prev) => ({
      ...prev,
      [selectedSectionKey]: {
        ...prev[selectedSectionKey],
        [field]: val,
      },
    }));
  };

  // Subcategories logic
  const currentSectionData = sections[selectedSectionKey] as SectionConfigItem | undefined;
  const currentCategories = currentSectionData?.categories || [];

  const handleStartEditCategory = (idx: number, currentVal: string) => {
    setEditingCategoryIndex(idx);
    setEditingCategoryValue(currentVal);
  };

  const handleSaveEditCategory = (idx: number) => {
    if (!editingCategoryValue.trim()) return;
    const oldName = currentCategories[idx];
    const newName = editingCategoryValue.trim();

    if (oldName === newName) {
      setEditingCategoryIndex(null);
      return;
    }

    if (currentCategories.some((c, i) => i !== idx && c.toLowerCase() === newName.toLowerCase())) {
      alert('Tiểu mục này đã tồn tại trong chuyên mục!');
      return;
    }

    const updatedCategories = [...currentCategories];
    updatedCategories[idx] = newName;

    setSections((prev) => ({
      ...prev,
      [selectedSectionKey]: {
        ...(prev[selectedSectionKey] as SectionConfigItem),
        categories: updatedCategories,
      },
    }));

    if (selectedSectionKey === 'ctd' || selectedSectionKey === 'hl' || selectedSectionKey === 'bac') {
      setPendingRenames((prev) => [
        ...prev.filter(
          (r) => !(r.sectionKey === selectedSectionKey && r.oldName === oldName)
        ),
        { sectionKey: selectedSectionKey, oldName, newName },
      ]);
    }

    setEditingCategoryIndex(null);
  };

  const handleAddCategory = () => {
    const val = newCategoryInput.trim();
    if (!val) return;

    if (currentCategories.some((c) => c.toLowerCase() === val.toLowerCase())) {
      alert('Tiểu mục này đã tồn tại!');
      return;
    }

    const updatedCategories = [...currentCategories, val];
    setSections((prev) => ({
      ...prev,
      [selectedSectionKey]: {
        ...(prev[selectedSectionKey] as SectionConfigItem),
        categories: updatedCategories,
      },
    }));
    setNewCategoryInput('');
  };

  const handleDeleteCategory = (catName: string) => {
    if (currentCategories.length <= 1) {
      alert('Mỗi chuyên mục cần giữ lại ít nhất một tiểu mục!');
      return;
    }

    const affectedCount = articles.filter(
      (a) => a.sectionKey === selectedSectionKey && a.category === catName
    ).length;

    const confirmMsg = affectedCount > 0
      ? `Tiểu mục "${catName}" đang có ${affectedCount} bài viết liên kết. Nếu xóa, các bài viết này sẽ được tự động chuyển về tiểu mục đầu tiên. Đồng chí có chắc chắn muốn xóa?`
      : `Đồng chí có chắc chắn muốn xóa tiểu mục "${catName}"?`;

    if (!confirm(confirmMsg)) return;

    const remainingCategories = currentCategories.filter((c) => c !== catName);
    setSections((prev) => ({
      ...prev,
      [selectedSectionKey]: {
        ...(prev[selectedSectionKey] as SectionConfigItem),
        categories: remainingCategories,
      },
    }));

    if (affectedCount > 0 && remainingCategories.length > 0) {
      if (selectedSectionKey === 'ctd' || selectedSectionKey === 'hl' || selectedSectionKey === 'bac') {
        setPendingRenames((prev) => [
          ...prev,
          { sectionKey: selectedSectionKey, oldName: catName, newName: remainingCategories[0] },
        ]);
      }
    }
  };

  // Custom Menu Management Logic
  const handleAddMenuItem = () => {
    if (!newMenuTitle.trim()) {
      alert('Vui lòng nhập tên mục điều hướng!');
      return;
    }

    if (newMenuType === 'external' && !newMenuExternalUrl.trim()) {
      alert('Vui lòng nhập đường dẫn liên kết URL ngoài!');
      return;
    }

    const newItem: CustomMenuItem = {
      id: `menu-item-${Date.now()}`,
      title: newMenuTitle.trim(),
      type: newMenuType,
      targetPage: newMenuType === 'internal' ? newMenuTargetPage : undefined,
      externalUrl: newMenuType === 'external' ? newMenuExternalUrl.trim() : undefined,
      openNewTab: newMenuType === 'external' ? newMenuOpenNewTab : false,
    };

    setCustomMenuItems((prev) => [...prev, newItem]);
    setNewMenuTitle('');
    setNewMenuExternalUrl('');
    alert(`Đã thêm mục "${newItem.title}" vào thanh điều hướng menu!`);
  };

  const handleDeleteMenuItem = (id: string) => {
    setCustomMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddPresetLink = (titleText: string, url: string) => {
    const newItem: CustomMenuItem = {
      id: `menu-item-${Date.now()}`,
      title: titleText,
      type: 'external',
      externalUrl: url,
      openNewTab: true,
    };
    setCustomMenuItems((prev) => [...prev, newItem]);
  };

  // Color preset applicator
  const applyPreset = (preset: { red: string; green: string; name: string }) => {
    setColorRed(preset.red);
    setColorGreen(preset.green);
  };

  // Submit all changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedConfig: SiteConfig = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      slogan: slogan.trim(),
      ticker: ticker.trim(),
      colorRed,
      colorGreen,
      logoType,
      customLogoUrl: customLogoUrl.trim(),
      enableLogoBeam,
      enableLogoGlow,
      logoSizePx,
      footerLogoSizePx,
      establishedDate: establishedDate.trim(),
      sections,
      customMenuItems,
      tickerMode,
      tickerDays,
      tickerCustomList,
      tickerSpeed,
      tickerPrefix: tickerPrefix.trim(),
      footerUnitName: footerUnitName.trim(),
      footerAddress: footerAddress.trim(),
      footerHotline: footerHotline.trim(),
      footerEmail: footerEmail.trim(),
      footerBgColor,
      footerSloganBgColor,
      footerAccentColor,
      footerLayout,
      footerShowLogo,
      footerShowAddress,
      footerShowContact,
      footerShowSlogan,
      footerShowBackToTop,
    };

    onSave(updatedConfig, pendingRenames);
    onClose();
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'Đồng chí có chắc chắn muốn khôi phục toàn bộ giao diện, logo, màu sắc và các danh mục chuyên mục về mặc định ban đầu của Sư đoàn?'
      )
    ) {
      onSave(defaultSiteConfig, []);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#143d2b] via-[#1e3a29] to-[#0a251a] text-white p-4 px-5 flex items-center justify-between border-b-2 border-[#fbbf24]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-[#fbbf24] flex items-center gap-2">
                <span>QUẢN TRỊ GIAO DIỆN, MENU & DANH MỤC HỆ THỐNG</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black tracking-normal">
                  ADMIN MASTER
                </span>
              </h3>
              <p className="text-[11px] text-white/80">
                Tùy biến logo nhận diện, thêm mục menu điều hướng (liên kết ngoài/trong), màu sắc và danh mục
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`px-3.5 py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logo'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>1. Logo & Nhận diện</span>
          </button>

          {/* TAB 2: ADVANCED NEWS TICKER */}
          <button
            type="button"
            onClick={() => setActiveTab('ticker')}
            className={`px-3.5 py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ticker'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Megaphone className="w-4 h-4 text-red-600" />
            <span>2. Bản tin nội bộ (Chữ chạy)</span>
            <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
              {tickerMode === 'auto_today'
                ? 'Hôm nay'
                : tickerMode === 'auto_days'
                ? `${tickerDays} ngày`
                : tickerMode === 'manual'
                ? 'Thủ công'
                : 'Kết hợp'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`px-3.5 py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sections'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>3. Chuyên mục & Tiểu mục</span>
            {pendingRenames.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {pendingRenames.length}
              </span>
            )}
          </button>

          {/* TAB 4: CUSTOM MENU ITEMS */}
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`px-3.5 py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'menu'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <MenuIcon className="w-4 h-4 text-indigo-600" />
            <span>4. Quản lý Menu & Thêm Mục Mới</span>
            {customMenuItems.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {customMenuItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`px-3.5 py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Palette className="w-4 h-4 text-blue-600" />
            <span>5. Tông màu Giao diện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('footer')}
            className={`px-3.5 py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'footer'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Info className="w-4 h-4 text-teal-700" />
            <span>6. Chân trang & Liên hệ</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-5">
          {/* TAB 1: LOGO & IDENTITY */}
          {activeTab === 'logo' && (
            <div className="space-y-5">
              {/* Interactive Logo Live Preview Block */}
              <div className="bg-gradient-to-br from-[#143d2b] to-[#0a251a] p-4 sm:p-5 rounded-xl border border-emerald-800 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <UnitLogo
                    size="xl"
                    customSizePx={logoSizePx}
                    withGlow={enableLogoGlow}
                    withRotatingBeam={enableLogoBeam}
                    logoType={logoType}
                    customLogoUrl={customLogoUrl}
                    slogan={slogan}
                    establishedDate={establishedDate}
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-black/40 px-2 py-0.5 rounded border border-white/10">
                      Xem trước hiệu ứng hiển thị thực tế ({logoSizePx}px)
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-amber-400 leading-snug">
                      {title}
                    </h4>
                    <p className="text-xs text-emerald-200 font-medium">{subtitle}</p>
                    <p className="text-[11px] text-amber-200 italic font-bold">{slogan}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0 bg-black/30 p-3 rounded-lg border border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={enableLogoBeam}
                      onChange={(e) => setEnableLogoBeam(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-bold text-amber-300">Tia sáng quét 360°</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={enableLogoGlow}
                      onChange={(e) => setEnableLogoGlow(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-bold text-amber-300">Hào quang tỏa sáng</span>
                  </label>
                </div>
              </div>

              {/* ADMIN LOGO SIZE CONTROLLER */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-xs">
                    <Maximize2 className="w-4 h-4 text-amber-700" />
                    <span>Kích thước Logo trên Header & Toàn trang (Do Admin điều chỉnh):</span>
                  </div>
                  <div className="text-sm font-black text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-md border border-amber-300">
                    {logoSizePx} px
                  </div>
                </div>

                {/* Range Slider */}
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-gray-500">32px (Nhỏ)</span>
                  <input
                    type="range"
                    min="32"
                    max="96"
                    step="2"
                    value={logoSizePx}
                    onChange={(e) => setLogoSizePx(parseInt(e.target.value, 10))}
                    className="flex-1 accent-red-700 h-2 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-gray-500">96px (Cực đại)</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-gray-600">Chọn nhanh:</span>
                  {[
                    { label: 'Gọn nhỏ (36px)', val: 36 },
                    { label: 'Tiêu chuẩn (48px)', val: 48 },
                    { label: 'Nổi bật (60px)', val: 60 },
                    { label: 'Lớn uy nghi (76px)', val: 76 },
                    { label: 'Cực đại (90px)', val: 90 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setLogoSizePx(preset.val)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        logoSizePx === preset.val
                          ? 'bg-red-700 text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Selection Options */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <h4 className="font-black text-gray-900 uppercase text-xs">
                  Lựa chọn loại biểu trưng / Huy hiệu đơn vị:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    className={`p-3.5 rounded-lg border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      logoType === 'official_vector'
                        ? 'border-red-700 bg-red-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="logoType"
                      value="official_vector"
                      checked={logoType === 'official_vector'}
                      onChange={() => setLogoType('official_vector')}
                      className="mt-1 accent-red-700"
                    />
                    <div>
                      <div className="font-black text-red-900 text-xs">
                        Huy hiệu Quân kỳ Sư đoàn 10 (Vector chuẩn)
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Sao vàng năm cánh, bánh răng công nghiệp, bông lúa và dải lụa chữ "SƯ ĐOÀN 10".
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-lg border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      logoType === 'custom_image'
                        ? 'border-red-700 bg-red-50/50 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="logoType"
                      value="custom_image"
                      checked={logoType === 'custom_image'}
                      onChange={() => setLogoType('custom_image')}
                      className="mt-1 accent-red-700"
                    />
                    <div>
                      <div className="font-black text-red-900 text-xs">
                        Tải ảnh biểu trưng riêng từ thiết bị
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Tải lên tệp ảnh PNG / SVG trong suốt hoặc nhập URL hình ảnh.
                      </p>
                    </div>
                  </label>
                </div>

                {logoType === 'custom_image' && (
                  <div className="p-3 bg-white rounded-lg border border-red-200 space-y-3">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Chọn tệp ảnh từ máy tính</span>
                      </button>

                      <div className="text-gray-400 text-xs font-bold">HOẶC</div>

                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={customLogoUrl}
                          onChange={(e) => setCustomLogoUrl(e.target.value)}
                          placeholder="Dán đường dẫn link ảnh (https://...)..."
                          className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Slogans Form */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tiêu đề Header chính (*):
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-black text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Phụ đề đơn vị & hệ thống:
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Khẩu hiệu truyền thống:
                    </label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-bold text-red-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Ngày thành lập / Ngày truyền thống:
                    </label>
                    <input
                      type="text"
                      value={establishedDate}
                      onChange={(e) => setEstablishedDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADVANCED NEWS TICKER CONTROLLER */}
          {activeTab === 'ticker' && (
            <div className="space-y-5">
              {/* Ticker Mode Selector */}
              <div className="bg-red-50/60 p-4 rounded-xl border border-red-200 space-y-3">
                <div className="flex items-center gap-2 text-red-900 font-black uppercase text-xs">
                  <Megaphone className="w-4 h-4 text-red-700" />
                  <span>1. Chế độ phát dòng thông báo tin tức nội bộ:</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Lựa chọn cách thức hệ thống tự động tổng hợp hoặc cho phép Admin chủ động đưa nội dung vào thanh chữ chạy trên đầu trang.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {[
                    {
                      mode: 'combined',
                      title: 'Kết hợp: Thông báo + Bài mới gần đây (Khuyên dùng)',
                      desc: 'Chạy xen kẽ các thông báo ưu tiên của đơn vị cùng với tiêu đề các bài đăng mới nhất.',
                      badge: 'Toàn diện',
                    },
                    {
                      mode: 'auto_today',
                      title: 'Tự động: Chỉ bài đăng mới trong ngày hôm nay',
                      desc: 'Hệ thống tự động quét và chỉ phát các bài viết được phê duyệt/xuất bản trong ngày hôm nay.',
                      badge: 'Tin hôm nay',
                    },
                    {
                      mode: 'auto_days',
                      title: 'Tự động: Bài đăng trong khoảng thời gian quy định',
                      desc: 'Tự động lấy tất cả các bài viết trong số ngày (1 - 30 ngày) do Admin chỉ định bên dưới.',
                      badge: `${tickerDays} ngày qua`,
                    },
                    {
                      mode: 'manual',
                      title: 'Thủ công: Chỉ chạy nội dung thông báo do Admin nhập',
                      desc: 'Không tự động lấy bài viết. Chỉ hiển thị danh sách các thông điệp thông báo chỉ thị do Admin thêm.',
                      badge: 'Chỉ định',
                    },
                  ].map((item) => (
                    <label
                      key={item.mode}
                      className={`p-3 rounded-lg border-2 flex items-start gap-2.5 cursor-pointer transition-all ${
                        tickerMode === item.mode
                          ? 'border-red-700 bg-white shadow-xs'
                          : 'border-gray-200 bg-white/70 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tickerMode"
                        value={item.mode}
                        checked={tickerMode === item.mode}
                        onChange={() => setTickerMode(item.mode as any)}
                        className="mt-1 accent-red-700"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-xs">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specific Configuration for auto_days */}
              {tickerMode === 'auto_days' && (
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-300 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-black uppercase text-xs">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <span>Khoảng thời gian bài đăng tự động:</span>
                    </div>
                    <span className="bg-emerald-200 text-emerald-900 font-black px-2.5 py-0.5 rounded text-xs">
                      {tickerDays} ngày gần nhất
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-600">Chọn nhanh:</span>
                    {[1, 2, 3, 5, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTickerDays(d)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          tickerDays === d
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {d === 1 ? '1 ngày' : `${d} ngày`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Ticker Announcement List Manager */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-900 font-black uppercase text-xs">
                    <Newspaper className="w-4 h-4 text-red-700" />
                    <span>2. Danh sách nội dung thông báo tin nội bộ (Thêm / Sửa / Xóa):</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">
                    {tickerCustomList.length} thông báo
                  </span>
                </div>

                {/* Add New Announcement Input */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-300">
                  <input
                    type="text"
                    value={newTickerInput}
                    onChange={(e) => setNewTickerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTickerInput.trim()) {
                          setTickerCustomList((prev) => [...prev, newTickerInput.trim()]);
                          setNewTickerInput('');
                        }
                      }
                    }}
                    placeholder="Nhập nội dung thông báo, chỉ thị, lời chúc hoặc tin tức mới cần chạy..."
                    className="flex-1 p-2 bg-transparent text-xs text-gray-900 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTickerInput.trim()) {
                        alert('Vui lòng nhập nội dung thông báo trước khi thêm!');
                        return;
                      }
                      setTickerCustomList((prev) => [...prev, newTickerInput.trim()]);
                      setNewTickerInput('');
                    }}
                    className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm tin</span>
                  </button>
                </div>

                {/* Existing Announcement List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {tickerCustomList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
                    >
                      {editingTickerIdx === idx ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTickerVal}
                            onChange={(e) => setEditingTickerVal(e.target.value)}
                            className="flex-1 p-1.5 bg-yellow-50 border border-yellow-400 rounded text-xs font-semibold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingTickerVal.trim()) return;
                              setTickerCustomList((prev) =>
                                prev.map((it, i) => (i === idx ? editingTickerVal.trim() : it))
                              );
                              setEditingTickerIdx(null);
                              setEditingTickerVal('');
                            }}
                            className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Lưu"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTickerIdx(null)}
                            className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-gray-800 font-medium leading-snug break-words">
                              {item}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTickerIdx(idx);
                                setEditingTickerVal(item);
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (tickerCustomList.length <= 1) {
                                  alert('Cần giữ lại ít nhất 1 thông báo!');
                                  return;
                                }
                                setTickerCustomList((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticker Badge & Speed Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Nhãn tiêu đề dòng chữ chạy:
                  </label>
                  <input
                    type="text"
                    value={tickerPrefix}
                    onChange={(e) => setTickerPrefix(e.target.value)}
                    placeholder="Bản tin nội bộ, Thông báo khẩn,..."
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Hiển thị trong ô màu đỏ có icon loa phát thanh bên trái dòng chữ chạy.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tốc độ dòng chữ chạy:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'slow', label: 'Chậm rãi (45s)' },
                      { id: 'normal', label: 'Bình thường (28s)' },
                      { id: 'fast', label: 'Nhanh (18s)' },
                    ].map((spd) => (
                      <button
                        key={spd.id}
                        type="button"
                        onClick={() => setTickerSpeed(spd.id as any)}
                        className={`p-2 rounded-lg text-center font-bold text-xs transition-all cursor-pointer ${
                          tickerSpeed === spd.id
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {spd.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECTIONS & SUBCATEGORIES */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
                {[
                  { key: 'ctd', label: '1. CTĐ - CTCT', color: '#b91c1c' },
                  { key: 'hl', label: '2. Huấn luyện - SSCĐ', color: '#065f46' },
                  { key: 'bac', label: '3. Học tập theo Bác', color: '#b45309' },
                  { key: 'doc', label: '4. Kho Văn bản', color: '#2563eb' },
                  { key: 'lecture', label: '5. Bài giảng điện tử', color: '#0891b2' },
                  { key: 'meeting', label: '6. Họp Đảng ủy', color: '#831843' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setSelectedSectionKey(s.key as any);
                      setEditingCategoryIndex(null);
                      setNewCategoryInput('');
                    }}
                    className={`px-3 py-2 rounded-lg transition-all cursor-pointer shrink-0 ${
                      selectedSectionKey === s.key
                        ? 'bg-gray-900 text-white font-black shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Selected Section Details */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Tên đầy đủ của Chuyên mục:
                    </label>
                    <input
                      type="text"
                      value={sections[selectedSectionKey]?.title || ''}
                      onChange={(e) => handleSectionFieldChange('title', e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-red-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Tên viết tắt trên Menu Navbar:
                    </label>
                    <input
                      type="text"
                      value={sections[selectedSectionKey]?.shortLabel || ''}
                      onChange={(e) => handleSectionFieldChange('shortLabel', e.target.value)}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-red-700 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Mô tả định hướng nội dung:
                  </label>
                  <input
                    type="text"
                    value={sections[selectedSectionKey]?.desc || ''}
                    onChange={(e) => handleSectionFieldChange('desc', e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:border-red-700"
                  />
                </div>

                {/* Subcategories Editor */}
                {currentCategories && currentCategories.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-black text-gray-900 uppercase text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-red-700" />
                        <span>Danh sách các Tiểu mục ({currentCategories.length}):</span>
                      </h5>
                    </div>

                    <div className="space-y-2">
                      {currentCategories.map((cat, idx) => {
                        const isEditing = editingCategoryIndex === idx;
                        return (
                          <div
                            key={idx}
                            className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between gap-2"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingCategoryValue}
                                  onChange={(e) => setEditingCategoryValue(e.target.value)}
                                  className="p-1.5 bg-amber-50 border border-amber-400 rounded text-xs flex-1 font-bold"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCategory(idx)}
                                  className="px-2.5 py-1 bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer"
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategoryIndex(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-bold text-gray-900 text-xs">
                                  {idx + 1}. {cat}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditCategory(idx, cat)}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 cursor-pointer"
                                    title="Sửa tên tiểu mục"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                                    title="Xóa tiểu mục"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add new subcategory */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="Nhập tên tiểu mục mới cần thêm..."
                        className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm tiểu mục</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: CUSTOM NAVIGATION MENU ITEMS & LINKS MANAGEMENT
             ========================================================================= */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MenuIcon className="w-4 h-4 text-indigo-700" />
                    <h4 className="font-extrabold text-indigo-950 text-xs uppercase">
                      THÊM MỤC MỚI VÀO THANH ĐIỀU HƯỚNG NAVBAR
                    </h4>
                  </div>
                </div>
                <p className="text-[11px] text-indigo-900">
                  Đồng chí có thể thêm mục mới dẫn đến website/trang bên ngoài, hoặc liên kết nhanh đến một trang nội bộ của hệ thống.
                </p>

                {/* Form to Add New Menu Item */}
                <div className="bg-white p-3.5 rounded-lg border border-indigo-200 space-y-3 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Tên mục hiển thị trên Menu (*):
                      </label>
                      <input
                        type="text"
                        value={newMenuTitle}
                        onChange={(e) => setNewMenuTitle(e.target.value)}
                        placeholder="Ví dụ: Báo QĐND, Thư viện số..."
                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-hidden font-bold text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Loại liên kết (*):
                      </label>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-1.5 font-bold text-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            name="menuType"
                            checked={newMenuType === 'external'}
                            onChange={() => setNewMenuType('external')}
                            className="accent-indigo-600"
                          />
                          <span>Liên kết ngoài (URL)</span>
                        </label>
                        <label className="flex items-center gap-1.5 font-bold text-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            name="menuType"
                            checked={newMenuType === 'internal'}
                            onChange={() => setNewMenuType('internal')}
                            className="accent-indigo-600"
                          />
                          <span>Trang trong web này</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {newMenuType === 'internal' ? (
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        Chọn trang đích trong website:
                      </label>
                      <select
                        value={newMenuTargetPage}
                        onChange={(e) => setNewMenuTargetPage(e.target.value as PageView)}
                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-indigo-600 font-bold"
                      >
                        <option value="home">Trang chủ</option>
                        <option value="ctd">Công tác Đảng - CTCT</option>
                        <option value="hl">Huấn luyện - Sẵn sàng chiến đấu</option>
                        <option value="bac">Học tập và làm theo Bác</option>
                        <option value="doc">Kho Văn bản - Chỉ thị</option>
                        <option value="lecture">Thư viện Bài giảng điện tử</option>
                        <option value="meeting">Phòng Họp Đảng ủy trực tuyến</option>
                        <option value="approvals">Duyệt tin bài (Admin)</option>
                        <option value="users">Quản trị người dùng (Admin)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">
                          Địa chỉ liên kết URL (*):
                        </label>
                        <input
                          type="text"
                          value={newMenuExternalUrl}
                          onChange={(e) => setNewMenuExternalUrl(e.target.value)}
                          placeholder="https://www.qdnd.vn hoặc https://baoquankhu5.vn..."
                          className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-indigo-600 font-mono text-gray-900"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={newMenuOpenNewTab}
                          onChange={(e) => setNewMenuOpenNewTab(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <span className="font-bold text-gray-700 text-[11px]">
                          Mở liên kết trong tab trình duyệt mới (target="_blank")
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddMenuItem}
                      className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ THÊM MỤC VÀO NAVBAR</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-indigo-200">
                  <span className="font-bold text-indigo-950 text-[11px]">
                    Gợi ý liên kết nhanh tiện ích quân sự:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddPresetLink('Báo QĐND', 'https://www.qdnd.vn')}
                      className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      + Báo QĐND (qdnd.vn)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetLink('Báo Quân khu 5', 'https://baoquankhu5.vn')}
                      className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      + Báo Quân khu 5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetLink('Cổng TTĐT Bộ Quốc phòng', 'http://mod.gov.vn')}
                      className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      + Cổng TTĐT BQP (mod.gov.vn)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPresetLink('Cổng TTĐT Gia Lai', 'https://gialai.gov.vn')}
                      className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      + Cổng TTĐT Gia Lai
                    </button>
                  </div>
                </div>
              </div>

              {/* List of Current Custom Menu Items */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="font-black text-gray-900 uppercase text-xs flex items-center justify-between">
                  <span>Danh sách các mục điều hướng bổ sung ({customMenuItems.length}):</span>
                </h4>

                {customMenuItems.length === 0 ? (
                  <p className="text-gray-400 italic text-center py-4 text-xs">
                    Chưa có mục menu bổ sung nào. Thêm mục ở khung phía trên để hiển thị trên thanh Navbar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customMenuItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-gray-400 text-xs">#{idx + 1}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                              <span>{item.title}</span>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                                  item.type === 'internal'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {item.type === 'internal' ? 'Liên kết nội bộ' : 'Liên kết ngoài'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 truncate font-mono mt-0.5">
                              {item.type === 'internal'
                                ? `Trang nội bộ: [${item.targetPage}]`
                                : `URL: ${item.externalUrl} ${item.openNewTab ? '(Tab mới)' : ''}`}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                          title="Xóa mục menu này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: THEME COLORS */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="font-black text-gray-900 uppercase text-xs">
                  Bộ phối màu chuẩn Quân đội nhân dân Việt Nam:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      name: 'Sư đoàn 10 - Mang Yang (Mặc định)',
                      red: '#b91c1c',
                      green: '#143d2b',
                    },
                    {
                      name: 'Quân khu 5 - Tây Nguyên Kiên Cường',
                      red: '#991b1b',
                      green: '#064e3b',
                    },
                    {
                      name: 'Bộ Quốc phòng - Hoàng Gia Vinh Quang',
                      red: '#831843',
                      green: '#134e4a',
                    },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-2xs"
                    >
                      <span className="font-bold text-gray-800 text-[11px] leading-tight">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs"
                          style={{ backgroundColor: preset.red }}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-gray-300 shadow-2xs"
                          style={{ backgroundColor: preset.green }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2">
                  <label className="block font-bold text-gray-800">
                    Màu cờ đỏ chủ đạo (Đầu trang Header & Nút nổi bật):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorRed}
                      onChange={(e) => setColorRed(e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorRed}
                      onChange={(e) => setColorRed(e.target.value)}
                      className="p-2 border border-gray-300 rounded font-mono text-xs w-28 uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Màu nền thanh tiêu đề chính và các nút gửi bài, điểm tin nổi bật.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2">
                  <label className="block font-bold text-gray-800">
                    Màu xanh quân đội (Thanh Menu Navbar & Chân trang Footer):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorGreen}
                      onChange={(e) => setColorGreen(e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorGreen}
                      onChange={(e) => setColorGreen(e.target.value)}
                      className="p-2 border border-gray-300 rounded font-mono text-xs w-28 uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Màu nền thanh điều hướng chính, viền khối và chân trang thông tin đơn vị.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FOOTER & CONTACT INFO */}
          {activeTab === 'footer' && (
            <div className="space-y-4">
              {/* 1. Bố cục Chân trang */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <label className="block font-bold text-gray-900 text-xs">
                  1. Kiểu Bố cục Chân trang:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFooterLayout('split')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      footerLayout === 'split'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between mb-1">
                      <span>Bố cục Trái - Phải</span>
                      {footerLayout === 'split' && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">Chọn</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Logo & thông tin bên trái, dải Slogan phía dưới màu đậm hơn.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFooterLayout('centered')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      footerLayout === 'centered'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between mb-1">
                      <span>Căn giữa đồng trục</span>
                      {footerLayout === 'centered' && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">Chọn</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Logo và thông tin căn giữa trang trọng, dải Slogan phía dưới.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFooterLayout('compact')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      footerLayout === 'compact'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/30 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between mb-1">
                      <span>Siêu tinh gọn</span>
                      {footerLayout === 'compact' && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">Chọn</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Chiều cao tối thiểu, thông tin dàn ngang 1 hàng trên màn hình lớn.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Tùy chỉnh màu sắc Chân trang */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <label className="block font-bold text-gray-900 text-xs">
                  2. Tùy chỉnh Màu sắc Chân trang:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1.5">
                    <span className="block text-[11px] font-bold text-gray-800">
                      Màu nền chính chân trang:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerBgColor}
                        onChange={(e) => setFooterBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={footerBgColor}
                        onChange={(e) => setFooterBgColor(e.target.value)}
                        className="p-1.5 border border-gray-300 rounded font-mono text-[11px] w-24 uppercase"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1.5">
                    <span className="block text-[11px] font-bold text-gray-800">
                      Màu nền dải Slogan phía dưới:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerSloganBgColor}
                        onChange={(e) => setFooterSloganBgColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={footerSloganBgColor}
                        onChange={(e) => setFooterSloganBgColor(e.target.value)}
                        className="p-1.5 border border-gray-300 rounded font-mono text-[11px] w-24 uppercase"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1.5">
                    <span className="block text-[11px] font-bold text-gray-800">
                      Màu chữ & viền ánh kim:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerAccentColor}
                        onChange={(e) => setFooterAccentColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={footerAccentColor}
                        onChange={(e) => setFooterAccentColor(e.target.value)}
                        className="p-1.5 border border-gray-300 rounded font-mono text-[11px] w-24 uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Bật/Tắt các thành phần hiển thị */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                <label className="block font-bold text-gray-900 text-xs">
                  3. Tùy chọn Hiển thị các Thành phần:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={footerShowLogo}
                      onChange={(e) => setFooterShowLogo(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">Hiện Logo đơn vị ở chân trang</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={footerShowAddress}
                      onChange={(e) => setFooterShowAddress(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">Hiện Đơn vị chủ quản & Địa bàn</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={footerShowContact}
                      onChange={(e) => setFooterShowContact(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">Hiện Hotline & Email trực ban</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={footerShowSlogan}
                      onChange={(e) => setFooterShowSlogan(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">Hiện Dải Slogan truyền thống đáy trang</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={footerShowBackToTop}
                      onChange={(e) => setFooterShowBackToTop(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">Hiện Nút "Lên đầu trang" (nằm ngoài chính giữa)</span>
                  </label>
                </div>
              </div>

              {/* 4. Nội dung thông tin chân trang */}
              <div className="space-y-3 pt-1">
                <label className="block font-bold text-gray-900 text-xs">
                  4. Nội dung Chi tiết Thông tin:
                </label>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs">
                    Đơn vị chủ quản / Cơ quan ban hành (*):
                  </label>
                  <input
                    type="text"
                    value={footerUnitName}
                    onChange={(e) => setFooterUnitName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-bold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs">
                    Địa bàn đóng quân / Doanh trại:
                  </label>
                  <input
                    type="text"
                    value={footerAddress}
                    onChange={(e) => setFooterAddress(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 text-xs">
                      Đường dây nóng / Trực ban Tác chiến:
                    </label>
                    <input
                      type="text"
                      value={footerHotline}
                      onChange={(e) => setFooterHotline(e.target.value)}
                      className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1 text-xs">
                      Email nội bộ / Liên hệ Tuyên huấn:
                    </label>
                    <input
                      type="text"
                      value={footerEmail}
                      onChange={(e) => setFooterEmail(e.target.value)}
                      className="w-full p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-700 focus:outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục toàn bộ giao diện mặc định</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                id="btn-save-customizer-config"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                <span>LƯU & ĐỒNG BỘ GIAO DIỆN HỆ THỐNG</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
