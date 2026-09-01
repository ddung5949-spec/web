import React from 'react';
import { HomeQuickActionsWidget } from './HomeQuickActionsWidget';
import { PageView, QuickActionCard, User } from '../types';

export interface MilitaryUtilitiesWidgetProps {
  cards?: QuickActionCard[];
  military_utilities?: QuickActionCard[];
  quickActionCards?: QuickActionCard[];
  currentUser: User | null;
  onSelectSection: (section: PageView) => void;
  onOpenQuickActionManager?: () => void;
}

export const MilitaryUtilitiesWidget: React.FC<MilitaryUtilitiesWidgetProps> = ({
  cards,
  military_utilities,
  quickActionCards,
  currentUser,
  onSelectSection,
  onOpenQuickActionManager,
}) => {
  const effectiveCards = cards || military_utilities || quickActionCards || [];
  return (
    <HomeQuickActionsWidget
      cards={effectiveCards}
      currentUser={currentUser}
      onSelectSection={onSelectSection}
      onOpenQuickActionManager={onOpenQuickActionManager}
    />
  );
};

export default MilitaryUtilitiesWidget;
