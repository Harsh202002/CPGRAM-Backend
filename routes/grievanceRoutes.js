const express = require('express');
const { createGrievance, getUserGrievances, getGrievancesByUniqueId, updateGrievanceStatus, updateGrievance } = require('../controllers/grievanceController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
// const {body} = require('express-validator');

const router = express.Router();

router.post('/create', protect, upload.array('attachments', 5), createGrievance);
router.get('/my-grievances', protect, getUserGrievances);
router.get('/grievance/:id', protect, getGrievancesByUniqueId);
router.put('/:id/status', protect, updateGrievanceStatus);
router.put('/update/:id', protect, upload.array('attachments', 5), updateGrievance);

module.exports = router;
