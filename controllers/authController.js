const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const sendOTP = require('../utils/SendOTP')
const {getWelcomeEmailTemplate} = require('../utils/emailTemplates');
const {validationResult} = require('express-validator');


const generateToken = (id) => 
    jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '7d',  } );

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();      

// exports.registerUser = async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     const { fullName, gender, phoneNumber, role, address, city, state, district, pincode, email, password } = req.body;

//     try {
//         const userExists = await User.findOne({ email });
//         if (userExists) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);
//         const user = await User.create({
//             fullName,
//             gender,
//             phoneNumber,
//             role,
//             address,
//             city,
//             state,
//             district,
//             pincode,
//             email,
//             password: hashedPassword,
//         });

//         // Send welcome email
//         const subject = "Welcome to CPGRAMS Grievance Redressal System";
//         const html = getWelcomeEmailTemplate(user.fullName);
//         await sendEmail(user.email, subject, html);

//         const token = generateToken(user._id);
//         res.status(201).json({
//             _id: user._id,
//             name: user.fullName,
//             email: user.email,
//             role:user.role,
//             token,
//         });
//     } catch (error) {
//         console.error(error);

//         if (error.code === 11000) {
//             return res.status(400).json({ message: 'Email or phone number already exists' });

//         }

//         res.status(500).json({ message: 'Server error' });
//     }
// }

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
 
  const {
    fullName,
    gender,
    phoneNumber,
    role = "user", // default role
    address,
    city,
    state,
    district,
    pincode,
    email,
    password,
  } = req.body;
 
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
 
    // Role-based registration logic
    const requestedRole = role.toLowerCase();
 
    if (["officer", "lead_officer", "admin"].includes(requestedRole)) {
      // Only allow registration of officer/lead_officer/admin by authorized roles
 
      if (!req.user || !req.user.role) {
        return res.status(403).json({ message: "Not authorized to assign this role" });
      }
 
      const requesterRole = req.user.role.toLowerCase();
 
      if (requestedRole === "officer" && !["admin", "lead_officer"].includes(requesterRole)) {
        return res.status(403).json({ message: "Only Admin or Lead Officer can register an Officer" });
      }
 
      if (requestedRole === "lead_officer" && requesterRole !== "admin") {
        return res.status(403).json({ message: "Only Admin can register a Lead Officer" });
      }
 
      if (requestedRole === "admin") {
        return res.status(403).json({ message: "Cannot register Admin via API" });
      }
    }
 
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
 
    // Create user
    const user = await User.create({
      fullName,
      gender,
      phoneNumber,
      role: requestedRole,
      address,
      city,
      state,
      district,
      pincode,
      email,
      password: hashedPassword,
    });
 
    // Send welcome email
    const subject = "Welcome to CPGRAMS Grievance Redressal System";
    const html = getWelcomeEmailTemplate(user.fullName);
await sendEmail(user.email, subject, html);
 
    // Generate token only if self-registered (user role)
    const token = requestedRole === "user" ? generateToken(user._id) : null;
 
    res.status(201).json({
      _id: user._id,
      name: user.fullName,
email: user.email,
      role: user.role,
      ...(token && { token }),
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration Error:", error);
 
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email or phone number already exists" });
    }
 
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.status(200).json({
            _id: user._id,
            name: user.fullName,
            email: user.email,
            role: user.role,
            user,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

exports.forgotPassword = async (req, res, next) => {

  try {
     const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Find student by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Student not found" });
  }

  // Generate OTP for password reset
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  // Update student with OTP for password reset
  user.resetOtp = otp;
  user.resetOtpExpires = otpExpires;
  await user.save();

  // Send the OTP via email
  await sendOTP(email, otp);

  res.status(200).json({ message: "Password reset OTP sent to email. Please verify." });
  } catch (error) {
    next(error)
  }
};



exports.verifyForgotPasswordOTP = async (req, res, next) => {
 try {
   const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  // Find student by OTP and check if OTP is not expired
  const user = await User.findOne({
    resetOtp: otp,
    resetOtpExpires: { $gt: Date.now() }, // Ensures OTP is not expired
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Clear OTP after successful verification
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  await user.save();

  res.json({ message: "OTP verified successfully. You can now reset your password." });
 } catch (error) {
  next(error)
 }
};


exports.resetPassword = async (req, res, next) => {
 try {
   const { email, newPassword } = req.body;

  if (!email || !newPassword ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  

  // Find student by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Student not found" });
  }

  // ✅ Directly assign new password (pre-save hook will hash it)
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  // Save updated student
  await user.save();

  res.json({ message: "Password reset successful. You can now log in with your new password." });
 } catch (error) {
  next(error)
 }
};
    