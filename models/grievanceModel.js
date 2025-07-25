const mongoose = require("mongoose");

const grievanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },
    uniqueID: {
      type: String,
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    addressLine1: {
      type: String,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    district: {
      type: String,
    },
    pincode: {
      type: String,
    },
    ministryName: {
      type: String,
      required: true,
    },
    departmentName: {
      type: String,
      required: true,
    },
    publicAuthority: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    locationOfIssue: {
      type: String,
    },
    dateOfIncident: {
      type: Date,
    },
    grievanceDescription: {
      type: String,
      required: true,
    },
    attachments: [
      {
        public_id: String,
        url: String,
      },
    ],
    resolution: {
      type: String,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    escalatedToLeadOfficer: {
      type: Boolean,
      default: false,
    },
    escalatedLeadOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    activityLog: [
      {
        message: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comment: String,
        status: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    progressUpdates: [
      {
        message: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    feedbackGiven: {
      type: Boolean,
      default: false,
    },
    assignedDate: { type: Date },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grievance", grievanceSchema);

//  activityLog: [{
//         message: String,
//         updatedBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User'
//         },
//         status: String,
//         timestamp: { type: Date, default: Date.now }
//     }],

// activityLog: [{
//         message: String,
//         updatedBy: {id:{
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User'
//         },
//         name:String,
//         },
//         comment: String,
//         status: String,
//         timestamp: { type: Date, default: Date.now }
//     }],
