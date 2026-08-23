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
  CheckCircle2,
  Sliders,
  Sparkles,
  Newspaper,
  BookOpen,
  Laptop,
  Flame,
  BellRing,
  HelpCircle,
} from 'lucide-react';
import { HomeLayoutSettings, SiteConfig } from '../../types';

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
};

export const LayoutManagerModal: React.FC<LayoutManagerModalProps> = ({
  isOpen,
  onClose,
  siteConfig,
  onSaveLayout,
}) => {
  const currentSettings: HomeLayoutSettings = {
    ...DEFAULT_LAYOUT,
    ...(siteConfig.layoutSettings || {}),
  };

  const [layout, setLayout] = useState<HomeLayoutSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'visibility' | 'columns'>('visibility');

  if (!isOpen) return null;

  const handleToggle = (key: keyof HomeLayoutSettings) => {
    setLayout((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReset = () => {
    if (window.confirm('Khôi phục bố cục Trang chủ về cấu hình mặc định ban đầu?')) {
      setLayout(DEFAULT_LAYOUT);
    }
  };

  const handleSave = () => {
    onSaveLayout(layout);
    alert('Đã cập nhật và lưu cấu hình bố cục Trang chủ vào Cơ sở dữ liệu thành công!');
    onClose();
  };

  const blockItems = [
    {
      key: 'showUncleHoSection' as const,
      name: 'Khối 1: Lời Bác dạy ngày này năm xưa',
      desc: 'Hiển thị câu nói, tư liệu lịch sử, bài học và album ảnh tư liệu về Bác Hồ',
      icon: Flame,
      color: 'text-red-700 bg-red-50 border-red-200',
      column: 'Cột Trái (1/4)',
    },
    {
      key: 'showAnnouncementsWidget' as const,
      name: 'Khối 2: Thông báo & Sự kiện quan trọng',
      desc: 'Danh sách tin khẩn, cuộc thi trực tuyến, văn bản công tác trọng điểm',
      icon: BellRing,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      column: 'Cột Trái (1/4)',
    },
    {
      key: 'showFeaturedSlider' as const,
      name: 'Khối 3: Tin tiêu điểm / Slider nổi bật',
      desc: 'Băng chuyền ảnh bài viết tiêu điểm, hiệu ứng chuyển động, tương tác slide',
      icon: Sparkles,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      column: 'Cột Giữa (2/4)',
    },
    {
      key: 'showSpotlightSection' as const,
      name: 'Khối 4: Tin tiêu biểu / Spotlight',
      desc: 'Khu vực bài viết nổi bật do Ban Biên tập ghim chọn lọc hoặc chọn ngẫu nhiên',
      icon: Newspaper,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      column: 'Cột Giữa (2/4)',
    },
    {
      key: 'showLatestNewsWidget' as const,
      name: 'Khối 5: Tin mới nhất',
      desc: 'Bản tin cập nhật liên tục với số lượt xem, thời gian đăng và badge mới',
      icon: Newspaper,
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      column: 'Cột Phải (1/4)',
    },
    {
      key: 'showQuickActionsWidget' as const,
      name: 'Khối 6: Tiện ích quân nhân / Cuộc thi trực tuyến',
      desc: 'Các thẻ truy cập nhanh vào Kho văn bản, Bài giảng số, Họp Đảng ủy, Tra cứu',
      icon: Laptop,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      column: 'Cột Phải (1/4)',
    },
    {
      key: 'showCategoryColumns' as const,
      name: 'Khối 7: Tin tức theo chuyên mục toàn diện',
      desc: 'Hiển thị các khung bài viết theo phòng ban (CTĐ-CTCT, Quân sự, Hậu cần, Kỹ thuật)',
      icon: BookOpen,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
      column: 'Phần Thân dưới (Full)',
    },
    {
      key: 'showQuickLibrarySection' as const,
      name: 'Khối 8: Thư viện Văn bản & Bài giảng số nhanh',
      desc: 'Khung tra cứu tải nhanh tài liệu và học liệu số hóa ở chân trang chủ',
      icon: BookOpen,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      column: 'Phần Chân trang chủ (Full)',
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-950 text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 rounded-xl border border-amber-300/30 text-amber-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-amber-200 uppercase tracking-wide">
                QUẢN LÝ BỐ CỤC TRANG CHỦ (ADMIN)
              </h2>
              <p className="text-[11px] text-white/80">
                Bật/Tắt và tùy chỉnh cấu trúc hiển thị các khối nội dung cho toàn bộ người dùng
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-950 leading-relaxed">
              Các thiết lập bố cục này sẽ được ghi trực tiếp vào Database và áp dụng ngay lập tức cho tất cả cán bộ, chiến sĩ và khách truy cập website.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center justify-between">
              <span>Danh sách các khối hiển thị trên Trang chủ:</span>
              <span className="text-[11px] font-normal text-gray-500">
                Đang bật: <strong className="text-blue-700">{blockItems.filter(b => layout[b.key]).length}</strong> / {blockItems.length}
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {blockItems.map((item) => {
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-xs truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                            {item.column}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
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
