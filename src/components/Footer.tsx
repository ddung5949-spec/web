import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { PageView, SiteConfig, User } from '../types';
import { BackToTop } from './BackToTop';
import { FooterManagerModal } from './modals/FooterManagerModal';

const MILITARY_DEFAULT_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Emblem_of_the_Vietnam_People%27s_Army.svg/300px-Emblem_of_the_Vietnam_People%27s_Army.svg.png';

interface FooterProps {
  siteConfig: SiteConfig;
  currentUser?: User | null;
  isAdmin?: boolean;
  onOpenCustomization?: () => void;
  onUpdateSiteConfig?: (updatedConfig: Partial<SiteConfig>) => void;
  onSelectPage?: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({
  siteConfig,
  currentUser,
  isAdmin: propIsAdmin,
  onOpenCustomization,
  onUpdateSiteConfig,
}) => {
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);

  const isAdmin = propIsAdmin ?? (currentUser?.role === 'admin');

  const siteInfo = siteConfig?.site_info || {};
  const footerConfig = siteConfig?.footer_config || {};
  const colors = footerConfig?.colors || {};

  const mainBg =
    colors.mainBg ||
    colors.bg ||
    siteConfig?.footerBgColor ||
    siteConfig?.colorGreen ||
    '#143D2B';

  const sloganBg =
    colors.sloganBg ||
    colors.slogan_bg ||
    siteConfig?.footerSloganBgColor ||
    '#0A2318';

  const accentColor =
    colors.textColor ||
    colors.accent ||
    siteConfig?.footerAccentColor ||
    '#FBBF24';

  const unitName =
    siteConfig?.footerUnitName ||
    siteInfo?.unit_name ||
    'TRUNG ĐOÀN 95, SƯ ĐOÀN 2, QUÂN KHU 5';

  const sloganText =
    siteConfig?.slogan ||
    'ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG';

  const logoUrl =
    siteConfig?.customLogoUrl ||
    siteConfig?.logo_url ||
    MILITARY_DEFAULT_LOGO;

  const showBackToTop =
    siteConfig?.footer_config?.toggles?.show_back_to_top ??
    (siteConfig?.footerShowBackToTop !== false);

  const handleOpenEdit = () => {
    if (onOpenCustomization) {
      onOpenCustomization();
    } else if (onUpdateSiteConfig) {
      setIsFooterModalOpen(true);
    }
  };

  return (
    <footer
      id="main-app-footer"
      className="w-full text-white mt-8 transition-colors duration-300 relative shadow-inner select-none"
      style={{
        backgroundColor: mainBg,
        borderTop: `2px solid ${accentColor}`,
      }}
    >
      {/* Nút Back to top */}
      {showBackToTop && <BackToTop />}

      {/* KHỐI XANH LÁ: Siêu gọn py-1.5 sm:py-2, dàn 1 hàng ngang duy nhất */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 relative flex items-center justify-center">
        {/* Nút "Sửa chân trang" (dành riêng cho Admin) */}
        {isAdmin && (onOpenCustomization || onUpdateSiteConfig) && (
          <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10">
            <button
              type="button"
              id="admin-edit-footer-btn"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-red-950 text-[10px] sm:text-xs font-bold rounded shadow transition-all cursor-pointer border border-amber-200 active:scale-95"
              title="Quản trị viên chỉnh sửa nội dung chân trang"
            >
              <Sliders className="w-3 h-3" />
              <span className="hidden sm:inline">Sửa</span>
            </button>
          </div>
        )}

        {/* 1 hàng ngang duy nhất: Logo nhỏ + Tên cổng thông tin & Đơn vị */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-center flex-wrap px-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0">
            <img
              src={logoUrl}
              alt="Logo Quân đội Nhân dân Việt Nam"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = MILITARY_DEFAULT_LOGO;
              }}
              className="w-full h-full object-contain drop-shadow-xs"
            />
          </div>

          <span
            className="font-bold text-xs sm:text-sm uppercase tracking-wide leading-tight"
            style={{ color: accentColor }}
          >
            TRUYỀN THÔNG ĐOÀN MANG YANG — {unitName}
          </span>
        </div>
      </div>

      {/* DẢI SLOGAN ĐÁY TRANG: py-1 sm:py-1.5, co giãn text-[10px] sm:text-xs */}
      <div
        id="footer-slogan-bar"
        className="w-full py-1 sm:py-1.5 px-3 sm:px-4 overflow-hidden border-t border-yellow-500/20"
        style={{ backgroundColor: sloganBg }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
          <div className="h-[1px] flex-1 max-w-[50px] sm:max-w-[100px] md:max-w-[140px] bg-gradient-to-r from-transparent to-amber-400/70"></div>
          <p
            className="px-2 text-[10px] sm:text-xs font-black uppercase text-center leading-tight whitespace-normal break-words"
            style={{ color: accentColor }}
          >
            {sloganText}
          </p>
          <div className="h-[1px] flex-1 max-w-[50px] sm:max-w-[100px] md:max-w-[140px] bg-gradient-to-l from-transparent to-amber-400/70"></div>
        </div>
      </div>

      {/* Footer Manager Modal for Admin */}
      {isFooterModalOpen && onUpdateSiteConfig && (
        <FooterManagerModal
          siteConfig={siteConfig}
          onSave={(updated) => {
            onUpdateSiteConfig(updated);
          }}
          onClose={() => setIsFooterModalOpen(false)}
        />
      )}
    </footer>
  );
};

export default Footer;