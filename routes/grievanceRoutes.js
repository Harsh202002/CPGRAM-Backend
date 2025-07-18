const express = require('express');
const { createGrievance, getUserGrievances, getGrievancesByUniqueId, updateGrievanceStatus, updateGrievance,addProgressUpdate, trackGrievance, deleteProgressUpdate,deleteLastActivityLog} = require('../controllers/grievanceController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');
// const {body} = require('express-validator');

const router = express.Router();

router.post('/create', protect, upload.array('attachments', 5), createGrievance);
router.get('/my-grievances', protect, getUserGrievances);
router.get('/grievance/:uniqueID', protect, getGrievancesByUniqueId);
router.put('/status/:grievanceId', protect, updateGrievanceStatus);
router.put('/update/:grievanceId', protect, upload.array('attachments', 5), updateGrievance);
router.post('/progress/:grievanceId',protect,addProgressUpdate)
router.post('/track',protect,trackGrievance)
router.delete('/progress-delete/:grievanceId/:progressId',protect,deleteProgressUpdate)
router.delete('/status-delete/:grievanceId',protect,deleteLastActivityLog)

module.exports = router;
