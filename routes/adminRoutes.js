const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');
const {createOfficer, promoteOfficer} = require('../controllers/adminController')

const router = express.Router();

router.post('/officers', protect, allowRoles('admin'), createOfficer);
router.put('/officers/:officerId/promote', protect, allowRoles('admin'), promoteOfficer);


module.exports = router;