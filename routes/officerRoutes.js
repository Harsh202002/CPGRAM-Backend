const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");
const officerController = require("../controllers/officerController");

const router = express.Router();

router.post(
  "/assign",
  protect,
  allowRoles("lead_officer"),
  officerController.assignGrievance
);
router.get(
  "/grievance/:id",
  protect,
  allowRoles("lead_officer", "officer"),
  officerController.getGrievanceById
);
router.put(
  "/unassign/:id",
  protect,
  allowRoles("lead_officer"),
  officerController.unassignGrievance
);

router.get(
  "/assigned-grv",
  protect,
  allowRoles("lead_officer", "officer"),
  officerController.getAllAssignedGrievances
);
router.get(
  "/all-officers",
  protect,
  allowRoles("lead_officer", "officer"),
  officerController.getAllOfficer
);

module.exports = router;
