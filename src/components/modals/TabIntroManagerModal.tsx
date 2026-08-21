import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Sparkles, Shield, Crosshair, Heart, FolderLock, Laptop, Landmark } from 'lucide-react';
import { SiteConfig, SiteSectionsConfig } from '../../types';

interface TabIntroManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteConfig: SiteConfig;
  initialTab?: string;
  onSaveSiteConfig: (config: SiteConfig) => void;
}

export const TabIntroManagerModal: React.FC<TabIntroManagerModalProps> = ({
  isOpen,
  onClose,
  siteConfig,
  initialTab = 'doc',
  onSaveSiteConfig,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);

  const [title, setTitle] = useState('');
  const [shortLabel, setShortLabel] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [desc, setDesc] = useState('');

  const tabOptions = [
    { id: 'ctd', name: 'CTĐ - CTCT', icon: Shield, color: 'text-red-700' },
    { id: 'hl', name: 'Huấn luyện - SSCĐ', icon: Crosshair, color: 'text-emerald-700' },
    { id: 'bac', name: 'Học tập theo Bác', icon: Heart, color: 'text-amber-600' },
    { id: 'doc', name: 'Văn bản - Chỉ thị', icon: FolderLock, color: 'text-blue-700' },
    { id: 'lecture', name: 'Bài giảng số', icon: Laptop, color: 'text-teal-700' },
    { id: 'meeting', name: 'Họp Đảng ủy', icon: Landmark, color: 'text-pink-700' },
  ];

  // Load current values when selectedTab changes or modal opens
  useEffect(() => {
    if (!isOpen) return;
    const sec = (siteConfig.sections as any)?.[selectedTab];
    if (sec) {
      setTitle(sec.title || '');
      setShortLabel(sec.shortLabel || '');
      setSubTitle(sec.subTitle || '');
      setDesc(sec.desc || '');
    }
  }, [isOpen, selectedTab, siteConfig]);

  useEffect(() => {
    if (initialTab) {
      setSelectedTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSections: SiteSectionsConfig = {
      ...siteConfig.sections,
      [selectedTab]: {
        ...(siteConfig.sections as any)[selectedTab],
        title: title.trim(),
        shortLabel: shortLabel.trim(),
        subTitle: subTitle.trim(),
        desc: desc.trim(),
      },
    };

    onSaveSiteConfig({
      ...siteConfig,
      sections: updatedSections,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-rose-950 text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 rounded-lg text-amber-300 border border-amber-300/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-300 uppercase tracking-wide">
                QUẢN TRỊ NỘI DUNG GIỚI THIỆU CHUYÊN MỤC / TAB
              </h3>
              <p className="text-[11px] text-red-100">
                Tùy chỉnh tiêu đề, phụ đề, khẩu hiệu và mô tả hiển thị trên các trang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Buttons */}
        <div className="bg-gray-100 p-2.5 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedTab === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedTab(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-800 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : opt.color}`} />
                <span>{opt.name}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Live Preview Box */}
          <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-950 p-4 rounded-xl text-white border border-gray-700 space-y-1">
            <div className="text-[10px] font-extrabold uppercase text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Xem trước Banner tiêu đề Tab:</span>
            </div>
            <div className="text-base font-extrabold text-amber-200 uppercase tracking-wide">
              {title || 'Tiêu đề chuyên mục'}
            </div>
            <div className="text-xs text-white/90 font-medium">
              {subTitle || 'Phụ đề / Khẩu hiệu dẫn dắt chuyên ngành'}
            </div>
            <div className="text-[11px] text-gray-300 italic pt-0.5">
              {desc || 'Mô tả chi tiết mục đích và nội dung lưu trữ...'}
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">
              1. Tiêu đề hiển thị chính (*):
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề lớn của chuyên mục..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:border-red-700 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                2. Tên rút gọn (Hiển thị thanh menu / breadcrumb) (*):
              </label>
              <input
                type="text"
                value={shortLabel}
                onChange={(e) => setShortLabel(e.target.value)}
                placeholder="Ví dụ: CTĐ - CTCT, Văn bản số..."
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:bg-white focus:border-red-700 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-1">
                3. Phụ đề / Khẩu hiệu ngắn:
              </label>
              <input
                type="text"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="Ví dụ: Hệ thống văn kiện & chỉ thị tác chiến..."
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-900 focus:bg-white focus:border-red-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">
              4. Mô tả chi tiết / Hướng dẫn gửi tin bài / Mục đích tra cứu:
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Nhập mô tả chi tiết của chuyên mục..."
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-red-700 focus:outline-hidden"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>LƯU NỘI DUNG GIỚI THIỆU</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
