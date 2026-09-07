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

  // Extract unit and contact information
  const unitName =
    siteConfig.site_info?.unit_name ||
    siteConfig.footerUnitName ||
    'Trung đoàn 95, Sư đoàn 2';
  const address =
    siteConfig.site_info?.stationed_area ||
    siteConfig.footerAddress ||
    'Đắk Đoa, Gia Lai (Địa bàn đóng quân Trung đoàn 95)';
  const hotline =
    siteConfig.site_info?.hotline ||
    siteConfig.footerHotline ||
    '069.xxx.xxx (Trực ban Tác chiến / Ban Chính trị)';
  const email =
    siteConfig.site_info?.internal_email ||
    siteConfig.footerEmail ||
    'chinhtri.trungdoan95@bqp.vn';
  const copyright =
    siteConfig.footerCopyright ||
    `© Bản quyền thuộc về ${unitName}`;

  const customLinks =
    siteConfig.footer_config?.custom_links ||
    siteConfig.footerCustomLinks || [
      { id: 'link-1', label: 'Cổng TTĐT Bộ Quốc phòng', url: 'http://mod.gov.vn', openNewTab: true },
      { id: 'link-2', label: 'Báo Quân đội nhân dân', url: 'https://www.qdnd.vn', openNewTab: true },
      { id: 'link-3', label: 'Báo Quân khu 5', url: 'https://baoquankhu5.vn', openNewTab: true },
    ];

  const showCustomLinks =
    siteConfig.footerShowCustomLinks !== false && customLinks.length > 0;

  const sloganText = (siteConfig.slogan || 'ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG')
    .replace(/["”"“]/g, '')
    .trim();

  return (
    <div className="w-full select-none relative">
      {/* 1. Nút "Lên đầu trang" (Back to Top): Căn giữa, đệm cách mép viền, tối ưu cảm ứng mobile */}
      {showBackToTop && <BackToTop />}

      {/* 2. Khối Chân trang chính */}
      <footer
        className="w-full text-white shadow-md overflow-hidden relative"
        style={{
          backgroundColor: mainBg,
          borderTop: `2px solid ${accentColor}`,
        }}
      >
        {/* Nút Admin chỉnh sửa nhanh chân trang */}
        {isAdmin && onUpdateSiteConfig && (
          <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 flex justify-end">
            <button
              type="button"
              onClick={() => setIsFooterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-red-950 text-xs font-extrabold rounded-lg shadow-sm transition-all cursor-pointer border border-amber-200 active:scale-95"
              title="Quản trị viên chỉnh sửa toàn bộ nội dung chân trang"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sửa chân trang</span>
            </button>
          </div>
        )}

        {/* 3A. BỐ CỤC MOBILE (< 768px): Xếp dọc 1 cột cân đối, logo và chữ vừa vặn, không cắt xén */}
        <div className="block md:hidden px-4 py-5 space-y-4">
          <div className="flex flex-col items-center text-center">
            {showLogo && (
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2.5">
                <UnitLogo
                  size="md"
                  customSizePx={siteConfig.footerLogoSizePx ? Math.min(siteConfig.footerLogoSizePx, 56) : 48}
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
              className="text-sm sm:text-base font-bold uppercase tracking-wide leading-snug"
              style={{ color: accentColor }}
            >
              {siteConfig.title}
            </h3>

            {siteConfig.subtitle && (
              <p className="text-xs font-semibold uppercase text-white/85 tracking-wider mt-0.5">
                {siteConfig.subtitle}
              </p>
            )}

            {unitName && (
              <p className="text-xs text-yellow-100/90 font-medium mt-0.5">
                {unitName}
              </p>
            )}
          </div>

          {/* Địa bàn đóng quân, Hotline, Email nội bộ trên mobile */}
          <div className="flex flex-col items-center text-center space-y-2 text-xs text-yellow-100/90 leading-relaxed max-w-md mx-auto">
            {showAddress && (address || unitName) && (
              <div className="flex items-center justify-center gap-1.5 px-2">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{address || unitName}</span>
              </div>
            )}

            {showContact && (hotline || email) && (
              <div className="flex flex-col items-center justify-center gap-1.5 w-full">
                {hotline && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Trực ban: <strong className="font-mono text-amber-200 font-bold">{hotline}</strong></span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Email: <strong className="font-mono text-amber-200 font-bold">{email}</strong></span>
                  </div>
                )}
              </div>
            )}

            {copyright && (
              <p className="text-[11px] text-white/60 pt-1 leading-normal">
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

        {/* 3B. BỐ CỤC TABLET & DESKTOP (>= 768px): 3 cột dàn ngang sang trọng, chuyên nghiệp */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 items-center text-left py-5 px-6 lg:px-8 max-w-[1850px] mx-auto">
          {/* Cột 1: Logo và Tên đơn vị / Cơ quan chủ quản */}
          <div className="flex items-center gap-4">
            {showLogo && (
              <div className="shrink-0">
                <UnitLogo
                  size="md"
                  customSizePx={siteConfig.footerLogoSizePx || 52}
                  withGlow={siteConfig.enableLogoGlow !== false}
                  withRotatingBeam={siteConfig.enableLogoBeam !== false}
                  logoType={siteConfig.logoType}
                  customLogoUrl={siteConfig.customLogoUrl}
                  slogan={siteConfig.slogan}
                  establishedDate={siteConfig.establishedDate}
                />
              </div>
            )}
            <div className="space-y-0.5 min-w-0">
              <h3
                className="font-extrabold uppercase text-sm lg:text-base tracking-wider leading-tight"
                style={{ color: accentColor }}
              >
                {siteConfig.title}
              </h3>
              {siteConfig.subtitle && (
                <p className="text-white/80 font-medium text-xs uppercase leading-tight">
                  {siteConfig.subtitle}
                </p>
              )}
              <p className="text-yellow-100/90 font-medium text-xs pt-0.5 leading-snug">
                {unitName}
              </p>
            </div>
          </div>

          {/* Cột 2: Địa bàn đóng quân & Nhiệm vụ / Liên kết */}
          <div className="space-y-2">
            {showAddress && (address || unitName) && (
              <div className="text-xs text-yellow-100/90 leading-relaxed flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>{address || unitName}</span>
              </div>
            )}

            <div className="text-[11px] text-white/75 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
              <span>Hệ thống Thông tin điện tử nội bộ • Sẵn sàng chiến đấu</span>
            </div>

            {showCustomLinks && (
              <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
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

          {/* Cột 3: Hotline trực ban tác chiến, Email liên hệ và bản quyền hệ thống */}
          <div className="space-y-1.5">
            {showContact && (
              <div className="space-y-1 text-xs text-yellow-100/90">
                {hotline && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Trực ban tác chiến: <strong className="font-mono text-amber-200 font-bold">{hotline}</strong></span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Email liên hệ: <strong className="font-mono text-amber-200 font-bold">{email}</strong></span>
                  </div>
                )}
              </div>
            )}

            {copyright && (
              <div className="text-[11px] text-white/60 pt-0.5 leading-normal">
                {copyright}
              </div>
            )}
          </div>
        </div>

        {/* 4. Dải Slogan đáy trang: Responsive hoàn hảo, ngắt dòng mềm mại, đệm an toàn chống che khuất trên mobile */}
        {showSlogan && (
          <div
            className="w-full overflow-hidden px-3 py-2 sm:py-2.5 pb-8 sm:pb-2.5 border-t border-black/25 flex items-center justify-center"
            style={{
              backgroundColor: sloganBg,
              color: accentColor,
            }}
          >
            <div className="max-w-5xl w-full flex items-center justify-center gap-2 sm:gap-3">
              <span className="hidden md:block flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-amber-400/70" />
              <p className="w-full md:w-auto text-[11px] sm:text-xs md:text-sm font-bold tracking-wider uppercase text-center leading-relaxed break-words px-2 m-0 select-text">
                {sloganText}
              </p>
              <span className="hidden md:block flex-1 h-px bg-gradient-to-l from-transparent via-amber-400/30 to-amber-400/70" />
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
