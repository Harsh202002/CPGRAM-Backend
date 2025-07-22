const express = require('express');
const {protect} = require('../middlewares/authMiddleware');
const {allowRoles} = require('../middlewares/roleMiddleware');
const officerController = require('../controllers/officerController');

const router = express.Router();


router.post('/assign', protect, allowRoles('lead_officer'), officerController.assignGrievance);



module.exports = router;