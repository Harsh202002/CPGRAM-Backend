const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');
const {createOfficer, promoteOfficer,getAllUsersWithGrievances} = require('../controllers/adminController')

const router = express.Router();

router.post('/officers', protect, allowRoles('admin','lead_officer'), createOfficer);
router.put('/officers/:officerId/promote', protect, allowRoles('admin'), promoteOfficer);
router.get('/getAllUsersWithGrievances',getAllUsersWithGrievances)


module.exports = router;