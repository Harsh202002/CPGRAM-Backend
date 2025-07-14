const express = require("express");
const {
  createUserProfile,
  getAllProfiles,
  getProfileById,
  updateUserProfile,
  deleteUserProfile,
} = require("../controllers/userProfileController");
const { profileUploadFields } = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.post("/", profileUploadFields, createUserProfile);
router.get("/", getAllProfiles);
router.get("/:id", getProfileById);
router.put('/:id', profileUploadFields, updateUserProfile);
router.delete("/:id", deleteUserProfile);

module.exports = router;
