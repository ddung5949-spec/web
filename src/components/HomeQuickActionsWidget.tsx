import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronRight,
  Edit,
  ExternalLink,
  FolderLock,
  GraduationCap,
  Link as LinkIcon,
  Plus,
  Settings2,
  Shield,
} from 'lucide-react';
import { PageView, QuickActionCard, User } from '../types';

interface HomeQuickActionsWidgetProps {
  cards: QuickActionCard[];
  currentUser: User | null;
  onSelectSection: (section: PageView) => void;
  onOpenQuickActionManager?: () => void;
}

const ICON_MAP = {
  exam: Award,
  doc: FolderLock,
  video: GraduationCap,
  meeting: Shield,
  book: BookOpen,
  award: Award,
  link: LinkIcon,
  custom: LinkIcon,
};

export const HomeQuickActionsWidget: React.FC<HomeQuickActionsWidgetProps> = ({
  cards,
  currentUser,
  onSelectSection,
  onOpenQuickActionManager,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const activeCards = (cards || []).filter((c) => c.enabled !== false);

  const handleClickCard = (card: QuickActionCard) => {
    if (card.type === 'external' && card.externalUrl) {
      const url = card.externalUrl.startsWith('http')
        ? card.externalUrl
        : `https://${card.externalUrl}`;
      if (card.openNewTab !== false) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } else if (card.targetPage) {
      onSelectSection(card.targetPage);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Header with Admin Edit Button */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-3.5 bg-red-700 rounded-full inline-block" />
          <span className="text-[11px] font-black uppercase tracking-wider text-red-950">
            TIỆN ÍCH QUÂN NHÂN
          </span>
        </div>
        {isAdmin && onOpenQuickActionManager && (
          <button
            type="button"
            onClick={onOpenQuickActionManager}
            className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Sửa link điều hướng & nội dung các nút tiện ích"
          >
            <Settings2 className="w-3 h-3 text-amber-800" />
            <span>Sửa tiện ích</span>
          </button>
        )}
      </div>

      {/* Action Cards List */}
      <div className="space-y-2">
        {activeCards.map((card) => {
          const IconComp = ICON_MAP[card.iconName] || Award;
          const paddingClass =
            card.heightSize === 'sm'
              ? 'p-2'
              : card.heightSize === 'lg'
              ? 'p-3.5'
              : 'p-2.5';

          return (
            <div
              key={card.id}
              onClick={() => handleClickCard(card)}
              className={`group ${paddingClass} rounded-xl bg-linear-to-r ${
                card.bgGradient || 'from-red-700 via-red-800 to-rose-900'
              } text-white shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center justify-between border ${
                card.borderColor || 'border-white/20'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <IconComp
                    className={`w-4 h-4 ${card.textColor || 'text-yellow-300'}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-black text-xs uppercase tracking-wide truncate ${
                      card.textColor || 'text-yellow-300'
                    }`}
                  >
                    {card.title}
                  </div>
                  {card.subtitle && (
                    <div className="text-[10px] text-white/80 line-clamp-1 truncate">
                      {card.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1.5">
                {card.type === 'external' ? (
                  <ExternalLink className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
