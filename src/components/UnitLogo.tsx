import React from 'react';

interface UnitLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  customSizePx?: number;
  className?: string;
  withGlow?: boolean;
  withRotatingBeam?: boolean;
  logoType?: 'official_vector' | 'custom_image';
  customLogoUrl?: string;
  slogan?: string;
  establishedDate?: string;
  onClick?: () => void;
}

export const UnitLogo: React.FC<UnitLogoProps> = ({
  size = 'md',
  customSizePx,
  className = '',
  withGlow = true,
  withRotatingBeam = true,
  logoType = 'official_vector',
  customLogoUrl,
  slogan = 'ĐOÀN KẾT - KIÊN CƯỜNG - THẦN TỐC - TÁO BẠO - QUYẾT THẮNG',
  establishedDate = '23/8/1945',
  onClick,
}) => {
  // Size mapping in Tailwind classes
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
    '2xl': 'w-28 h-28 sm:w-36 sm:h-36',
    hero: 'w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56',
  };

  const isCustomImage = logoType === 'custom_image' && Boolean(customLogoUrl);

  const customStyle: React.CSSProperties = {
    isolation: 'isolate',
    ...(customSizePx ? { width: `${customSizePx}px`, height: `${customSizePx}px` } : {}),
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none ${
        customSizePx ? '' : sizeClasses[size]
      } ${className} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      style={customStyle}
    >
      {/* 1. Ambient Pulsing Glow behind the logo */}
      {withGlow && (
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-red-500 opacity-70 blur-xs animate-pulse pointer-events-none" />
      )}

      {/* 2. Rotating Glowing Light Beam running around the circular border */}
      {withRotatingBeam && (
        <div
          className="absolute -inset-[3px] rounded-full overflow-hidden pointer-events-none"
          style={{
            maskImage: 'radial-gradient(circle, transparent 62%, black 65%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 62%, black 65%)',
          }}
        >
          <div
            className="w-full h-full rounded-full animate-spin"
            style={{
              animationDuration: '3s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              background:
                'conic-gradient(from 0deg, transparent 0deg, transparent 200deg, #f59e0b 260deg, #fbbf24 310deg, #ffffff 345deg, #fef08a 355deg, transparent 360deg)',
            }}
          />
        </div>
      )}

      {/* 3. Secondary fast laser beam spark */}
      {withRotatingBeam && (
        <div
          className="absolute -inset-[2px] rounded-full pointer-events-none"
          style={{
            boxShadow:
              '0 0 10px rgba(251, 191, 36, 0.8), inset 0 0 6px rgba(251, 191, 36, 0.5)',
          }}
        />
      )}

      {/* 4. Display Logo: Either Custom Image or High-Precision Vector SVG */}
      {isCustomImage ? (
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-amber-400 bg-black/40 relative z-10 shadow-inner flex items-center justify-center">
          <img
            src={customLogoUrl}
            alt="Logo Đơn vị"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default if custom image fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full rounded-full relative z-10 drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="ringBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#fffdf0" />
              <stop offset="90%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#fde047" />
            </radialGradient>

            <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="flagRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="60%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>

            <linearGradient id="flagBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="starGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>

            <linearGradient id="akMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="45%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Clip Paths */}
            <clipPath id="innerCircleClip">
              <circle cx="250" cy="250" r="172" />
            </clipPath>

            {/* Text Paths for circular typography */}
            {/* Top Arc for Slogan */}
            <path
              id="topSloganPath"
              d="M 85,250 A 165,165 0 1,1 415,250"
              fill="none"
            />
            {/* Bottom Arc for Date */}
            <path
              id="bottomDatePath"
              d="M 385,250 A 165,165 0 0,1 115,250"
              fill="none"
            />
          </defs>

          {/* Outer Circular Ring Body */}
          <circle cx="250" cy="250" r="244" fill="url(#ringBgGrad)" stroke="#ea580c" strokeWidth="6" />
          <circle cx="250" cy="250" r="236" fill="none" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="250" cy="250" r="178" fill="none" stroke="#d97706" strokeWidth="4" />
          <circle cx="250" cy="250" r="172" fill="none" stroke="#f59e0b" strokeWidth="2" />

          {/* Decorative Laurel Ribbon Flanks */}
          {/* Left Laurel Ribbon */}
          <g stroke="#d97706" strokeWidth="2" fill="#fef08a">
            <path d="M 45,230 Q 30,260 48,290 L 60,285 Q 45,260 58,235 Z" />
            <line x1="38" y1="245" x2="52" y2="242" stroke="#ea580c" strokeWidth="1.5" />
            <line x1="34" y1="260" x2="49" y2="258" stroke="#ea580c" strokeWidth="1.5" />
            <line x1="38" y1="275" x2="54" y2="273" stroke="#ea580c" strokeWidth="1.5" />
          </g>
          {/* Right Laurel Ribbon */}
          <g stroke="#d97706" strokeWidth="2" fill="#fef08a">
            <path d="M 455,230 Q 470,260 452,290 L 440,285 Q 455,260 442,235 Z" />
            <line x1="462" y1="245" x2="448" y2="242" stroke="#ea580c" strokeWidth="1.5" />
            <line x1="466" y1="260" x2="451" y2="258" stroke="#ea580c" strokeWidth="1.5" />
            <line x1="462" y1="275" x2="446" y2="273" stroke="#ea580c" strokeWidth="1.5" />
          </g>

          {/* Slogan Text Along Top Arc */}
          <text
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="0.8"
            style={{
              fontSize: '24px',
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontWeight: '900',
              letterSpacing: '1px',
            }}
          >
            <textPath href="#topSloganPath" startOffset="50%" textAnchor="middle">
              {slogan}
            </textPath>
          </text>

          {/* Founding Date Along Bottom Arc */}
          <text
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="1"
            style={{
              fontSize: '38px',
              fontFamily: '"Arial Black", Impact, sans-serif',
              fontWeight: '900',
              letterSpacing: '2px',
            }}
          >
            <textPath href="#bottomDatePath" startOffset="50%" textAnchor="middle">
              {establishedDate}
            </textPath>
          </text>

          {/* INNER SCENE (Clipped to circle) */}
          <g clipPath="url(#innerCircleClip)">
            {/* Base Red Flag Field */}
            <rect x="70" y="70" width="360" height="360" fill="url(#flagRedGrad)" />

            {/* Cyan Blue Liberation / Sky Swoosh */}
            <path
              d="M 155,240 C 180,180 230,120 330,105 C 380,95 430,120 435,270 C 370,285 270,280 155,240 Z"
              fill="url(#flagBlueGrad)"
            />

            {/* 1. Yellow 5-pointed Gold Star (Top Left) */}
            <g transform="translate(155, 160)">
              <polygon
                points="0,-42 12,-13 42,-13 18,7 26,38 0,20 -26,38 -18,7 -42,-13 -12,-13"
                fill="url(#starGoldGrad)"
                stroke="#ca8a04"
                strokeWidth="2"
              />
            </g>

            {/* 2. Two Hero of the Armed Forces Medals (Top Right on blue field) */}
            {/* Medal 1 */}
            <g transform="translate(288, 142)">
              {/* Ribbon */}
              <rect x="-16" y="-30" width="32" height="14" fill="#dc2626" stroke="#facc15" strokeWidth="2" />
              <line x1="-16" y1="-23" x2="16" y2="-23" stroke="#facc15" strokeWidth="1.5" />
              {/* Medal Star */}
              <polygon
                points="0,-18 5,-6 18,-6 8,2 12,15 0,7 -12,15 -8,2 -18,-6 -5,-6"
                fill="url(#starGoldGrad)"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="0" r="5" fill="#dc2626" stroke="#facc15" strokeWidth="1" />
              <circle cx="0" cy="0" r="2.5" fill="#facc15" />
            </g>

            {/* Medal 2 */}
            <g transform="translate(346, 142)">
              {/* Ribbon */}
              <rect x="-16" y="-30" width="32" height="14" fill="#dc2626" stroke="#facc15" strokeWidth="2" />
              <line x1="-16" y1="-23" x2="16" y2="-23" stroke="#facc15" strokeWidth="1.5" />
              {/* Medal Star */}
              <polygon
                points="0,-18 5,-6 18,-6 8,2 12,15 0,7 -12,15 -8,2 -18,-6 -5,-6"
                fill="url(#starGoldGrad)"
                stroke="#ca8a04"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="0" r="5" fill="#dc2626" stroke="#facc15" strokeWidth="1" />
              <circle cx="0" cy="0" r="2.5" fill="#facc15" />
            </g>

            {/* 3. AK-47 Rifle Silhouette (Center Vertical) */}
            <g transform="translate(250, 240)">
              {/* Barrel & Front Sight pointing upwards */}
              <rect x="-3.5" y="-175" width="7" height="60" fill="url(#akMetalGrad)" />
              {/* Muzzle Brake & Front Sight Post */}
              <rect x="-6" y="-170" width="12" height="6" fill="#0f172a" />
              <line x1="0" y1="-175" x2="0" y2="-164" stroke="#0f172a" strokeWidth="3" />
              {/* Gas Block & Gas Tube */}
              <rect x="-5" y="-138" width="10" height="18" fill="#1e293b" />
              {/* Handguard (Upper & Lower wooden/polymer forearm) */}
              <path
                d="M -7,-120 L 7,-120 L 8,-65 L -8,-65 Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1"
              />
              <line x1="-7" y1="-95" x2="7" y2="-95" stroke="#475569" strokeWidth="1" />

              {/* Rear Sight Base */}
              <rect x="-6" y="-65" width="12" height="12" fill="#0f172a" />

              {/* Receiver / Action body */}
              <path
                d="M -9,-53 L 9,-53 L 10,25 L -10,25 Z"
                fill="url(#akMetalGrad)"
                stroke="#475569"
                strokeWidth="1.5"
              />
              {/* Bolt Carrier / Charging handle */}
              <rect x="6" y="-35" width="5" height="14" rx="2" fill="#64748b" />
              {/* Fire Selector lever */}
              <line x1="-7" y1="-15" x2="7" y2="-10" stroke="#475569" strokeWidth="2" />

              {/* Curved Banana Magazine (30-round mag extending to the right) */}
              <path
                d="M 5,-15 C 35,-10 65,15 85,45 C 80,55 70,58 60,54 C 42,28 20,8 3,0 Z"
                fill="url(#akMetalGrad)"
                stroke="#334155"
                strokeWidth="1.5"
              />
              {/* Mag Ribs */}
              <path d="M 28,5 Q 46,24 64,48" stroke="#475569" strokeWidth="2" fill="none" />

              {/* Trigger Guard & Trigger */}
              <path d="M -2,22 C -8,32 -2,42 5,38" fill="none" stroke="#334155" strokeWidth="2.5" />
              <path d="M 0,25 L 3,33" stroke="#94a3b8" strokeWidth="2" />

              {/* Pistol Grip (Extending down-left) */}
              <path
                d="M -6,25 L -22,60 C -18,66 -10,66 -6,62 L 2,28 Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.5"
              />

              {/* Buttstock (Extending downwards into the gear) */}
              <path
                d="M -8,25 L -14,105 C -10,115 10,115 14,105 L 8,25 Z"
                fill="url(#akMetalGrad)"
                stroke="#334155"
                strokeWidth="1.5"
              />
            </g>

            {/* 4. Golden Industrial Cogwheel Gear (Bottom) */}
            <g transform="translate(250, 395)">
              {/* Cogwheel Teeth */}
              <path
                d="M -115,-30 
                   L -95,-32 L -88,-48 L -70,-46 L -65,-30 L -45,-26 L -35,-42 L -18,-38 L -14,-22 L 14,-22 L 18,-38 L 35,-42 L 45,-26 L 65,-30 L 70,-46 L 88,-48 L 95,-32 L 115,-30
                   L 105,40 L -105,40 Z"
                fill="url(#starGoldGrad)"
                stroke="#b45309"
                strokeWidth="3"
              />
              {/* Gear Face */}
              <circle cx="0" cy="15" r="75" fill="url(#starGoldGrad)" stroke="#ca8a04" strokeWidth="3" />
              {/* Concentric Red Arcs on the Gear */}
              <path d="M -55,10 A 60,60 0 0,1 55,10" fill="none" stroke="#dc2626" strokeWidth="4" />
              <path d="M -42,12 A 45,45 0 0,1 42,12" fill="none" stroke="#dc2626" strokeWidth="3.5" />
              <path d="M -28,14 A 30,30 0 0,1 28,14" fill="none" stroke="#dc2626" strokeWidth="3" />
            </g>
          </g>
        </svg>
      )}
    </div>
  );
};
