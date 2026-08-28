import React, { useState } from 'react';
import {
  Layout,
  Save,
  X,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RotateCcw,
  Sliders,
  Sparkles,
  Newspaper,
  BookOpen,
  Laptop,
  Flame,
  BellRing,
  ArrowLeftRight,
  ShieldAlert,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { HomeLayoutSettings, SidebarWidgetId, SidebarWidgetSetting, SiteConfig } from '../../types';
import { defaultSidebarWidgets } from '../../data/initialData';

interface LayoutManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteConfig: SiteConfig;
  onSaveLayout: (newLayout: HomeLayoutSettings) => void;
}

const DEFAULT_LAYOUT: HomeLayoutSettings = {
  showUncleHoSection: true,
  showAnnouncementsWidget: true,
  showFeaturedSlider: true,
  showSpotlightSection: true,
  showLatestNewsWidget: true,
  showQuickActionsWidget: true,
  showCategoryColumns: true,
  showQuickLibrarySection: true,
  topColumnsOrder: ['left', 'middle', 'right'],
  sidebarWidgets: defaultSidebarWidgets,
};

export const LayoutManagerModal: React.FC<LayoutManagerModalProps> = ({
  isOpen,
  onClose,
  siteConfig,
  onSaveLayout,
}) => {
  const currentWidgets: SidebarWidgetSetting[] =
    siteConfig.layoutSettings?.sidebarWidgets && siteConfig.layoutSettings.sidebarWidgets.length > 0
      ? siteConfig.layoutSettings.sidebarWidgets
      : siteConfig.sidebarWidgets && siteConfig.sidebarWidgets.length > 0
      ? siteConfig.sidebarWidgets
      : defaultSidebarWidgets;

  const currentSettings: HomeLayoutSettings = {
    ...DEFAULT_LAYOUT,
    ...(siteConfig.layoutSettings || {}),
    sidebarWidgets: currentWidgets,
  };

  const [layout, setLayout] = useState<HomeLayoutSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'sidebars' | 'visibility'>('sidebars');

  if (!isOpen) return null;

  const widgets = layout.sidebarWidgets || defaultSidebarWidgets;

  // Toggle widget enable/disable
  const handleToggleWidget = (id: SidebarWidgetId) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
    setLayout((prev) => ({
      ...prev,
      sidebarWidgets: updated,
      // Keep legacy boolean fields in sync
      showUncleHoSection: id === 'uncle_ho' ? !updated.find((w) => w.id === 'uncle_ho')?.enabled : prev.showUncleHoSection,
      showAnnouncementsWidget: id === 'announcements' ? !updated.find((w) => w.id === 'announcements')?.enabled : prev.showAnnouncementsWidget,
      showLatestNewsWidget: id === 'latest_news' ? !updated.find((w) => w.id === 'latest_news')?.enabled : prev.showLatestNewsWidget,
      showQuickActionsWidget: id === 'quick_actions' ? !updated.find((w) => w.id === 'quick_actions')?.enabled : prev.showQuickActionsWidget,
    }));
  };

  // Change side (Left <-> Right)
  const handleChangeWidgetSide = (id: SidebarWidgetId, newSide: 'left' | 'right') => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, side: newSide } : w));
    setLayout((prev) => ({ ...prev, sidebarWidgets: updated }));
  };

  // Move widget up or down in its column
  const handleMoveWidget = (id: SidebarWidgetId, direction: 'up' | 'down') => {
    const target = widgets.find((w) => w.id === id);
    if (!target) return;

    // Get all widgets on the same side
    const sameSideWidgets = widgets
      .filter((w) => w.side === target.side)
      .sort((a, b) => a.order - b.order);

    const index = sameSideWidgets.findIndex((w) => w.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= sameSideWidgets.length) return;

    // Swap positions
    const temp = sameSideWidgets[index];
    sameSideWidgets[index] = sameSideWidgets[targetIndex];
    sameSideWidgets[targetIndex] = temp;

    // Re-assign orders
    sameSideWidgets.forEach((w, i) => {
      w.order = i + 1;
    });

    const otherSideWidgets = widgets.filter((w) => w.side !== target.side);
    const combined = [...sameSideWidgets, ...otherSideWidgets];

    setLayout((prev) => ({ ...prev, sidebarWidgets: combined }));
  };

  // Toggle main section visibility
  const handleToggleSection = (key: keyof HomeLayoutSettings) => {
    setLayout((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReset = () => {
    if (window.confirm('Khôi phục toàn bộ bố cục Trang chủ và vị trí chuyên mục về mặc định ban đầu?')) {
      setLayout(DEFAULT_LAYOUT);
    }
  };

  const handleSave = () => {
    onSaveLayout(layout);
    alert('Đã cập nhật và lưu cấu hình bố cục Trang chủ vào Cơ sở dữ liệu thành công!');
    onClose();
  };

  const getWidgetIcon = (id: SidebarWidgetId) => {
    switch (id) {
      case 'uncle_ho':
        return Flame;
      case 'daily_widgets':
        return ShieldAlert;
      case 'announcements':
        return BellRing;
      case 'latest_news':
        return Newspaper;
      case 'quick_actions':
        return Laptop;
      default:
        return Compass;
    }
  };

  const getWidgetDesc = (id: SidebarWidgetId) => {
    switch (id) {
      case 'uncle_ho':
        return 'Lời Bác dạy cốt lõi, tư liệu lịch sử, bài học vận dụng và album ảnh tư liệu';
      case 'daily_widgets':
        return '3 chuyên mục: Mỗi ngày 1 thông điệp an toàn, 1 tình huống giao thông, 1 hành động đẹp';
      case 'announcements':
        return 'Tin khẩn nội bộ, thông báo sinh hoạt, văn bản chỉ đạo trọng điểm của Đảng ủy';
      case 'latest_news':
        return 'Bản tin mới nhất cập nhật liên tục với số lượt xem và biểu tượng mới';
      case 'quick_actions':
        return 'Thẻ tiện ích truy cập nhanh vào Kho văn bản, Bài giảng số, Thi trực tuyến';
      default:
        return '';
    }
  };

  const mainBlocks = [
    {
      key: 'showFeaturedSlider' as const,
      name: 'Tin tiêu điểm / Slider nổi bật (Cột Giữa)',
      desc: 'Băng chuyền ảnh bài viết tiêu điểm, hiệu ứng chuyển động, tương tác slide chuyển tiếp',
      icon: Sparkles,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      key: 'showSpotlightSection' as const,
      name: 'Tin tiêu biểu / Spotlight chọn lọc (Cột Giữa)',
      desc: 'Khu vực bài viết nổi bật do Ban Biên tập ghim chọn lọc hoặc tự động lấy bài mới nhất',
      icon: Newspaper,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      key: 'showCategoryColumns' as const,
      name: 'Khối Tin tức theo chuyên mục toàn diện (Thân dưới)',
      desc: 'Hiển thị các khung bài viết theo phòng ban (CTĐ-CTCT, Quân sự, Hậu cần, Kỹ thuật)',
      icon: BookOpen,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      key: 'showQuickLibrarySection' as const,
      name: 'Thư viện Văn bản & Bài giảng số nhanh (Chân trang chủ)',
      desc: 'Khung tra cứu tải nhanh tài liệu và học liệu số hóa ở chân trang chủ',
      icon: BookOpen,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  ];

  const leftWidgetsList = widgets.filter((w) => w.side === 'left').sort((a, b) => a.order - b.order);
  const rightWidgetsList = widgets.filter((w) => w.side === 'right').sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-950 text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 rounded-xl border border-amber-300/30 text-amber-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-amber-200 uppercase tracking-wide">
                QUẢN LÝ BỐ CỤC TRANG CHỦ & VỊ TRÍ CHUYÊN MỤC
              </h2>
              <p className="text-[11px] text-white/80">
                Tùy biến vị trí cột Trái / Phải, thứ tự hiển thị và bật/tắt chuyên mục cho toàn hệ thống
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
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sidebars')}
            className={`py-2.5 px-4 font-extrabold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'sidebars'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-600" />
            <span>VỊ TRÍ CHUYÊN MỤC TRÁI / PHẢI ({widgets.filter((w) => w.enabled).length}/5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visibility')}
            className={`py-2.5 px-4 font-extrabold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'visibility'
                ? 'border-red-700 text-red-700 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layout className="w-4 h-4 text-indigo-600" />
            <span>KHỐI NỘI DUNG CHÍNH (CỘT GIỮA & DƯỚI)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: DYNAMIC SIDEBAR WIDGETS (LEFT / RIGHT PLACEMENT) */}
          {activeTab === 'sidebars' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] text-amber-950 leading-relaxed">
                  <p className="font-bold">
                    Tùy biến cột Trái / Phải và sắp xếp thứ tự hiển thị:
                  </p>
                  <p>
                    Đồng chí có thể chuyển đổi bất kỳ chuyên mục nào sang <strong>Cột bên Trái</strong> hoặc <strong>Cột bên Phải</strong>, bấm mũi tên <strong>Lên / Xuống</strong> để sắp xếp vị trí và bấm <strong>Bật / Ẩn</strong>. Bố cục sẽ tự động co giãn thông minh!
                  </p>
                </div>
              </div>

              {/* 2-Columns Preview & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CỘT BÊN TRÁI */}
                <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border-2 border-dashed border-red-200">
                  <div className="flex items-center justify-between border-b border-red-200 pb-2">
                    <span className="font-black text-xs text-red-900 uppercase flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-700"></span>
                      <span>CỘT BÊN TRÁI (LEFT SIDEBAR)</span>
                    </span>
                    <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-200">
                      {leftWidgetsList.filter((w) => w.enabled).length} Đang hiện
                    </span>
                  </div>

                  {leftWidgetsList.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 text-xs italic bg-white rounded-lg border border-gray-200">
                      Không có chuyên mục nào ở cột trái.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leftWidgetsList.map((item, idx) => {
                        const ItemIcon = getWidgetIcon(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                              item.enabled
                                ? 'bg-white border-red-200 shadow-2xs'
                                : 'bg-gray-100/70 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Up / Down buttons */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveWidget(item.id, 'up')}
                                    className="p-1 rounded bg-gray-100 hover:bg-red-100 border border-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Di chuyển lên trên"
                                  >
                                    <MoveUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === leftWidgetsList.length - 1}
                                    onClick={() => handleMoveWidget(item.id, 'down')}
                                    className="p-1 rounded bg-gray-100 hover:bg-red-100 border border-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Di chuyển xuống dưới"
                                  >
                                    <MoveDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="p-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 shrink-0">
                                  <ItemIcon className="w-4 h-4" />
                                </div>

                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">
                                    {item.name}
                                  </h4>
                                  <span className="text-[10px] text-gray-500 font-mono">
                                    Vị trí #{item.order}
                                  </span>
                                </div>
                              </div>

                              {/* Toggle enable */}
                              <button
                                type="button"
                                onClick={() => handleToggleWidget(item.id)}
                                className={`shrink-0 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                                  item.enabled
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                {item.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{item.enabled ? 'Hiện' : 'Ẩn'}</span>
                              </button>
                            </div>

                            {/* Position Switcher (Move to Right Column) */}
                            <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                              <span className="text-gray-500">Chuyển cột:</span>
                              <button
                                type="button"
                                onClick={() => handleChangeWidgetSide(item.id, 'right')}
                                className="text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer border border-blue-200 flex items-center gap-1"
                              >
                                <span>Sang Cột Phải</span>
                                <ArrowLeftRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CỘT BÊN PHẢI */}
                <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border-2 border-dashed border-blue-200">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <span className="font-black text-xs text-blue-900 uppercase flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                      <span>CỘT BÊN PHẢI (RIGHT SIDEBAR)</span>
                    </span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                      {rightWidgetsList.filter((w) => w.enabled).length} Đang hiện
                    </span>
                  </div>

                  {rightWidgetsList.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 text-xs italic bg-white rounded-lg border border-gray-200">
                      Không có chuyên mục nào ở cột phải.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rightWidgetsList.map((item, idx) => {
                        const ItemIcon = getWidgetIcon(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                              item.enabled
                                ? 'bg-white border-blue-200 shadow-2xs'
                                : 'bg-gray-100/70 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Up / Down buttons */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveWidget(item.id, 'up')}
                                    className="p-1 rounded bg-gray-100 hover:bg-blue-100 border border-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Di chuyển lên trên"
                                  >
                                    <MoveUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === rightWidgetsList.length - 1}
                                    onClick={() => handleMoveWidget(item.id, 'down')}
                                    className="p-1 rounded bg-gray-100 hover:bg-blue-100 border border-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                    title="Di chuyển xuống dưới"
                                  >
                                    <MoveDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  <ItemIcon className="w-4 h-4" />
                                </div>

                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-900 text-xs truncate">
                                    {item.name}
                                  </h4>
                                  <span className="text-[10px] text-gray-500 font-mono">
                                    Vị trí #{item.order}
                                  </span>
                                </div>
                              </div>

                              {/* Toggle enable */}
                              <button
                                type="button"
                                onClick={() => handleToggleWidget(item.id)}
                                className={`shrink-0 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                                  item.enabled
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                {item.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{item.enabled ? 'Hiện' : 'Ẩn'}</span>
                              </button>
                            </div>

                            {/* Position Switcher (Move to Left Column) */}
                            <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                              <span className="text-gray-500">Chuyển cột:</span>
                              <button
                                type="button"
                                onClick={() => handleChangeWidgetSide(item.id, 'left')}
                                className="text-red-700 hover:text-red-900 hover:bg-red-50 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer border border-red-200 flex items-center gap-1"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>Sang Cột Trái</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MAIN CENTER & BOTTOM SECTIONS VISIBILITY */}
          {activeTab === 'visibility' && (
            <div className="space-y-3">
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-950 leading-relaxed">
                  Bật/Tắt các khối nội dung lớn ở Cột Giữa (Slider, Spotlight) và các khối Thư viện, Chuyên mục tin tức ở phần thân dưới trang chủ.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {mainBlocks.map((item) => {
                  const isEnabled = layout[item.key] !== false;
                  const ItemIcon = item.icon;

                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isEnabled
                          ? 'bg-white border-gray-300 shadow-2xs'
                          : 'bg-gray-50/80 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg border shrink-0 ${item.color}`}>
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-xs truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSection(item.key)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Đang hiện</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Đã ẩn</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3.5 px-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg cursor-pointer text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer text-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>LƯU BỐ CỤC TRANG CHỦ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
