/**
 * Generates a dynamic canvas-watermarked data URL for client-side previews
 */
export async function generateWatermarkedPreview(
  imageUrl: string,
  watermarkText: string = 'LENS & CANVAS • PREVIEW ONLY',
  opacity: number = 0.35
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin for external URLs to prevent CORS errors on data URIs
    if (!imageUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.src = imageUrl;

    img.onerror = () => {
      console.warn('Failed to load image for watermarking. Falling back to original.');
      resolve(imageUrl); // Fallback to original image if it cannot be loaded
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 1200;
      canvas.height = img.naturalHeight || img.height || 800;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // Draw original base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Save context
      ctx.save();

      // Configure watermark style
      const fontSize = Math.max(24, Math.floor(canvas.width / 24));
      ctx.font = `800 ${fontSize}px sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.8})`;
      ctx.lineWidth = Math.max(1, fontSize / 20);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Rotate canvas for diagonal text tiling
      const angle = -Math.PI / 6; // -30 degrees
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);

      // Grid tiling
      const stepX = fontSize * 12;
      const stepY = fontSize * 4;
      const extent = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);

      for (let x = -extent; x <= extent; x += stepX) {
        for (let y = -extent; y <= extent; y += stepY) {
          ctx.strokeText(watermarkText, x, y);
          ctx.fillText(watermarkText, x, y);
        }
      }

      ctx.restore();

      // Export low-compression JPEG watermarked preview
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = (err) => {
      console.warn('Watermark canvas generation failed, falling back to original URL', err);
      resolve(imageUrl);
    };
  });
}
