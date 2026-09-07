import React from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
  onClick?: () => void;
  className?: string;
}

export const BackToTop: React.FC<BackToTopProps> = ({ onClick, className = '' }) => {
  const handleScrollToTop = () => {
    if (onClick) {
      onClick();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <button
        type="button"
        onClick={handleScrollToTop}
        id="btn-scroll-to-top"
        className="group min-h-[44px] flex items-center justify-center gap-2.5 px-5 py-2 sm:py-2.5 bg-white hover:bg-[#143d2b] text-[#143d2b] hover:text-[#fbbf24] font-bold text-xs sm:text-sm rounded-full border border-gray-300 hover:border-[#fbbf24] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer touch-manipulation"
        title="Cuộn lên đầu trang"
        aria-label="Cuộn lên đầu trang"
      >
        <span className="p-1.5 rounded-full bg-emerald-50 group-hover:bg-amber-400/20 text-[#143d2b] group-hover:text-[#fbbf24] transition-colors shrink-0">
          <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </span>
        <span className="tracking-wide font-semibold select-none">Lên đầu trang</span>
      </button>
    </div>
  );
};
