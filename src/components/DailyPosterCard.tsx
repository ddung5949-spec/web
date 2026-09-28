import React from 'react';
import { Maximize2, ShieldAlert, Car, HeartHandshake, Edit3, Image as ImageIcon } from 'lucide-react';
import { DailyWidgetItem, User } from '../types';

export interface DailyPosterCardProps {
  poster: {
    id: string;
    title: string;
    category_name?: string;
    image_url?: string;
    image_data?: string;
    aspect_ratio?: string;
    updated_at?: string;
  };
  isAdmin?: boolean;
  onEdit?: () => void;
  onZoom?: () => void;
  aspectRatioClass?: string;
}

export const DailyPosterCard: React.FC<DailyPosterCardProps> = ({
  poster,
  isAdmin = false,
  onEdit,
  onZoom,
  aspectRatioClass,
}) => {
  const rawUrl = poster.image_url || poster.image_data || '';
  const timestamp = poster.updated_at ? new Date(poster.updated_at).getTime() : Date.now();
  
  // URL chống cache: nếu là URL http/https thì gắn ?t=timestamp
  const antiCacheUrl = rawUrl
    ? rawUrl.startsWith('data:')
      ? rawUrl
      : `${rawUrl.split('?')[0]}?t=${timestamp}`
    : '';

  const getAspectClass = () => {
    if (aspectRatioClass) return aspectRatioClass;
    switch (poster.aspect_ratio) {
      case 'portrait':
        return 'aspect-[3/4] object-cover';
      case 'landscape':
        return 'aspect-video object-cover';
      case 'auto':
      default:
        return 'w-full h-auto max-h-[550px] object-contain';
    }
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-slate-900/5 border border-gray-200/80 shadow-2xs group flex items-center justify-center">
      {antiCacheUrl ? (
        <div
          onClick={onZoom}
          className="relative w-full h-full cursor-zoom-in flex items-center justify-center overflow-hidden"
          title="Bấm để phóng to xem trọn vẹn poster"
        >
          <img
            key={poster.updated_at || antiCacheUrl}
            src={antiCacheUrl}
            alt={poster.title || poster.category_name || 'Poster hàng ngày'}
            className={`w-full transition-transform duration-300 group-hover:scale-[1.02] ${getAspectClass()}`}
            loading="eager"
            decoding="async"
          />

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none backdrop-blur-[1px]">
            <Maximize2 className="w-4 h-4 text-amber-300" />
            <span>Phóng to</span>
          </div>
        </div>
      ) : (
        <div
          onClick={isAdmin ? onEdit : undefined}
          className={`w-full py-10 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 gap-2 bg-white ${
            isAdmin ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/40' : ''
          }`}
        >
          <ImageIcon className="w-8 h-8 text-gray-300" />
          <span className="text-xs font-medium">Chưa có ảnh poster</span>
          {isAdmin && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Bấm để tải ảnh lên
            </span>
          )}
        </div>
      )}
    </div>
  );
};
