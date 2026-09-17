/**
 * Image Optimizer Utility for Low-Bandwidth Networks
 * Resizes and compresses images on-device before uploading.
 * Reduces 5MB-10MB raw photos to ~80KB-180KB JPEG files.
 */
let ImageManipulator;
try {
  ImageManipulator = require('expo-image-manipulator');
} catch (e) {
  ImageManipulator = null;
}

/**
 * Optimizes an image URI for fast upload over slow 2G/3G/4G connections.
 * @param {string} uri - Local file URI from ImagePicker or camera
 * @param {object} options - Optional compression settings
 * @returns {Promise<{uri: string, width: number, height: number}>}
 */
export const optimizeImageForUpload = async (uri, options = {}) => {
  if (!uri || typeof uri !== 'string') return { uri };

  // Skip remote URLs or non-image files
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.endsWith('.pdf')) {
    return { uri };
  }

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.65, // Sweet spot for verification & photos (crisp, yet under 150KB)
    format = 'jpeg'
  } = options;

  try {
    if (ImageManipulator?.manipulateAsync) {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
            },
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat?.JPEG || 'jpeg',
        }
      );

      if (__DEV__) {
        console.log(`[ImageOptimizer] Optimized ${uri.slice(-20)} -> ${result.uri.slice(-20)} (${result.width}x${result.height})`);
      }

      return result;
    }
  } catch (error) {
    console.warn('[ImageOptimizer] Device compression skipped, using original:', error.message);
  }

  return { uri };
};

export default optimizeImageForUpload;
