const User = require("../models/userModel");
const mongoose = require("mongoose");
const UserProfile = require("../models/UserProfile");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

// Create UserProfile
const createUserProfile = async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    console.log("FILES RECEIVED:", req.files);


    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: "User not found" });

    const existingProfile = await UserProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists for this user" });
    }

    const files = req.files || {};
    const uploads = {};

    for (const key in files) {
      const file = files[key][0];
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "user-profiles",
      });
      fs.unlinkSync(file.path);
      uploads[key] = result.secure_url;
    }

    const fullProfileData = {
      ...profileData,
      profileImage: uploads.profileImage,
      aadhaarCardUrl: uploads.aadhaarCardUrl,
      voterIdCardUrl: uploads.voterIdCardUrl,
      panCardUrl: uploads.panCardUrl,
      utilityBillUrl: uploads.utilityBillUrl,
      bankStatementUrl: uploads.bankStatementUrl,
    };

    const profile = new UserProfile({ userId, ...fullProfileData });
    await profile.save();

    res.status(201).json({ message: "User profile created", profile });
  } catch (err) {
    console.error("Create profile error:", err);
    res.status(400).json({ error: err.message });
  }
};


// Get All Profiles
const getAllProfiles = async (req, res) => {
  try {
    const profiles = await UserProfile.find()
      .populate(
        "userId",
        "fullName email phoneNumber role gender address city state district pincode"
      )
      .select("-__v");

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ message: "No user profiles found" });
    }

    res.status(200).json({ total: profiles.length, profiles });
  } catch (err) {
    console.error("Error fetching user profiles:", err);
    res
      .status(500)
      .json({ error: "Server error while fetching user profiles" });
  }
};

// Get Profile by ID
const getProfileById = async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id).populate(
      "userId",
      "fullName email phoneNumber role"
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error while fetching profile" });
  }
};


// Update Profile
const updateUserProfile = async (req, res) => {
  try {
    const profileId = req.params.id;

    // ✅ handle profile image upload
    if (req.files?.profileImage?.[0]) {
      const localImagePath = req.files.profileImage[0].path;

      const resultCloud = await cloudinary.uploader.upload(localImagePath, {
        folder: "user-profiles",
      });

      fs.unlinkSync(localImagePath); // delete local file
      req.body.profileImage = resultCloud.secure_url;
    }

    const updatedProfile = await UserProfile.findByIdAndUpdate(
      profileId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ message: "Profile updated", profile: updatedProfile });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(400).json({ error: err.message });
  }
};


// Delete Profile
const deleteUserProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error("Error deleting profile:", err);
    res.status(500).json({ error: "Server error while deleting profile" });
  }
};

const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    // Validate and convert userId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const profile = await UserProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).populate("userId");

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json(profile);
  } catch (err) {
    console.error("Error fetching profile by userId:", err);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};


module.exports = {
  createUserProfile,
  getAllProfiles,
  getProfileById,
  updateUserProfile,
  deleteUserProfile,
  getProfileByUserId,
};
