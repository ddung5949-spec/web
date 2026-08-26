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
  const mode = siteConfig?.tickerMode || 'combined';
  const customDays = siteConfig?.tickerDays ?? 3;
  const customList = siteConfig?.tickerCustomList || [];
  const speed = siteConfig?.tickerSpeed || 'normal';
  const prefix = siteConfig?.tickerPrefix || 'Bản tin nội bộ';

  // Compute ticker items based on configured mode
  const tickerItems = useMemo<TickerItem[]>(() => {
    const approvedArticles = articles.filter((a) => a.status === 'approved');
    const items: TickerItem[] = [];

    // 1. Manual announcements from custom list or legacy tickerText
    const manualAnnouncements: string[] =
      customList.length > 0
        ? customList.filter((s) => s.trim().length > 0)
        : tickerText
        ? [tickerText]
        : ['Chào mừng các đồng chí đến với Trang Thông tin Sư đoàn 10 - Đoàn Mang Yang anh hùng!'];

    if (mode === 'manual') {
      manualAnnouncements.forEach((ann, idx) => {
        items.push({
          id: `ann-${idx}`,
          type: 'announcement',
          text: ann,
          tag: 'THÔNG BÁO',
        });
      });
      return items;
    }

    if (mode === 'auto_today') {
      const todayArticles = approvedArticles.filter((art) => {
        const d = parseArticleDate(art.date);
        return d ? isToday(d) : false;
      });

      if (todayArticles.length > 0) {
        todayArticles.forEach((art) => {
          items.push({
            id: `today-${art.id}`,
            type: 'article',
            text: art.title,
            tag: 'HÔM NAY',
            article: art,
          });
        });
      } else {
        // Fallback if no new articles today
        items.push({
          id: 'today-none',
          type: 'announcement',
          text: 'Hôm nay chưa có bài đăng mới. Toàn đơn vị duy trì nghiêm các chế độ học tập, rèn luyện và SSCĐ.',
          tag: 'HÔM NAY',
        });
        // Include default announcements
        manualAnnouncements.slice(0, 2).forEach((ann, idx) => {
          items.push({
            id: `ann-fallback-${idx}`,
            type: 'announcement',
            text: ann,
            tag: 'THÔNG BÁO',
          });
        });
      }
      return items;
    }

    if (mode === 'auto_days') {
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
        items.push({
          id: 'recent-none',
          type: 'announcement',
          text: `Chưa có bài viết mới trong ${customDays} ngày qua. Đang hiển thị bản tin tuyên huấn Sư đoàn.`,
          tag: 'TIN MỚI',
        });
        manualAnnouncements.forEach((ann, idx) => {
          items.push({
            id: `ann-recent-fallback-${idx}`,
            type: 'announcement',
            text: ann,
            tag: 'THÔNG BÁO',
          });
        });
      }
      return items;
    }

    // Default: 'combined' mode (Manual Announcements + Recent Articles)
    manualAnnouncements.forEach((ann, idx) => {
      items.push({
        id: `comb-ann-${idx}`,
        type: 'announcement',
        text: ann,
        tag: 'THÔNG BÁO',
      });
    });

    const recentForCombined = approvedArticles.slice(0, 5);
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
  }, [articles, mode, customDays, customList, tickerText]);

  // Speed duration mapping
  const animationDuration = speed === 'slow' ? '45s' : speed === 'fast' ? '18s' : '28s';

  return (
    <div className="bg-white border-b border-gray-200 py-1.5 shadow-xs select-none relative z-30">
      <div className="w-full px-3 sm:px-6 lg:px-8 flex items-center overflow-hidden">
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

        {/* Scrolling Marquee Stream */}
        <div className="overflow-hidden whitespace-nowrap w-full text-xs md:text-sm text-gray-800 font-medium py-0.5 relative group">
          <div
            className="inline-block animate-marquee group-hover:[animation-play-state:paused] transition-colors"
            style={{ animationDuration }}
          >
            <div className="inline-flex items-center gap-6">
              {tickerItems.map((item, index) => (
                <React.Fragment key={item.id}>
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
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
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

                  {index < tickerItems.length - 1 && (
                    <span className="text-amber-500 font-black text-xs select-none">★</span>
                  )}
                </React.Fragment>
              ))}

              {/* Repeat separator at end */}
              <span className="text-amber-500 font-black text-xs select-none">★</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
