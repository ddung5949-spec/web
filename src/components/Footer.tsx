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
    <>
      {/* Nút Back to top: Nằm hoàn toàn NGOÀI thẻ footer, trên nền trong suốt/xám tự nhiên của trang */}
      {showBackToTop && <BackToTop className="my-3 sm:my-4" />}

      {/* Thẻ <footer> nền xanh: Bắt đầu bên dưới nút "Lên đầu trang" với chiều cao mỏng py-2 */}
      <footer
        id="main-app-footer"
        className="w-full text-white transition-colors duration-300 relative shadow-inner select-none"
        style={{
          backgroundColor: mainBg,
          borderTop: `2px solid ${accentColor}`,
        }}
      >
        {/* KHỐI XANH LÁ: py-2, dàn hàng ngang linh hoạt flex-wrap căn giữa, không mất chữ */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-2 relative flex items-center justify-center">
          {/* Nút "Sửa chân trang" (dành riêng cho Admin) */}
          {isAdmin && (onOpenCustomization || onUpdateSiteConfig) && (
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10">
              <button
                type="button"
                id="admin-edit-footer-btn"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-red-950 text-[10px] font-bold rounded shadow transition-all cursor-pointer border border-amber-200 active:scale-95"
                title="Quản trị viên chỉnh sửa nội dung chân trang"
              >
                <Sliders className="w-3 h-3" />
                <span className="hidden md:inline">Sửa</span>
              </button>
            </div>
          )}

          {/* Hàng nội dung chính: Logo Vector Quân đội SVG + Tên cổng thông tin & Đơn vị (co giãn flex-wrap, text-[10px] sm:text-xs) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-center flex-wrap px-1 max-w-full">
            {/* Logo vector SVG chuẩn: Sao vàng nền đỏ, viền vàng kim, không phụ thuộc ảnh mạng ngoài */}
            <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-sm"
                aria-label="Huy hiệu Quân đội Nhân dân Việt Nam"
              >
                <circle cx="50" cy="50" r="46" fill="#B91C1C" stroke="#FBBF24" strokeWidth="5" />
                <polygon
                  points="50,14 61,38 86,38 66,54 74,78 50,63 26,78 34,54 14,38 39,38"
                  fill="#FBBF24"
                />
              </svg>
            </div>

            <p
              className="font-bold text-[10px] sm:text-xs uppercase tracking-wide leading-tight text-center break-words"
              style={{ color: accentColor }}
            >
              TRUYỀN THÔNG ĐOÀN MANG YANG <span className="opacity-75">—</span> {unitName}
            </p>
          </div>
        </div>

        {/* DẢI SLOGAN ĐÁY TRANG: py-1.5 nền xanh sẫm, chữ vàng kim rõ nét không bao giờ mất chữ */}
        <div
          id="footer-slogan-bar"
          className="w-full py-1.5 px-3 sm:px-4 overflow-hidden border-t border-yellow-500/20"
          style={{ backgroundColor: sloganBg }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
            <div className="h-[1px] flex-1 max-w-[50px] sm:max-w-[100px] md:max-w-[140px] bg-gradient-to-r from-transparent to-amber-400/80"></div>
            <p
              className="px-2 text-[10px] sm:text-xs md:text-sm font-black uppercase text-center leading-tight whitespace-normal break-words tracking-wider"
              style={{ color: accentColor }}
            >
              {sloganText}
            </p>
            <div className="h-[1px] flex-1 max-w-[50px] sm:max-w-[100px] md:max-w-[140px] bg-gradient-to-l from-transparent to-amber-400/80"></div>
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
    </>
  );
};

export default Footer;