const User = require('../models/userModel');
const Grievance = require('../models/grievanceModel');
const jwt = require('jsonwebtoken');
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

exports.createOfficer = async (req, res, next) => {
    try {
        const { fullName, email, phoneNumber, gender, dob, password, department } = req.body;

        console.log("Create Officer Request:", req.body);

        // Normalize email for consistent checking
        const normalizedEmail = email.trim().toLowerCase();

        // Check if email already exists
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Officer with this email already exists",
            });
        }

        // Check if phone number already exists
        const existingPhone = await User.findOne({ phoneNumber: phoneNumber.trim() });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "Officer with this phone number already exists",
            });
        }

        // Create the officer
        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            phoneNumber: phoneNumber.trim(),
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
        console.error("Error in createOfficer:", error);
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

exports.demoteOfficer = async (req, res, next) => {
    try {
        const { officerId } = req.params;
        const officer = await User.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: "Officer not found",
            });
        }
        officer.role = "officer";
        await officer.save();
        res.status(200).json({
            success: true,
            message: "Officer demoted to officer",
            officer,
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsersWithGrievances = async (req, res) => {
  try {
    const users = await User.find({role:'user'}, 'fullName email phoneNumber'); // Only fetch necessary fields
 
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


exports.getAllOfficers = async (req, res) => {
    try {
        const officers = await User.find({ role: 'officer' }, 'fullName email phoneNumber gender department');
        res.status(200).json({
            success: true,
            data: officers,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

exports.getAllLeadOfficers = async (req, res) => {
    try {
        const leadOfficers = await User.find({ role: 'lead_officer' }, 'fullName email phoneNumber');
        res.status(200).json({
            success: true,
            data: leadOfficers,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

exports.deleteOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    console.log("Officer ID to delete:", officerId);

    const officer = await User.findById(officerId);
    if (!officer) {
      console.log("Officer not found");
      return res.status(404).json({
        success: false,
        message: "Officer not found",
      });
    }

    console.log("Officer found:", officer.name, officer.email);

    // FIX: Use deleteOne
    await User.deleteOne({ _id: officerId });

    console.log("Officer deleted successfully");

    res.status(200).json({
      success: true,
      message: "Officer deleted successfully",
    });
  } catch (error) {
    console.error("Delete officer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.deleteLeadOfficer = async (req, res) => {
    try {
        const { officerId } = req.params;
        const officer = await User.findById(officerId);
        if (!officer) {
            return res.status(404).json({
                success: false,
                message: "Lead Officer not found",
            });
        }
        await officer.remove();
        res.status(200).json({
            success: true,
            message: "Lead Officer deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
