/**
 * Utility functions for client-side image processing, compression, and encoding.
 * Ensures images uploaded from local devices (.png, .jpg, .jpeg, .webp) are
 * compressed to optimal file size for persistent database storage (Firestore / Supabase)
 * while maintaining crisp resolution for retina displays.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Tệp đã chọn không phải là định dạng hình ảnh hợp lệ.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh từ thiết bị.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể giải mã hình ảnh.'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          return resolve(e.target?.result as string);
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer image/webp for best compression-to-quality ratio, fallback to jpeg
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            return resolve(webpData);
          }
        } catch {
          // Ignore and fallback
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
    return {
      valid: false,
      error: 'Vui lòng chọn tệp hình ảnh hợp lệ (.png, .jpg, .jpeg, .webp).',
    };
  }

  // 15MB maximum file size before compression
  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Dung lượng ảnh gốc không được vượt quá 15MB.',
    };
  }

  return { valid: true };
}
