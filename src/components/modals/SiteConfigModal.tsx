import React from 'react';
import { CustomizerModal } from './CustomizerModal';
import { Article, SectionType, SiteConfig } from '../../types';

export interface SiteConfigModalProps {
  isOpen: boolean;
  siteConfig: SiteConfig;
  categories?: any[];
  articles?: Article[];
  onClose: () => void;
  onSave: (
    config: SiteConfig,
    categoryRenames?: { sectionKey: SectionType; oldName: string; newName: string }[]
  ) => void;
  onUpdateSiteConfig?: (updatedConfig: Partial<SiteConfig>) => void;
}

/**
 * SiteConfigModal: Comprehensive Site Configuration Modal for Trung đoàn 95.
 * Contains:
 *  - Tab 1: Logo & Nhận diện (Synchronized Header & Footer Logo, Presets, Realtime Sync)
 *  - Tab 2: Bản tin nội bộ (Chữ chạy)
 *  - Tab 3: Chuyên mục & Tiểu mục
 *  - Tab 4: Menu điều hướng
 *  - Tab 5: Màu sắc chủ đạo & Giao diện
 *  - Tab 6: Kích thước chữ & Font chữ
 *  - Tab 7: Cấu hình Chân trang (Footer)
 *  - Tab 8: Sao lưu & Phục hồi dữ liệu
 */
export const SiteConfigModal: React.FC<SiteConfigModalProps> = (props) => {
  return <CustomizerModal {...props} />;
};

export default SiteConfigModal;
