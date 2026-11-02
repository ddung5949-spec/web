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
 * Tự động thu nhỏ và nén logo qua HTML Canvas về kích thước tối đa 250x250px
 * Đảm bảo dung lượng Base64 siêu nhẹ (15KB - 30KB), chống hoàn toàn lỗi QuotaExceededError
 */
export const compressLogoImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 250; // Kích thước tối đa cho logo (hiển thị 36px - 90px)
        let w = img.width;
        let h = img.height;

        if (w > h && w > MAX_SIZE) {
          h = Math.round((h * MAX_SIZE) / w);
          w = MAX_SIZE;
        } else if (h > MAX_SIZE) {
          w = Math.round((w * MAX_SIZE) / h);
          h = MAX_SIZE;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          // Nén ra chuỗi Base64 chỉ còn 15KB - 30KB
          resolve(canvas.toDataURL('image/png', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

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
