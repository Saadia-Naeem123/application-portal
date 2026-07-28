const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads', 'applications');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_UPLOAD = 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_ROOT, req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Allowed: PDF, Word, JPEG, PNG, WEBP.`));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_UPLOAD },
});

// --- Phase 7: "Attachment sharing" on comments ---
// Same allowed types/size limit as application attachments, but a lower
// per-message file count and its own upload subdirectory, keyed by the
// *application* id (the comment doesn't exist yet at upload time — the
// comment row is created afterwards in workflow.service.js#addComment,
// which then links these files to it).
const COMMENT_UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads', 'comments');
const MAX_COMMENT_FILES_PER_UPLOAD = 3;

const commentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(COMMENT_UPLOAD_ROOT, req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const commentUpload = multer({
  storage: commentStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_COMMENT_FILES_PER_UPLOAD },
});

module.exports = {
  upload,
  UPLOAD_ROOT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
  commentUpload,
  COMMENT_UPLOAD_ROOT,
  MAX_COMMENT_FILES_PER_UPLOAD,
};
