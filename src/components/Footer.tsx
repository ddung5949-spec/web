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
    'TRUNG ĐOÀN 95 - SƯ ĐOÀN 2 - QUÂN KHU 5';

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
      className="w-full text-white mt-10 transition-colors duration-300 relative shadow-inner select-none"
      style={{
        backgroundColor: mainBg,
        borderTop: `2px solid ${accentColor}`,
      }}
    >
      {/* Nút Back to top */}
      {showBackToTop && <BackToTop />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
        {/* Nút "Sửa chân trang" (dành riêng cho Admin) */}
        {isAdmin && (onOpenCustomization || onUpdateSiteConfig) && (
          <div className="absolute right-3 sm:right-6 top-3 sm:top-4 z-10">
            <button
              type="button"
              id="admin-edit-footer-btn"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-400 hover:bg-amber-300 text-red-950 text-[11px] sm:text-xs font-black rounded-lg shadow-md transition-all cursor-pointer border border-amber-200 active:scale-95"
              title="Quản trị viên chỉnh sửa nội dung chân trang"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sửa chân trang</span>
            </button>
          </div>
        )}

        {/* KHỐI CHÍNH: Căn giữa trang trọng, cân đối trên cả PC, iPad và Mobile */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          {/* Logo đơn vị: w-12 h-12 trên mobile, w-14 h-14 trên PC */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
            <img
              src={logoUrl}
              alt="Logo Trung đoàn 95"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = MILITARY_DEFAULT_LOGO;
              }}
              className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Tên cổng thông tin & Đơn vị cấp trên */}
          <div className="space-y-1 max-w-2xl px-2">
            <h3
              className="font-black text-base sm:text-lg md:text-xl tracking-wide uppercase leading-snug drop-shadow-xs"
              style={{ color: accentColor }}
            >
              TRUYỀN THÔNG ĐOÀN MANG YANG
            </h3>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-yellow-100/90 mt-1">
              {unitName}
            </p>
          </div>
        </div>
      </div>

      {/* DẢI SLOGAN ĐÁY TRANG: Responsive 100%, ngắt dòng mềm mại, không tràn viền */}
      <div
        id="footer-slogan-bar"
        className="w-full py-2 sm:py-2.5 px-3 sm:px-4 overflow-hidden border-t border-yellow-500/20"
        style={{ backgroundColor: sloganBg }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
          <div className="h-[1px] flex-1 max-w-[60px] sm:max-w-[120px] md:max-w-[160px] bg-gradient-to-r from-transparent to-amber-400/80"></div>
          <p
            className="px-3 py-2 text-[11px] sm:text-xs md:text-sm font-black uppercase text-center leading-tight whitespace-normal break-words"
            style={{ color: accentColor }}
          >
            {sloganText}
          </p>
          <div className="h-[1px] flex-1 max-w-[60px] sm:max-w-[120px] md:max-w-[160px] bg-gradient-to-l from-transparent to-amber-400/80"></div>
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