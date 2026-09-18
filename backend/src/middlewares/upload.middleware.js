const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const ApiError = require("../utils/ApiError");
const config = require("../config");

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, "-");
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(config.uploadDir, { recursive: true });
    callback(null, config.uploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const suffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    callback(null, `${sanitizeFileName(baseName)}-${suffix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ApiError(400, "Only PDF, DOCX, and TXT files are supported"));
      return;
    }

    callback(null, true);
  },
});

module.exports = upload;

