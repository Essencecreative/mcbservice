# Image URL Fix for Subdomain Deployment

## Problem
When uploading images through the dashboard, they weren't appearing on the finbank website because the backend was generating URLs using `req.protocol` and `req.get('host')`, which may return incorrect values when behind a reverse proxy (like nginx).

## Solution
Created a centralized image URL utility that uses an environment variable for the base URL, ensuring consistent image URLs across all modules.

## Changes Made

### 1. Created Utility Function (`utils/imageUrl.js`)
- `buildImageUrl(req, uploadPath)` - Builds full image URLs
- `extractFilePath(url, req)` - Extracts relative paths from full URLs (for file deletion)
- Uses `API_BASE_URL` environment variable if set, otherwise falls back to request-based URL

### 2. Updated All Route Files
Updated the following routes to use the new utility:
- `routes/menuItems.js`
- `routes/carousel.js`
- `routes/newsAndUpdates.js`
- `routes/investorNews.js`
- `routes/boardOfDirectors.js`
- `routes/management.js`
- `routes/products.js`
- `routes/user.js`
- `routes/opportunities.js`
- `routes/investorCategories.js`

### 3. Updated Server Configuration (`server.js`)
- Added `app.set('trust proxy', true)` to properly handle reverse proxy headers

## Setup Instructions

### On Your Server

1. **Add Environment Variable**
   
   Add this to your `.env` file:
   ```env
   API_BASE_URL=https://service.mwalimubank.co.tz
   ```

2. **Restart Your Server**
   
   After adding the environment variable, restart your Node.js server (PM2, systemd, etc.)

3. **Verify**
   
   - Upload an image through the dashboard
   - Check the database - the image URL should be: `https://service.mwalimubank.co.tz/uploads/...`
   - Verify the image appears on the finbank website

## How It Works

1. **When uploading**: The utility checks for `API_BASE_URL` environment variable first
2. **If set**: Uses that as the base URL (e.g., `https://service.mwalimubank.co.tz`)
3. **If not set**: Falls back to `req.protocol://req.get('host')` (for local development)
4. **Frontend**: The finbank frontend's `getImageUrl()` function already handles both full URLs and relative paths correctly

## Testing

After setting up:
1. Upload a new image through any module in the dashboard
2. Check the stored URL in the database - it should use your subdomain
3. Verify the image displays correctly on the finbank website

## Notes

- Existing images in the database with old URLs (like `http://localhost:5000/...`) will still work because the frontend's `getImageUrl()` function handles full URLs
- New uploads will use the correct subdomain URL
- The fix works for all modules: carousel, menu items, news, board of directors, management, products, etc.

