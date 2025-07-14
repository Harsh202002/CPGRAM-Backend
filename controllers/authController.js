const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const {getWelcomeEmailTemplate} = require('../utils/emailTemplates');
const {validationResult} = require('express-validator');


const generateToken = (id) => 
    jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '7d',  } );

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
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}
