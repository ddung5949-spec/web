import React, { useState } from 'react';
import { ExternalLink, Globe, MapPin, Phone, Mail, Sliders } from 'lucide-react';
import { PageView, SiteConfig, User } from '../types';
import { UnitLogo } from './UnitLogo';
import { BackToTop } from './BackToTop';
import { FooterManagerModal } from './modals/FooterManagerModal';

interface FooterProps {
  siteConfig: SiteConfig;
  currentUser?: User | null;
  onSelectPage?: (page: PageView) => void;
  onUpdateSiteConfig?: (updatedConfig: Partial<SiteConfig>) => void;
}

export const Footer: React.FC<FooterProps> = ({
  siteConfig,
  currentUser,
  onUpdateSiteConfig,
}) => {
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Extract footer toggles with nested & flat fallbacks
  const showBackToTop =
    siteConfig.footer_config?.toggles?.show_back_to_top ??
    (siteConfig.footerShowBackToTop !== false);
  const showLogo =
    siteConfig.footer_config?.toggles?.show_logo ??
    (siteConfig.footerShowLogo !== false);
  const showAddress =
    siteConfig.footer_config?.toggles?.show_address ??
    (siteConfig.footerShowAddress !== false);
  const showContact =
    siteConfig.footer_config?.toggles?.show_contact ??
    (siteConfig.footerShowContact !== false);
  const showSlogan =
    siteConfig.footer_config?.toggles?.show_slogan ??
    (siteConfig.footerShowSlogan !== false);

  // Extract colors with nested & flat fallbacks
  const mainBg =
    siteConfig.footer_config?.colors?.bg ||
    siteConfig.footerBgColor ||
    siteConfig.colorGreen ||
    '#143d2b';
  const sloganBg =
    siteConfig.footer_config?.colors?.slogan_bg ||
    siteConfig.footerSloganBgColor ||
    '#0a2318';
  const accentColor =
    siteConfig.footer_config?.colors?.accent ||
    siteConfig.footerAccentColor ||
    '#fbbf24';

  // Extract unit and contact information with requested accurate defaults
  const governingBody =
    siteConfig.site_info?.unit_name ||
    siteConfig.footerUnitName ||
    'TRUNG ĐOÀN 95, SƯ ĐOÀN 2, QUÂN KHU 5';

  const stationedArea =
    siteConfig.site_info?.stationed_area ||
    siteConfig.footerAddress ||
    'Thành phố Pleiku, Tỉnh Gia Lai';

  const hotline =
    siteConfig.site_info?.hotline ||
    siteConfig.footerHotline ||
    '069.xxx.xxx (Trực ban Tác chiến)';

  const email =
    siteConfig.site_info?.internal_email ||
    siteConfig.footerEmail ||
    'tuyenhuan.trungdoan95@bqp.vn';

  const copyright =
    siteConfig.footerCopyright ||
    `© Bản quyền thuộc về ${governingBody}`;

  const customLinks =
    siteConfig.footer_config?.custom_links ||
    siteConfig.footerCustomLinks || [
      { id: 'link-1', label: 'Cổng TTĐT Bộ Quốc phòng', url: 'http://mod.gov.vn', openNewTab: true },
      { id: 'link-2', label: 'Báo Quân đội nhân dân', url: 'https://www.qdnd.vn', openNewTab: true },
      { id: 'link-3', label: 'Báo Quân khu 5', url: 'https://baoquankhu5.vn', openNewTab: true },
    ];

  const showCustomLinks =
    siteConfig.footerShowCustomLinks !== false && customLinks.length > 0;

  const rawSlogan = (siteConfig.slogan || 'ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG')
    .replace(/["”"“]/g, '')
    .trim();

  return (
    <div className="w-full select-none relative">
      {/* 1. Nút "Lên đầu trang" (Back to Top): Căn giữa, đệm cách mép viền, tối ưu cảm ứng mobile */}
      {showBackToTop && <BackToTop />}

      {/* 2. Khối Chân trang chính */}
      <footer
        id="main-app-footer"
        className="w-full text-white shadow-md overflow-hidden relative"
        style={{
          backgroundColor: mainBg,
          borderTop: `2px solid ${accentColor}`,
        }}
      >
        {/* Nút "Sửa chân trang" (dành riêng cho Admin) đặt ở góc phải phía trên của Footer */}
        {isAdmin && onUpdateSiteConfig && (
          <div className="absolute right-3 sm:right-6 lg:right-8 top-3 z-20">
            <button
              type="button"
              id="admin-edit-footer-btn"
              onClick={() => setIsFooterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-400 hover:bg-amber-300 text-red-950 text-[11px] sm:text-xs font-black rounded-lg shadow-md transition-all cursor-pointer border border-amber-200 active:scale-95"
              title="Quản trị viên chỉnh sửa toàn bộ nội dung chân trang"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sửa chân trang</span>
            </button>
          </div>
        )}

        {/* 3A. BỐ CỤC MOBILE (< 768px): Tự động co giãn kích cỡ chữ & biểu tượng theo tỷ lệ màn hình (clamp/sm:), xếp chồng dọc 1 cột ngay ngắn, không tràn viền */}
        <div className="block md:hidden px-4 pt-8 pb-5 space-y-4">
          <div className="flex flex-col items-center text-center">
            {showLogo && (
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2">
                <UnitLogo
                  size="md"
                  customSizePx={siteConfig.footerLogoSizePx ? Math.min(siteConfig.footerLogoSizePx, 52) : 46}
                  withGlow={siteConfig.enableLogoGlow !== false}
                  withRotatingBeam={siteConfig.enableLogoBeam !== false}
                  logoType={siteConfig.logoType}
                  customLogoUrl={siteConfig.customLogoUrl}
                  slogan={siteConfig.slogan}
                  establishedDate={siteConfig.establishedDate}
                />
              </div>
            )}

            <h3
              className="text-[clamp(13px,3.5vw,16px)] font-black uppercase tracking-wide leading-snug"
              style={{ color: accentColor }}
            >
              {siteConfig.title}
            </h3>

            {siteConfig.subtitle && (
              <p className="text-[clamp(10px,2.5vw,12px)] font-semibold uppercase text-white/90 tracking-wider mt-0.5">
                {siteConfig.subtitle}
              </p>
            )}

            {governingBody && (
              <p className="text-[clamp(11px,2.8vw,13px)] text-amber-200/90 font-bold uppercase tracking-wide mt-1">
                {governingBody}
              </p>
            )}
          </div>

          {/* Địa bàn đóng quân, Hotline, Email nội bộ trên mobile */}
          <div className="flex flex-col items-center text-center space-y-2 text-[clamp(11px,2.6vw,12px)] text-yellow-100/90 leading-relaxed max-w-md mx-auto">
            {showAddress && stationedArea && (
              <div className="flex items-center justify-center gap-1.5 px-2">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Doanh trại: <strong className="text-white font-medium">{stationedArea}</strong></span>
              </div>
            )}

            {showContact && (hotline || email) && (
              <div className="flex flex-col items-center justify-center gap-1 w-full">
                {hotline && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Trực ban tác chiến: <strong className="font-mono text-amber-200 font-bold">{hotline}</strong></span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Email liên hệ: <strong className="font-mono text-amber-200 font-bold">{email}</strong></span>
                  </div>
                )}
              </div>
            )}

            {copyright && (
              <p className="text-[10px] text-white/60 pt-1 leading-normal">
                {copyright}
              </p>
            )}
          </div>

          {/* Dãy liên kết hữu ích trên mobile */}
          {showCustomLinks && (
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {customLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.openNewTab !== false ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white hover:text-amber-200 text-[10px] font-semibold transition-colors inline-flex items-center gap-1 border border-white/15 cursor-pointer touch-manipulation"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 3B. BỐ CỤC TABLET & DESKTOP (>= 768px): Khôi phục bố cục 3 cột cân đối, trang trọng như ban đầu */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-start text-left py-6 px-6 lg:px-8 max-w-[1850px] mx-auto">
          {/* CỘT 1: Logo đơn vị sắc nét + Tên cơ quan chủ quản ("TRUNG ĐOÀN 95, SƯ ĐOÀN 2, QUÂN KHU 5") */}
          <div className="flex items-center gap-4">
            {showLogo && (
              <div className="shrink-0">
                <UnitLogo
                  size="md"
                  customSizePx={siteConfig.footerLogoSizePx || 54}
                  withGlow={siteConfig.enableLogoGlow !== false}
                  withRotatingBeam={siteConfig.enableLogoBeam !== false}
                  logoType={siteConfig.logoType}
                  customLogoUrl={siteConfig.customLogoUrl}
                  slogan={siteConfig.slogan}
                  establishedDate={siteConfig.establishedDate}
                />
              </div>
            )}
            <div className="space-y-1 min-w-0">
              <h3
                className="font-black uppercase text-sm lg:text-base tracking-wider leading-tight"
                style={{ color: accentColor }}
              >
                {siteConfig.title}
              </h3>
              {siteConfig.subtitle && (
                <p className="text-white/80 font-semibold text-xs uppercase tracking-wide leading-tight">
                  {siteConfig.subtitle}
                </p>
              )}
              <div className="text-amber-200 font-bold text-xs uppercase tracking-wide pt-0.5 leading-snug">
                {governingBody}
              </div>
            </div>
          </div>

          {/* CỘT 2: Địa bàn đóng quân / Doanh trại ("Thành phố Pleiku, Tỉnh Gia Lai") */}
          <div className="space-y-2">
            {showAddress && stationedArea && (
              <div className="text-xs text-yellow-100/95 leading-relaxed flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/70">Địa bàn đóng quân: </span>
                  <strong className="text-white font-bold">{stationedArea}</strong>
                </div>
              </div>
            )}

            <div className="text-[11px] text-white/75 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
              <span>Hệ thống Thông tin điện tử nội bộ • Sẵn sàng chiến đấu</span>
            </div>

            {showCustomLinks && (
              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 mr-1">
                  Liên kết:
                </span>
                {customLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target={link.openNewTab !== false ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white hover:text-amber-200 text-[10px] font-semibold transition-colors inline-flex items-center gap-1 border border-white/15 cursor-pointer"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* CỘT 3: Đường dây nóng / Trực ban tác chiến & Email nội bộ liên hệ tuyên huấn + Bản quyền */}
          <div className="space-y-1.5">
            {showContact && (
              <div className="space-y-1.5 text-xs text-yellow-100/90">
                {hotline && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Đường dây nóng: <strong className="font-mono text-amber-200 font-bold">{hotline}</strong></span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Email Tuyên huấn: <strong className="font-mono text-amber-200 font-bold">{email}</strong></span>
                  </div>
                )}
              </div>
            )}

            {copyright && (
              <div className="text-[11px] text-white/60 pt-1 leading-normal">
                {copyright}
              </div>
            )}
          </div>
        </div>

        {/* 4. Khối dưới: Dải Slogan truyền thống kẹp giữa 2 đường chỉ vàng kim:
            "——— ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG ———" */}
        {showSlogan && (
          <div
            id="footer-slogan-bar"
            className="w-full overflow-hidden px-3 py-2.5 pb-8 sm:pb-2.5 border-t border-black/30 flex items-center justify-center"
            style={{
              backgroundColor: sloganBg,
              color: accentColor,
            }}
          >
            <div className="max-w-5xl w-full flex items-center justify-center gap-2 sm:gap-4">
              {/* Đường chỉ vàng kim bên trái */}
              <span className="hidden sm:block flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-amber-300" />
              <span className="hidden md:inline text-amber-300 font-bold text-xs tracking-tighter">———</span>

              {/* Dòng khẩu hiệu trung tâm */}
              <p className="w-full sm:w-auto text-[11px] sm:text-xs md:text-sm font-black tracking-wider sm:tracking-widest uppercase text-center leading-relaxed break-words px-2 m-0 select-text text-amber-300 drop-shadow-xs">
                {rawSlogan}
              </p>

              {/* Đường chỉ vàng kim bên phải */}
              <span className="hidden md:inline text-amber-300 font-bold text-xs tracking-tighter">———</span>
              <span className="hidden sm:block flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-amber-400/50 to-amber-300" />
            </div>
          </div>
        )}
      </footer>

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
    </div>
  );
};
