const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

const upload = multer({ storage });

const profileUploadFields = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "aadhaarCardUrl", maxCount: 1 },
  { name: "voterIdCardUrl", maxCount: 1 },
  { name: "panCardUrl", maxCount: 1 },
  { name: "utilityBillUrl", maxCount: 1 },
  { name: "bankStatementUrl", maxCount: 1 },
]);

module.exports = { upload, profileUploadFields };
