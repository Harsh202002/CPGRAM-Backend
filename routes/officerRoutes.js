const express = require('express');
const {protect} = require('../middlewares/authMiddleware');
const {allowRoles} = require('../middlewares/roleMiddleware');
const officerController = require('../controllers/officerController');

const router = express.Router();

router.get('/grievances/:uniqueId',  officerController.getGrievanceByToken);
router.post('/assign', protect, allowRoles('lead_officer','officer'), officerController.assignGrievance);
router.put('/status/:grievanceId', protect, allowRoles('Officer', 'lead_officer'), officerController.updateStatus);
router.put('/escalate/:grievanceId', protect, allowRoles('Officer'), officerController.escalateGrievance);
router.put('/close/:grievanceId', protect, allowRoles('Officer'), officerController.closeGrievance);
// router.get('/grievances', protect, allowRoles('Officer'), officerController.getAllGrievances);
router.get('/progress-message/:grievanceId', protect, allowRoles('lead_officer','Officer'), officerController.addProgressMessage);


module.exports = router;