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
 * Nén Logo siêu nhẹ ngay khi chọn file qua HTML Canvas (MAX 200x200px, < 25KB)
 * Trả về cả Blob (để upload Supabase Storage) và Base64 (để preview tức thì).
 */
export const resizeLogoToLightBlob = (
  file: File
): Promise<{ blob: Blob; base64: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const renderAtMaxDim = (maxDim: number): Promise<{ blob: Blob; base64: string }> => {
          return new Promise((res, rej) => {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            if (w > h && w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'medium';
              ctx.drawImage(img, 0, 0, w, h);
            }

            const base64 = canvas.toDataURL('image/png', 0.85);
            canvas.toBlob(
              (blob) => {
                if (blob) res({ blob, base64 });
                else rej(new Error('Không thể nén ảnh'));
              },
              'image/png',
              0.85
            );
          });
        };

        renderAtMaxDim(200)
          .then(async (first) => {
            // Đảm bảo dung lượng < 25KB nếu PNG 200x200 vượt ngưỡng
            if (first.blob.size > 25 * 1024) {
              const smaller = await renderAtMaxDim(140);
              if (smaller.blob.size <= 25 * 1024) {
                resolve(smaller);
                return;
              }
              const compact = await renderAtMaxDim(110);
              resolve(compact);
              return;
            }
            resolve(first);
          })
          .catch(reject);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Wrapper tương thích ngược trả về Base64 siêu nhẹ (< 25KB, max 200x200px)
 */
export const compressLogoImage = async (file: File): Promise<string> => {
  const { base64 } = await resizeLogoToLightBlob(file);
  return base64;
};

/**
 * Loại bỏ các chuỗi Base64 ảnh nặng (> 500 ký tự) khỏi JSON `config` trước khi gửi lên PostgreSQL
 * để tránh trùng lặp dữ liệu lớn gây lỗi `canceling statement due to statement timeout`.
 */
export const sanitizeConfigForDbJson = (
  cfg: SiteConfig,
  shortLogoUrl: string
): Record<string, any> => {
  const isHeavyDataUri = (val: unknown) =>
    typeof val === 'string' && val.startsWith('data:') && val.length > 500;

  const cleanLogo = isHeavyDataUri(shortLogoUrl) ? '' : shortLogoUrl || '';
  const cleaned: Record<string, any> = {
    ...cfg,
    logo_url: cleanLogo,
    customLogoUrl: cleanLogo,
  };

  if (Array.isArray(cleaned.dailyWidgets)) {
    cleaned.dailyWidgets = cleaned.dailyWidgets.map((w: any) =>
      w && isHeavyDataUri(w.imageUrl) ? { ...w, imageUrl: '' } : w
    );
  }

  if (Array.isArray(cleaned.uncle_ho_images)) {
    cleaned.uncle_ho_images = cleaned.uncle_ho_images.filter((u: any) => !isHeavyDataUri(u));
  }

  if (cleaned.uncleHoSettings && Array.isArray(cleaned.uncleHoSettings.images)) {
    cleaned.uncleHoSettings = {
      ...cleaned.uncleHoSettings,
      images: cleaned.uncleHoSettings.images.filter((u: any) => !isHeavyDataUri(u)),
    };
  }

  delete cleaned.config;
  delete cleaned.config_json;
  delete cleaned.data;

  return cleaned;
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
