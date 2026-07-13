const multer = require('multer');
const path = require('path');

// Multer config for generic file uploads (memory storage, then we upload to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // accept image files only (case-insensitive extension check or mimetype)
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg|webp|heic)$/i) && !file.mimetype.startsWith('image/')) {
    return cb(new Error(`Only image files are allowed! Received: ${file.originalname}`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

module.exports = upload;
