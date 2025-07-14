const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  alternatePhone: { type: String },
  nationality: { type: String },
  dob: { type: Date },
  aadhaar: { type: String },
  voterId: { type: String },
  pan: { type: String },
  profileImage: { type: String },
  aadhaarCardUrl: { type: String },
  voterIdCardUrl: { type: String },
  panCardUrl: { type: String },
  utilityBillUrl: { type: String },
  bankStatementUrl: { type: String },
  accountStatus: { type: String, default: 'Active' },
  registrationDate: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
module.exports = UserProfile;

