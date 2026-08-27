/**
 * Utility functions for client-side image processing, compression, and encoding.
 * Ensures images uploaded from local devices (.png, .jpg, .jpeg, .webp) are
 * compressed to optimal file size for persistent database storage (Firestore / Supabase)
 * while maintaining crisp resolution for retina displays.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Tệp đã chọn không phải là định dạng hình ảnh hợp lệ.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh từ thiết bị.'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return reject(new Error('Không thể đọc dữ liệu hình ảnh.'));
      compressBase64String(dataUrl, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(() => resolve(dataUrl));
    };

    reader.readAsDataURL(file);
  });
}

export async function compressBase64String(
  dataUrl: string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.7
): Promise<string> {
  // If not a base64 data url or already very small (< 40KB), return as is
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 40 * 1024) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(dataUrl); // Fallback to original on error
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
        return resolve(dataUrl);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const webpData = canvas.toDataURL('image/webp', quality);
        if (webpData.startsWith('data:image/webp') && webpData.length < dataUrl.length) {
          return resolve(webpData);
        }
      } catch {
        // Fallback
      }

      try {
        const jpegData = canvas.toDataURL('image/jpeg', quality);
        if (jpegData.length < dataUrl.length) {
          return resolve(jpegData);
        }
      } catch {
        // Fallback
      }

      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Automatically compress all images inside an article (main image and gallery images)
 */
export async function optimizeArticleImagesPayload(article: {
  image?: string;
  images?: Array<{ id: string; url: string; caption?: string; position: any }>;
}): Promise<{
  image: string;
  images?: Array<{ id: string; url: string; caption?: string; position: any }>;
}> {
  let mainImage = article.image || '';
  if (mainImage.startsWith('data:image/')) {
    try {
      mainImage = await compressBase64String(mainImage, 1200, 1200, 0.7);
    } catch (e) {
      console.warn('Main image compression fallback:', e);
    }
  }

  let imagesList = article.images;
  if (imagesList && imagesList.length > 0) {
    imagesList = await Promise.all(
      imagesList.map(async (img) => {
        if (img.url && img.url.startsWith('data:image/')) {
          try {
            const compressed = await compressBase64String(img.url, 1200, 1200, 0.7);
            return { ...img, url: compressed };
          } catch {
            return img;
          }
        }
        return img;
      })
    );
  }

  return {
    image: mainImage,
    images: imagesList,
  };
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
  if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp|gif)$/i)) {
    return {
      valid: false,
      error: 'Vui lòng chọn tệp hình ảnh hợp lệ (.png, .jpg, .jpeg, .webp, .gif).',
    };
  }

  // 25MB maximum file size before compression
  if (file.size > 25 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Dung lượng ảnh gốc không được vượt quá 25MB.',
    };
  }

  return { valid: true };
}
