const multer = require('multer');

/**
 * Configure multer for memory storage
 * Files are stored in memory as buffers for immediate processing
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for evidence
    cb(null, true);
  },
});

module.exports = upload;
