import React, { useState } from 'react';
import { ArrowUp, ExternalLink, Globe, MapPin, Phone, Mail, Settings, Sliders } from 'lucide-react';
import { PageView, SiteConfig, User } from '../types';
import { UnitLogo } from './UnitLogo';
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = currentUser?.role === 'admin';
  const showBackToTop = siteConfig.footerShowBackToTop !== false;
  const showLogo = siteConfig.footerShowLogo !== false;
  const showAddress = siteConfig.footerShowAddress !== false;
  const showContact = siteConfig.footerShowContact !== false;
  const showSlogan = siteConfig.footerShowSlogan !== false;
  const showCustomLinks = siteConfig.footerShowCustomLinks !== false && (siteConfig.footerCustomLinks || []).length > 0;

  const mainBg = siteConfig.footerBgColor || siteConfig.colorGreen || '#143d2b';
  const sloganBg = siteConfig.footerSloganBgColor || '#0a2318';
  const accentColor = siteConfig.footerAccentColor || '#fbbf24';
  const layout = siteConfig.footerLayout || 'split';

  const customLinks = siteConfig.footerCustomLinks || [
    { id: 'link-1', label: 'Cổng TTĐT Bộ Quốc phòng', url: 'http://mod.gov.vn', openNewTab: true },
    { id: 'link-2', label: 'Báo Quân đội nhân dân', url: 'https://www.qdnd.vn', openNewTab: true },
    { id: 'link-3', label: 'Báo Quân khu 5', url: 'https://baoquankhu5.vn', openNewTab: true },
  ];

  return (
    <div className="w-full select-none relative">
      {/* Nút Lên đầu trang nằm ngoài hẳn chân trang, ở chính giữa với hiệu ứng hover & nhấp chuột */}
      {showBackToTop && (
        <div className="w-full flex justify-center mt-5 mb-3">
          <button
            type="button"
            onClick={scrollToTop}
            id="btn-scroll-to-top"
            className="group flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-[#143d2b] text-[#143d2b] hover:text-[#fbbf24] font-bold text-xs rounded-full border border-gray-300 hover:border-[#fbbf24] shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer"
            title="Cuộn lên đầu trang"
          >
            <span className="p-1 rounded-full bg-emerald-50 group-hover:bg-amber-400/20 text-[#143d2b] group-hover:text-[#fbbf24] transition-colors">
              <ArrowUp className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </span>
            <span className="tracking-wide font-semibold">Lên đầu trang</span>
          </button>
        </div>
      )}

      {/* Khối Chân trang nhỏ gọn, liền mạch */}
      <footer
        className="w-full text-white shadow-md overflow-hidden relative"
        style={{
          backgroundColor: mainBg,
          borderTop: `2px solid ${accentColor}`,
        }}
      >
        {/* Nút Admin chỉnh sửa nhanh chân trang */}
        {isAdmin && onUpdateSiteConfig && (
          <div className="w-full max-w-[1850px] mx-auto px-3 sm:px-5 lg:px-8 pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsFooterModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-red-950 text-[11px] font-extrabold rounded-lg shadow-xs transition-all cursor-pointer border border-amber-200"
              title="Quản trị viên chỉnh sửa toàn bộ nội dung chân trang"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sửa chân trang</span>
            </button>
          </div>
        )}

        {/* Phần thông tin đơn vị phía trên (thu nhỏ chiều cao, bố cục linh hoạt) */}
        <div
          className={`w-full max-w-[1850px] mx-auto px-3 sm:px-5 lg:px-8 py-2.5 ${
            layout === 'centered'
              ? 'flex flex-col items-center justify-center text-center'
              : layout === 'compact'
              ? 'flex flex-col sm:flex-row items-center justify-between text-left gap-2'
              : layout === 'columns'
              ? 'grid grid-cols-1 md:grid-cols-3 gap-4 text-left items-start'
              : 'flex flex-col sm:flex-row items-start sm:items-center justify-between text-left gap-3.5'
          }`}
        >
          {/* Cột / Khối Thông tin chính */}
          <div className="flex items-center gap-3.5">
            {showLogo && (
              <div className="shrink-0">
                <UnitLogo
                  size="sm"
                  customSizePx={siteConfig.footerLogoSizePx || Math.max(28, Math.round((siteConfig.logoSizePx || 48) * 0.75))}
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
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3
                  className="font-extrabold uppercase text-xs sm:text-sm tracking-wider leading-tight"
                  style={{ color: accentColor }}
                >
                  {siteConfig.title}
                </h3>
                <span className="text-white/80 font-medium text-[11px] uppercase hidden sm:inline">
                  • {siteConfig.subtitle}
                </span>
              </div>

              <p className="text-white/85 font-medium text-[10px] sm:text-[11px] uppercase sm:hidden leading-tight">
                {siteConfig.subtitle}
              </p>

              {showAddress && (
                <p className="text-white/75 text-[10px] sm:text-[11px] leading-tight truncate max-w-2xl flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-300/80 shrink-0" />
                  <span>
                    {siteConfig.footerUnitName || 'Trung đoàn 95, Sư đoàn 2'}
                    {siteConfig.footerAddress ? ` • ${siteConfig.footerAddress}` : ''}
                  </span>
                </p>
              )}

              {showContact && (siteConfig.footerHotline || siteConfig.footerEmail) && (
                <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-white/70 pt-0.5">
                  {siteConfig.footerHotline && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-amber-300/80 shrink-0" />
                      <span>Trực ban: <strong className="font-mono text-white/90 font-bold">{siteConfig.footerHotline}</strong></span>
                    </span>
                  )}
                  {siteConfig.footerEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5 text-amber-300/80 shrink-0" />
                      <span>Email: <strong className="font-mono text-white/90 font-bold">{siteConfig.footerEmail}</strong></span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dãy liên kết hữu ích nếu được bật */}
          {showCustomLinks && (
            <div className="flex items-center flex-wrap gap-2 pt-1 sm:pt-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 mr-1 hidden sm:inline">
                Liên kết:
              </span>
              {customLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.openNewTab !== false ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white hover:text-amber-200 text-[10px] font-bold transition-colors inline-flex items-center gap-1 border border-white/15 cursor-pointer"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Dải Slogan ở dưới: chỉ có slogan chữ, bỏ dấu ngoặc kép, không có ngày truyền thống, căn chính giữa, 2 bên có viền kẻ trang trí */}
        {showSlogan && (
          <div
            className="w-full py-1.5 sm:py-2 px-4 border-t border-black/20 flex items-center justify-center"
            style={{
              backgroundColor: sloganBg,
              color: accentColor,
            }}
          >
            <div className="max-w-4xl w-full flex items-center justify-center gap-3">
              <span className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-amber-400/70" />
              <span className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-[2px] text-center whitespace-nowrap px-2">
                {(siteConfig.slogan || 'ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG').replace(/["”"“]/g, '').trim()}
              </span>
              <span className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-400/30 to-amber-400/70" />
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

