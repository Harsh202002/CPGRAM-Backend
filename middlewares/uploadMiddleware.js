const multer = require('multer');

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/pdf')) {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed'), false);
    }
}
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // Limit to 5 files, each max 5MB

module.exports = upload;
