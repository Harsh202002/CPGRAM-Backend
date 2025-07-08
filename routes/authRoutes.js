const express = require('express');
const {registerUser, loginUser} = require('../controllers/authController');
const{body} = require('express-validator');
const router = express.Router();

router.post('/register',  registerUser);

router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], loginUser);


module.exports = router