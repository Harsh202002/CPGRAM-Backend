const express = require('express');
const {
  createUserProfile,
  getAllProfiles,
  getProfileById,
  updateUserProfile,
  deleteUserProfile,
} = require('../controllers/userProfileController');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/', upload.single('profileImage'), createUserProfile);
router.get('/', getAllProfiles);
router.get('/:id', getProfileById);
router.put('/:id', updateUserProfile);
router.delete('/:id', deleteUserProfile);

module.exports = router;
