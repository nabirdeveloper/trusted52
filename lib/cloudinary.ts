import { ImageLoader } from 'next/image';

// Cloudinary loader for Next.js Image component
export const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  // If it's already a Cloudinary URL with transformations, extract base URL
  if (src.includes('cloudinary.com')) {
    // Extract the base URL before any transformations
    const matches = src.match(/(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(v\d+\/[^?]*)/);
    if (matches) {
      const [, baseUrl, versionAndPath] = matches;
      return `${baseUrl}c_limit,w_${width},q_${quality || 75}/f_auto/${versionAndPath}`;
    }
    
    // Fallback: add transformations
    const url = new URL(src);
    const pathParts = url.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex !== -1) {
      pathParts.splice(uploadIndex + 1, 0, `c_limit,w_${width},q_${quality || 75}`, 'f_auto');
      url.pathname = pathParts.join('/');
      return url.toString();
    }
  }
  
  // For non-Cloudinary images, return as-is with basic width/quality
  return `${src}?w=${width}&q=${quality || 75}`;
};

// Helper function to get Cloudinary URL with proper transformations
export const getCloudinaryUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  crop?: 'scale' | 'fill' | 'limit' | 'pad';
} = {}) => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width = 400,
    height = 400,
    quality = 75,
    crop = 'limit'
  } = options;

  // Extract the base URL before any transformations
  const matches = url.match(/(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(v\d+\/[^?]*)/);
  if (matches) {
    const [, baseUrl, versionAndPath] = matches;
    return `${baseUrl}c_${crop},w_${width},h_${height},q_${quality}/f_auto/${versionAndPath}`;
  }

  return url;
};