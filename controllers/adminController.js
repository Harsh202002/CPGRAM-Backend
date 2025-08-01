const User = require('../models/userModel');
const Grievance = require('../models/grievanceModel');
const jwt = require('jsonwebtoken');
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

exports.createOfficer = async (req, res, next) => {
    try {
        const { fullName, email, 
phoneNumber, gender, dob, password, department } = req.body;
        const existing = await User.findOne({
            email: email,
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Officer already exists",
            });
        }
        const user = await User.create({
            fullName,
            email,
            
            phoneNumber,
            gender,
            dob,
            password,
            department,
            role: "officer",
        });
        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            message: "Officer created successfully",
            user,
            token,
        });
    } catch (error) {
       next(error);
    }
};

exports.promoteOfficer = async (req, res, next) => {
    try {
        const { officerId } = req.params;
        const officer = await User.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: "Officer not found",
            });
        }
        officer.role = "lead_officer";
        await officer.save();
        res.status(200).json({
            success: true,
            message: "Officer promoted to lead officer",
            officer,
        });
    } catch (error) {
        next(error);
    }
}


exports.getAllUsersWithGrievances = async (req, res) => {
  try {
    const users = await User.find({}, 'fullName email phoneNumber'); // Only fetch necessary fields
 
    const usersWithGrievances = await Promise.all(
      users.map(async (user) => {
        const grievances = await Grievance.find({ user: user._id })
          .populate('assignedTo', 'fullName email phoneNumber');
 
        return {
          ...user.toObject(),
          grievances,
        };
      })
    );
 
    res.status(200).json({
      success: true,
      data: usersWithGrievances,
    });
 
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
