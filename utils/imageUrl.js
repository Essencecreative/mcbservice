/**
 * Utility function to build full image URLs
 * Uses environment variable API_BASE_URL if set, otherwise falls back to req protocol/host
 */
const getBaseUrl = (req) => {
  // Use environment variable if set (for production with subdomain)
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // Fallback to request-based URL (for development)
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}`;
};

/**
 * Build image URL for a given upload path
 * @param {Object} req - Express request object
 * @param {string} uploadPath - Relative path like 'uploads/menu-items/filename.jpg'
 * @returns {string} Full URL to the image
 */
const buildImageUrl = (req, uploadPath) => {
  if (!uploadPath) return '';
  
  // If already a full URL, return as-is
  if (uploadPath.startsWith('http://') || uploadPath.startsWith('https://')) {
    return uploadPath;
  }
  
  // Ensure path starts with /
  const normalizedPath = uploadPath.startsWith('/') ? uploadPath : `/${uploadPath}`;
  
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Extract relative file path from a full URL
 * Handles both environment variable URLs and request-based URLs
 * @param {string} url - Full URL like 'https://service.mwalimubank.co.tz/uploads/file.jpg'
 * @param {Object} req - Express request object (optional, for fallback)
 * @returns {string} Relative path like 'uploads/file.jpg'
 */
const extractFilePath = (url, req) => {
  if (!url) return '';
  
  // If it's already a relative path, return as-is
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }
  
  // Extract path from URL
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    return urlObj.pathname.substring(1);
  } catch (e) {
    // Fallback: try to extract using base URL
    const baseUrl = getBaseUrl(req);
    if (url.startsWith(baseUrl)) {
      return url.substring(baseUrl.length + 1); // +1 to skip the leading /
    }
    // Last resort: try to remove common patterns
    return url.replace(/^https?:\/\/[^\/]+/, '').substring(1);
  }
};

module.exports = { buildImageUrl, getBaseUrl, extractFilePath };

