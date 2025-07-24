const express = require("express");
const {
  createGrievance,
  getUserGrievances,
  getGrievancesByUniqueId,
  updateGrievanceStatus,
  updateGrievance,
  addProgressUpdate,
  getActivityLog,
  trackGrievance,
  deleteProgressUpdate,
  deleteLastActivityLog,
  getGrievancesAssignedToOfficer,
  getAllGrievances,
} = require("../controllers/grievanceController");
const { protect } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");
// const {body} = require('express-validator');

const router = express.Router();

router.post(
  "/create",
  protect,
  upload.array("attachments", 5),
  createGrievance
);
router.get("/my-grievances", protect, getUserGrievances);
router.get("/grievance/:uniqueID", protect, getGrievancesByUniqueId);
router.get("/assigned", protect, getGrievancesAssignedToOfficer);
router.put("/status/:grievanceId", protect, updateGrievanceStatus);
router.put(
  "/update/:grievanceId",
  protect,
  upload.array("attachments", 5),
  updateGrievance
);
router.post("/progress/:grievanceId", protect, addProgressUpdate);
router.get("/grievance/:id", protect, getActivityLog);
router.post("/track", protect, trackGrievance);
router.delete(
  "/progress-delete/:grievanceId/:progressId",
  protect,
  deleteProgressUpdate
);
router.delete("/status-delete/:grievanceId", protect, deleteLastActivityLog);
router.get("/getallgrv", protect, getAllGrievances);
module.exports = router;
