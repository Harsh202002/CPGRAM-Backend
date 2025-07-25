const express = require('express');
const {registerUser, loginUser, forgotPassword,verifyForgotPasswordOTP,resetPassword } = require('../controllers/authController');
const{body} = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware');
const router = express.Router();

router.post('/register',  registerUser);
router.post('/admin/register', protect, allowRoles('admin'), registerUser);

router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], loginUser);

router.post('/forgot-password',  forgotPassword);
router.post('/verify-forgot-password',verifyForgotPasswordOTP);
router.post('/reset-password',resetPassword);



module.exports = router