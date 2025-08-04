const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');
const {createOfficer, promoteOfficer,getAllUsersWithGrievances,demoteOfficer,getAllOfficers,getAllLeadOfficers,deleteOfficer} = require('../controllers/adminController')

const router = express.Router();

router.post('/officers', protect, allowRoles('admin','lead_officer'), createOfficer);
router.put('/officers/:officerId/promote', protect, allowRoles('admin'), promoteOfficer);
router.get('/getAllUsersWithGrievances',getAllUsersWithGrievances);
router.put('/demote/:officerId',demoteOfficer);
router.get('/getAllOfficers',getAllOfficers);
router.get('/getAllLeadOfficers',getAllLeadOfficers);
router.delete('/delete/:officerId',deleteOfficer)



module.exports = router;