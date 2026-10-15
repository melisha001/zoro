/**
 * Compresses an image file in the browser before upload:
 * - Resizes so that neither width nor height exceeds maxDimension (default 1920px)
 * - Encodes to image/webp (fallback to image/jpeg if webp not supported)
 * - Initial quality 0.8
 * - If size > maxSizeBytes (~1MB), iteratively lowers quality down to 0.5 to stay under ~1MB
 * - Returns a new File object
 */
export async function compressHeroImage(file, { maxDimension = 1920, quality = 0.8, maxSizeBytes = 1024 * 1024 } = {}) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let mimeType = 'image/webp';
        let currentQuality = quality;

        const getBlob = (q, mime) =>
          new Promise((res) => {
            canvas.toBlob(
              (blob) => {
                if (!blob && mime === 'image/webp') {
                  canvas.toBlob(res, 'image/jpeg', q);
                } else {
                  res(blob);
                }
              },
              mime,
              q
            );
          });

        let blob = await getBlob(currentQuality, mimeType);
        if (!blob) {
          mimeType = 'image/jpeg';
          blob = await getBlob(currentQuality, mimeType);
        }

        // Iteratively reduce quality if still over maxSizeBytes (~1MB)
        while (blob && blob.size > maxSizeBytes && currentQuality > 0.4) {
          currentQuality -= 0.1;
          blob = await getBlob(currentQuality, mimeType);
        }

        if (!blob) {
          resolve(file);
          return;
        }

        const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
        const baseName = (file.name || 'hero-image').replace(/\.[^/.]+$/, '');
        const newFileName = `${baseName}.${ext}`;
        const compressedFile = new File([blob], newFileName, { type: mimeType, lastModified: Date.now() });
        resolve(compressedFile);
      } catch (err) {
        console.warn('Image compression error, falling back to original file:', err);
        resolve(file);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn('Failed to load image for compression:', err);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
