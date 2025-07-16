const express = require("express");
const {
  createUserProfile,
  getAllProfiles,
  getProfileById,
  updateUserProfile,
  deleteUserProfile,
  getProfileByUserId,
} = require("../controllers/userProfileController");
const { profileUploadFields } = require("../middlewares/uploadMiddleware");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", profileUploadFields, createUserProfile);
router.get("/getUser", getProfileByUserId);
router.get("/", protect, getAllProfiles);
router.get("/:id", getProfileById);
router.put("/:id", profileUploadFields, updateUserProfile);
router.delete("/:id", deleteUserProfile);



module.exports = router;
