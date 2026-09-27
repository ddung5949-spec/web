import React from 'react';
import { NavTabItem, PageView, SiteConfig, User } from '../types';

export interface NavbarProps {
  currentPage?: PageView;
  onSelectPage?: (page: PageView) => void;
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
  currentUser?: User | null;
  pendingDraftsCount?: number;
  onOpenCustomizer?: () => void;
  onOpenCategoryManager?: () => void;
  siteConfig?: SiteConfig;
  categories?: any[];
  armyGreenColor?: string;
  primaryRedColor?: string;
}

// Thanh điều hướng Tabbar đã được gom về 1 hàng duy nhất trực tiếp trong Header.tsx
export const Navbar: React.FC<NavbarProps> = () => null;

export default Navbar;
