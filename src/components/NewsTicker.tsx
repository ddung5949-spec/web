import React, { useMemo } from 'react';
import { Megaphone, Sparkles, Clock, Newspaper, ArrowRight } from 'lucide-react';
import { Article, SiteConfig } from '../types';

interface NewsTickerProps {
  siteConfig?: SiteConfig;
  tickerText?: string;
  articles?: Article[];
  primaryRedColor?: string;
  onOpenArticle?: (article: Article) => void;
  onTickerClick?: () => void;
}

interface TickerItem {
  id: string;
  type: 'announcement' | 'article';
  text: string;
  tag?: string;
  article?: Article;
}

/**
 * Utility to parse various date formats safely
 */
function parseArticleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    return new Date(year, month, day, hour, min);
  }

  // Standard ISO or YYYY-MM-DD
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  siteConfig,
  tickerText,
  articles = [],
  primaryRedColor = '#b91c1c',
  onOpenArticle,
  onTickerClick,
}) => {
  const rawMode = siteConfig?.marquee_mode || siteConfig?.tickerMode || 'combined';
  const mode =
    rawMode === 'today' || rawMode === 'auto_today'
      ? 'today'
      : rawMode === 'recent_days' || rawMode === 'auto_days'
      ? 'recent_days'
      : rawMode === 'manual'
      ? 'manual'
      : 'combined';

  const customDays = Number(siteConfig?.marquee_days ?? siteConfig?.tickerDays ?? 3);
  const announcementsList =
    siteConfig?.announcements && siteConfig.announcements.length > 0
      ? siteConfig.announcements
      : siteConfig?.tickerCustomList && siteConfig.tickerCustomList.length > 0
      ? siteConfig.tickerCustomList
      : tickerText
      ? [tickerText]
      : [
          'Chào mừng kỷ niệm ngày truyền thống Trung đoàn 95, Sư đoàn 2 anh hùng!',
          'Toàn đơn vị duy trì nghiêm chế độ trực ban, trực chỉ huy, sẵn sàng chiến đấu cao.',
          'Đẩy mạnh phong trào thi đua Quyết thắng và học tập làm theo tư tưởng, đạo đức Hồ Chí Minh.',
        ];

  const speed = siteConfig?.marquee_speed || siteConfig?.tickerSpeed || 'normal';
  const prefix = siteConfig?.tickerPrefix || 'Bản tin nội bộ';

  // Compute ticker items based on configured mode
  const tickerItems = useMemo<TickerItem[]>(() => {
    const approvedArticles = articles.filter(
      (a) => !a.status || a.status === 'approved' || a.status !== 'pending'
    );
    const items: TickerItem[] = [];

    const cleanAnnouncements = announcementsList
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0);

    const fallbackAnnouncements =
      cleanAnnouncements.length > 0
        ? cleanAnnouncements
        : ['Chào mừng các đồng chí đến với Cổng Thông tin Điện tử Trung đoàn 95, Sư đoàn 2 anh hùng!'];

    // 1. Chế độ THỦ CÔNG ("manual"): Chỉ chạy danh sách thông báo thủ công
    if (mode === 'manual') {
      fallbackAnnouncements.forEach((ann, idx) => {
        items.push({
          id: `manual-ann-${idx}`,
          type: 'announcement',
          text: ann,
          tag: 'THÔNG BÁO',
        });
      });
      return items;
    }

    // 2. Chế độ HÔM NAY ("today" / "auto_today"): Lấy bài viết hôm nay; nếu không có bài, TỰ ĐỘNG chuyển sang thông báo nội bộ
    if (mode === 'today') {
      const todayArticles最佳 = approvedArticles.filter((art) => {
        const d最佳 = parseArticleDate(art.date);
        return d最佳 ? isToday(d最佳) : false;
      });

      if (todayArticles最佳.length > 0) {
        todayArticles最佳.forEach((art) => {
          items.push({
            id: `today-${art.id}`,
            type: 'article',
            text: art.title,
            tag: 'HÔM NAY',
            article: art,
          });
        });
      } else {
        // Fallback tự động sang danh sách thông báo nội bộ (TUYỆT ĐỐI KHÔNG để trống)
        fallbackAnnouncements.forEach((ann, idx) => {
          items.push({
            id: `today-fallback-ann-${idx}`,
            type: 'announcement',
            text: ann,
            tag: 'THÔNG BÁO',
          });
        });
      }
      return items;
    }

    // 3. Chế độ BÀI ĐĂNG TRONG X NGÀY ("recent_days" / "auto_days"): Lọc bài viết trong X ngày qua; nếu không có bài, tự động fallback
    if (mode === 'recent_days') {
      const recentArticles = approvedArticles.filter((art) => {
        const d = parseArticleDate(art.date);
        return d ? isWithinDays(d, customDays) : false;
      });

      if (recentArticles.length > 0) {
        recentArticles.forEach((art) => {
          items.push({
            id: `recent-${art.id}`,
            type: 'article',
            text: `${art.title} (${art.date || 'Mới'})`,
            tag: `${customDays} NGÀY QUA`,
            article: art,
          });
        });
      } else {
        // Fallback tự động sang thông báo nội bộ
        fallbackAnnouncements.forEach((ann, idx) => {
          items.push({
            id: `recent-fallback-ann-${idx}`,
            type: 'announcement',
            text: ann,
            tag: 'THÔNG BÁO',
          });
        });
      }
      return items;
    }

    // 4. Chế độ KẾT HỢP ("combined"): Gộp danh sách thông báo thủ công + Tiêu đề bài viết mới xuất bản
    fallbackAnnouncements.forEach((ann, idx) => {
      items.push({
        id: `comb-ann-${idx}`,
        type: 'announcement',
        text: ann,
        tag: 'THÔNG BÁO',
      });
    });

    const recentForCombined = approvedArticles.slice(0, 6);
    recentForCombined.forEach((art) => {
      items.push({
        id: `comb-art-${art.id}`,
        type: 'article',
        text: art.title,
        tag: 'BÀI MỚI',
        article: art,
      });
    });

    return items;
  }, [articles, mode, customDays, announcementsList]);

  // Dynamic animationDuration calculation according to exact formula:
  // animationDuration = Math.max(20, Math.floor(textLength * 0.25) * speedFactor)
  const textLength = useMemo(() => {
    return tickerItems.reduce((acc, it) => acc + (it.text?.length || 0), 0);
  }, [tickerItems]);

  const speedFactor = speed === 'slow' ? 1.4 : speed === 'fast' ? 0.7 : 1.0;
  const calculatedSeconds = Math.max(20, Math.floor(textLength * 0.25) * speedFactor);
  const animationDuration = `${calculatedSeconds}s`;

  const [isTouchPaused, setIsTouchPaused] = React.useState(false);

  // Render a single sequence of items
  const renderTickerList = (keyPrefix: string) => (
    <div className="inline-flex items-center gap-6 pr-8">
      {tickerItems.map((item, index) => (
        <React.Fragment key={`${keyPrefix}-${item.id}`}>
          <div
            onClick={() => {
              if (item.article && onOpenArticle) {
                onOpenArticle(item.article);
              } else if (onTickerClick) {
                onTickerClick();
              }
            }}
            className={`inline-flex items-center gap-1.5 cursor-pointer transition-all ${
              item.type === 'article'
                ? 'hover:text-red-700 hover:underline'
                : 'hover:text-emerald-800'
            }`}
          >
            {item.tag && (
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-2xs ${
                  item.type === 'article'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {item.tag}
              </span>
            )}

            <span className="font-semibold text-gray-800 hover:text-red-700">
              {item.text}
            </span>

            {item.type === 'article' && (
              <ArrowRight className="w-3 h-3 text-red-600 opacity-75 inline shrink-0" />
            )}
          </div>

          <span className="text-amber-500 font-black text-xs select-none">★</span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="bg-white border-b border-gray-200 py-1.5 shadow-xs select-none relative z-30">
      <div className="w-full max-w-[1850px] mx-auto px-3 sm:px-5 lg:px-8 flex items-center overflow-hidden">
        {/* Left Badge Indicator */}
        <div
          onClick={onTickerClick}
          className="text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-sm flex items-center gap-1.5 shrink-0 mr-3 shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
          style={{ backgroundColor: primaryRedColor }}
          title="Nhấn để xem trang chủ"
        >
          <Megaphone className="w-3.5 h-3.5 animate-bounce" />
          <span className="tracking-wide font-black">{prefix}</span>
        </div>

        {/* Scrolling Marquee Stream Container */}
        <div
          onTouchStart={() => setIsTouchPaused(true)}
          onTouchEnd={() => setIsTouchPaused(false)}
          className="marquee-container overflow-hidden whitespace-nowrap w-full text-xs md:text-sm text-gray-800 font-medium py-0.5 relative group flex items-center"
        >
          <div
            className={`inline-flex items-center animate-marquee transition-colors ${
              isTouchPaused ? 'marquee-paused' : ''
            }`}
            style={{
              animationDuration,
              animationTimingFunction: 'linear',
              paddingLeft: '1rem',
              paddingRight: '3rem',
            }}
          >
            {/* Primary Track */}
            {renderTickerList('track-1')}
            {/* Duplicated Track for 100% Seamless Looping */}
            {renderTickerList('track-2')}
          </div>
        </div>
      </div>
    </div>
  );
};
