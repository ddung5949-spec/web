import React from 'react';
import { SiteConfig } from '../types';

interface FooterProps {
  siteConfig: SiteConfig;
  onOpenCustomization?: () => void;
  isAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ siteConfig, onOpenCustomization, isAdmin }) => {
  const siteInfo = siteConfig?.site_info || {};
  const footerConfig = siteConfig?.footer_config || {};
  const colors = footerConfig?.colors || {};

  const mainBg = colors.mainBg || '#143D2B';
  const sloganBg = colors.sloganBg || '#0A2318';
  const accentColor = colors.textColor || '#FBBF24';

  const unitName = siteConfig?.footerUnitName || siteInfo?.unit_name || "TRUNG ĐOÀN 95 - SƯ ĐOÀN 2 - QUÂN KHU 5";
  const address = siteConfig?.footerAddress || siteInfo?.stationed_area || "Thành phố Pleiku, Tỉnh Gia Lai";
  const hotline = siteConfig?.footerHotline || siteInfo?.hotline || "069.xxx.xxx (Trực ban Tác chiến)";
  const email = siteConfig?.footerEmail || siteInfo?.internal_email || "tuyenhuan.mangyang@bqp.vn";
  const sloganText = siteConfig?.slogan || "ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG";

  return (
    <footer className="w-full text-white mt-12 transition-colors duration-300" style={{ backgroundColor: mainBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {isAdmin && onOpenCustomization && (
          <button
            onClick={onOpenCustomization}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-all"
          >
            ⚙️ Sửa chân trang
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center md:text-left">
          {/* Cột 1: Logo & Tên đơn vị duy nhất (không bị lặp dòng) */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <img
              src={siteConfig?.logo_url || "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Emblem_of_the_Vietnam_People%27s_Army.svg/300px-Emblem_of_the_Vietnam_People%27s_Army.svg.png"}
              alt="Logo"
              className="w-14 h-14 object-contain shrink-0 drop-shadow"
            />
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-wide uppercase" style={{ color: accentColor }}>
                TRUYỀN THÔNG ĐOÀN MANG YANG
              </h3>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-yellow-100/90 mt-0.5">
                {unitName}
              </p>
            </div>
          </div>

          {/* Cột 2: Địa bàn đóng quân */}
          <div className="flex flex-col items-center md:items-start text-xs sm:text-sm text-yellow-50/90 space-y-1">
            <span className="font-bold flex items-center gap-1.5" style={{ color: accentColor }}>
              📍 ĐỊA BÀN ĐÓNG QUÂN:
            </span>
            <p className="leading-relaxed">{address}</p>
          </div>

          {/* Cột 3: Hotline & Email liên hệ nội bộ */}
          <div className="flex flex-col items-center md:items-start text-xs sm:text-sm text-yellow-50/90 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: accentColor }}>📞 Trực ban:</span>
              <span>{hotline}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold" style={{ color: accentColor }}>✉️ Email:</span>
              <span>{email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dải Slogan đáy trang */}
      <div className="w-full py-2.5 px-4 overflow-hidden border-t border-yellow-500/20" style={{ backgroundColor: sloganBg }}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <div className="h-[1px] flex-1 max-w-[100px] sm:max-w-[160px] bg-gradient-to-r from-transparent to-yellow-400"></div>
          <p
            className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-widest text-center whitespace-nowrap"
            style={{ color: accentColor }}
          >
            {sloganText}
          </p>
          <div className="h-[1px] flex-1 max-w-[100px] sm:max-w-[160px] bg-gradient-to-l from-transparent to-yellow-400"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;