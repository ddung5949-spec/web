import React, { useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Layers,
  Layout,
  Mail,
  MapPin,
  Palette,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { FooterCustomLink, SiteConfig } from '../../types';

interface FooterManagerModalProps {
  siteConfig: SiteConfig;
  onSave: (updatedConfig: Partial<SiteConfig>) => void;
  onClose: () => void;
}

export const FooterManagerModal: React.FC<FooterManagerModalProps> = ({
  siteConfig,
  onSave,
  onClose,
}) => {
  // Form States
  const [footerUnitName, setFooterUnitName] = useState(siteConfig.footerUnitName || 'Trung đoàn 95, Sư đoàn 2');
  const [footerAddress, setFooterAddress] = useState(siteConfig.footerAddress || 'Đắk Đoa, Gia Lai (Địa bàn đóng quân Trung đoàn 95)');
  const [footerHotline, setFooterHotline] = useState(siteConfig.footerHotline || '069.xxx.xxx (Trực ban Tác chiến / Ban Chính trị)');
  const [footerEmail, setFooterEmail] = useState(siteConfig.footerEmail || 'chinhtri.trungdoan95@bqp.vn');
  const [slogan, setSlogan] = useState(siteConfig.slogan || 'ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG');
  const [footerCopyright, setFooterCopyright] = useState(siteConfig.footerCopyright || '© Bản quyền thuộc về Trung đoàn 95, Sư đoàn 2');

  // Layout & Styling
  const [footerLayout, setFooterLayout] = useState<'split' | 'centered' | 'compact' | 'columns'>(
    siteConfig.footerLayout || 'split'
  );
  const [footerBgColor, setFooterBgColor] = useState(siteConfig.footerBgColor || '#143d2b');
  const [footerSloganBgColor, setFooterSloganBgColor] = useState(siteConfig.footerSloganBgColor || '#0a2318');
  const [footerAccentColor, setFooterAccentColor] = useState(siteConfig.footerAccentColor || '#fbbf24');

  // Visibility Toggles
  const [showLogo, setShowLogo] = useState(siteConfig.footerShowLogo !== false);
  const [showAddress, setShowAddress] = useState(siteConfig.footerShowAddress !== false);
  const [showContact, setShowContact] = useState(siteConfig.footerShowContact !== false);
  const [showSlogan, setShowSlogan] = useState(siteConfig.footerShowSlogan !== false);
  const [showBackToTop, setShowBackToTop] = useState(siteConfig.footerShowBackToTop !== false);
  const [showCustomLinks, setShowCustomLinks] = useState(siteConfig.footerShowCustomLinks !== false);

  // Custom Links
  const [customLinks, setCustomLinks] = useState<FooterCustomLink[]>(
    siteConfig.footerCustomLinks || [
      { id: 'link-1', label: 'Cổng TTĐT Bộ Quốc phòng', url: 'http://mod.gov.vn', openNewTab: true },
      { id: 'link-2', label: 'Báo Quân đội nhân dân', url: 'https://www.qdnd.vn', openNewTab: true },
      { id: 'link-3', label: 'Báo Quân khu 5', url: 'https://baoquankhu5.vn', openNewTab: true },
    ]
  );

  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [activeTab, setActiveTab] = useState<'content' | 'layout' | 'links'>('content');

  // Handlers
  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    const newLink: FooterCustomLink = {
      id: `link-${Date.now()}`,
      label: newLinkTitle.trim(),
      url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`,
      openNewTab: true,
    };
    setCustomLinks([...customLinks, newLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (id: string) => {
    setCustomLinks(customLinks.filter((l) => l.id !== id));
  };

  const handleSaveAll = () => {
    onSave({
      footerUnitName: footerUnitName.trim(),
      footerAddress: footerAddress.trim(),
      footerHotline: footerHotline.trim(),
      footerEmail: footerEmail.trim(),
      slogan: slogan.replace(/["”"“]/g, '').trim(),
      footerCopyright: footerCopyright.trim(),
      footerLayout,
      footerBgColor,
      footerSloganBgColor,
      footerAccentColor,
      footerShowLogo: showLogo,
      footerShowAddress: showAddress,
      footerShowContact: showContact,
      footerShowSlogan: showSlogan,
      footerShowBackToTop: showBackToTop,
      footerShowCustomLinks: showCustomLinks,
      footerCustomLinks: customLinks,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setFooterUnitName('Trung đoàn 95, Sư đoàn 2');
    setFooterAddress('Đắk Đoa, Gia Lai (Địa bàn đóng quân Trung đoàn 95)');
    setFooterHotline('069.xxx.xxx (Trực ban Tác chiến / Ban Chính trị)');
    setFooterEmail('chinhtri.trungdoan95@bqp.vn');
    setSlogan('ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG');
    setFooterLayout('split');
    setFooterBgColor('#143d2b');
    setFooterSloganBgColor('#0a2318');
    setFooterAccentColor('#fbbf24');
    setShowLogo(true);
    setShowAddress(true);
    setShowContact(true);
    setShowSlogan(true);
    setShowBackToTop(true);
    setShowCustomLinks(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#143d2b] via-[#1e583e] to-[#0f3020] text-white p-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold uppercase tracking-wide text-amber-200">
                Quản lý & Tùy chỉnh Chân trang (Footer)
              </h3>
              <p className="text-xs text-white/80">
                Thay đổi toàn diện nội dung, vị trí hiển thị, màu sắc và liên kết ở chân trang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'content'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Nội dung & Thông tin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'layout'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Bố cục & Vị trí hiển thị</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'links'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Liên kết hữu ích ({customLinks.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-3.5">
              {/* Unit Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tên đơn vị phụ trách / Bản quyền:
                </label>
                <input
                  type="text"
                  value={footerUnitName}
                  onChange={(e) => setFooterUnitName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-700 focus:outline-hidden text-xs font-semibold"
                  placeholder="Trung đoàn 95, Sư đoàn 2"
                />
              </div>

              {/* Slogan */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Khẩu hiệu hành động (Slogan chân trang):
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-700 focus:outline-hidden text-xs font-bold text-emerald-900"
                  placeholder="ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG"
                />
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Tự động căn chính giữa, loại bỏ dấu ngoặc kép và có 2 đường chỉ vàng trang trí.
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Địa chỉ đóng quân / Trụ sở:</span>
                </label>
                <input
                  type="text"
                  value={footerAddress}
                  onChange={(e) => setFooterAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-700 focus:outline-hidden text-xs"
                  placeholder="Thành phố Pleiku, Tỉnh Gia Lai"
                />
              </div>

              {/* Hotline & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Số điện thoại / Trực ban:</span>
                  </label>
                  <input
                    type="text"
                    value={footerHotline}
                    onChange={(e) => setFooterHotline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-700 focus:outline-hidden text-xs"
                    placeholder="069.xxx.xxx"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Hòm thư điện tử quân sự (Email):</span>
                  </label>
                  <input
                    type="text"
                    value={footerEmail}
                    onChange={(e) => setFooterEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-700 focus:outline-hidden text-xs"
                    placeholder="tuyenhuan.mangyang@bqp.vn"
                  />
                </div>
              </div>

              {/* Copyright */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Dòng ghi chú bản quyền / Giấy phép:
                </label>
                <input
                  type="text"
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-700 focus:outline-hidden text-xs text-gray-600"
                  placeholder="© Bản quyền thuộc về Trung đoàn 95, Sư đoàn 2"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT & VISIBILITY */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              {/* Layout Mode Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-2">
                  Bố cục chân trang:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'split', label: 'Bố cục 2 bên (Split)', desc: 'Logo & thông tin bên trái' },
                    { id: 'centered', label: 'Căn giữa (Centered)', desc: 'Trang trọng, thẳng hàng' },
                    { id: 'compact', label: 'Siêu tinh gọn (Compact)', desc: 'Tiết kiệm diện tích' },
                    { id: 'columns', label: 'Đa cột (Columns)', desc: 'Bao gồm liên kết ngoài' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFooterLayout(mode.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        footerLayout === mode.id
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-600/30'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="font-extrabold text-xs block">{mode.label}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility Checkboxes */}
              <div>
                <label className="block font-bold text-gray-700 mb-2">
                  Bật / Tắt các thành phần hiển thị:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-800">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                    />
                    <span className="font-semibold">Hiển thị Huy hiệu / Logo đơn vị</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-800">
                    <input
                      type="checkbox"
                      checked={showAddress}
                      onChange={(e) => setShowAddress(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                    />
                    <span className="font-semibold">Hiển thị Địa chỉ đóng quân</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-800">
                    <input
                      type="checkbox"
                      checked={showContact}
                      onChange={(e) => setShowContact(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                    />
                    <span className="font-semibold">Hiển thị Số điện thoại & Email</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-800">
                    <input
                      type="checkbox"
                      checked={showSlogan}
                      onChange={(e) => setShowSlogan(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                    />
                    <span className="font-semibold">Hiển thị Dải Khẩu hiệu (Slogan)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-800">
                    <input
                      type="checkbox"
                      checked={showBackToTop}
                      onChange={(e) => setShowBackToTop(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                    />
                    <span className="font-semibold">Hiển thị Nút "Lên đầu trang"</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-800">
                    <input
                      type="checkbox"
                      checked={showCustomLinks}
                      onChange={(e) => setShowCustomLinks(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded cursor-pointer"
                    />
                    <span className="font-semibold">Hiển thị Dãy liên kết hữu ích</span>
                  </label>
                </div>
              </div>

              {/* Color Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Màu nền chính chân trang:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={footerBgColor}
                      onChange={(e) => setFooterBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={footerBgColor}
                      onChange={(e) => setFooterBgColor(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Màu nền dải Slogan:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={footerSloganBgColor}
                      onChange={(e) => setFooterSloganBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={footerSloganBgColor}
                      onChange={(e) => setFooterSloganBgColor(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Màu điểm nhấn vàng (Accent):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={footerAccentColor}
                      onChange={(e) => setFooterAccentColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={footerAccentColor}
                      onChange={(e) => setFooterAccentColor(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-3.5">
              {/* Add Link Form */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Thêm liên kết hữu ích mới vào chân trang:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Tên liên kết (vd: Báo QĐND)"
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="Địa chỉ URL (vd: https://qdnd.vn)"
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Links List */}
              <div className="space-y-2">
                <span className="font-bold text-gray-700">
                  Danh sách liên kết đang hiển thị:
                </span>
                {customLinks.length > 0 ? (
                  <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    {customLinks.map((link, idx) => (
                      <div
                        key={link.id}
                        className="p-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-gray-900 truncate">
                            {link.label}
                          </span>
                          <span className="text-gray-400 text-[11px] truncate max-w-xs font-mono">
                            ({link.url})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(link.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Xóa liên kết"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-gray-200">
                    Chưa có liên kết nào được cấu hình.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-gray-600 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              HỦY BỎ
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>LƯU CẤU HÌNH CHÂN TRANG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
