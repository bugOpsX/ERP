import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp directory exists at backend/uploads/tmp/
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/tmp');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configurable size limit in bytes (default 25MB)
const maxMb = parseInt(process.env.ATTENDANCE_UPLOAD_MAX_MB || '25', 10);
const MAX_FILE_SIZE = maxMb * 1024 * 1024;

// Storage configuration with sanitized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const safeFilename = `upl_${uniqueSuffix}${ext}`;
    cb(null, safeFilename);
  },
});

// File filter for Excel documents
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.xlsx', '.xls'];

  if (!allowedExtensions.includes(ext)) {
    const error = new Error('Unsupported file type. Please upload an Excel file (.xlsx or .xls).');
    error.statusCode = 415;
    error.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Express middleware wrapper to capture Multer errors cleanly.
 */
export const handleAttendanceUpload = (req, res, next) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: `File size exceeds maximum allowed limit of ${maxMb} MB.`,
          code: 'FILE_TOO_LARGE',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message,
        code: 'UPLOAD_ERROR',
      });
    } else if (err) {
      const statusCode = err.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        error: err.message,
        code: err.code || 'BAD_REQUEST',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please attach an Excel file in the "file" field.',
        code: 'MISSING_FILE',
      });
    }

    next();
  });
};

export default handleAttendanceUpload;
