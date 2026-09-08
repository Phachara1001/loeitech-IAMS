import multer from 'multer';

// Use memory storage to temporarily hold the file in RAM before uploading to MinIO
const storage = multer.memoryStorage();

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น (Image files only)'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Limit
  },
  fileFilter,
});
