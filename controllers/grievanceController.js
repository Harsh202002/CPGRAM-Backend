const Grievance = require("../models/grievanceModel");
const User = require("../models/userModel");
const Feedback = require("../models/feedbackModel");
const ProgressUpdate = require("../models/progressUpdateModel");
const sendEmail = require("../utils/sendEmail");
const grievanceConfirmationTemplate = require("../utils/grievanceConfirmation");
const grievanceStatusUpdateTemplate = require("../utils/grievanceStatusUpdate");
const reminderNotificationTemplate = require("../utils/reminderNotification");
const generateUniqueID = require("../utils/generateUniqueID");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

exports.createGrievance = async (req, res, next) => {
  try {
    const {
      dateOfBirth,
      addressLine2,
      ministryName,
      grievanceDescription,
      departmentName,
      publicAuthority,
      title,
      locationOfIssue,
      dateOfIncident,
      category,
    } = req.body;

    const files = req.files || [];
    const attachments = [];

    for (const file of files) {
      const localFilePath = file.path;

      try {
        const result = await cloudinary.uploader.upload(localFilePath, {
          folder: "grievances_attachments",
          resource_type: "auto",
        });

        attachments.push({
          public_id: result.public_id,
          url: result.secure_url,
        });

        // delete file from local after upload
        fs.unlinkSync(localFilePath);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        fs.unlinkSync(localFilePath);
        return res
          .status(500)
          .json({ success: false, message: "Failed to upload attachment" });
      }
    }

    const uniqueID = generateUniqueID();

    const grievance = await Grievance.create({
      user: req.user,
      dateOfBirth,
      addressLine2,
      ministryName,
      grievanceDescription,
      departmentName,
      publicAuthority,
      title,
      locationOfIssue,
      dateOfIncident,
      category,
      attachments,
      uniqueID,
    });

    const emailHTML = grievanceConfirmationTemplate(req.user.fullName, uniqueID);
    await sendEmail(
      req.user.email,
      "Grievance Submitted successfully - ID"+ uniqueID,
      emailHTML,
    );

    res.status(201).json({
      message: "Grievance created successfully",
      grievance,
    });
  } catch (error) {
    console.error("Error creating grievance:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Grievance with this unique ID already exists" });
    }
    next(error);
  }
};

exports.getGrievancesByUniqueId = async (req, res, next) => {
  try {
    const { uniqueID } = req.params;
    const grievance = await Grievance.findOne({ uniqueID });
    //.populate("user", "fullName email");
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    res.status(200).json(grievance);
  } catch (error) {
    next(error);
  }
};

exports.getUserGrievances = async (req, res, next) => {
  try {
    const grievances = await Grievance.find({ user: req.user._id }).populate(
      "user",
      "fullName email"
    );
    res.status(200).json(grievances);
  } catch (error) {
    next(error);
  }
};

exports.updateGrievance = async (req, res, next) => {
  try {
    const {
      ministryName,
      grievanceDescription,
      departmentName,
      publicAuthority,
      title,
      locationOfIssue,
      dateOfIncident,
      category,
    } = req.body;
    const files = req.files || [];
    const attachments = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "grievances_attachments",
      });
      attachments.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      {
        ministryName,
        grievanceDescription,
        departmentName,
        publicAuthority,
        title,
        locationOfIssue,
        dateOfIncident,
        category,
        attachments,
      },
      { new: true }
    ).populate("user", "fullName email");

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    res.status(200).json({
      message: "Grievance updated successfully",
      grievance,
    });
  } catch (error) {
    next(error);
  }
};

exports.trackGrievance = async (req, res, next) => {
  try {
    const { email, uniqueID } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const grievance = await Grievance.findOne({ uniqueID, user: user._id })
      .populate({
        path: "progressUpdates",
        populate: {
          path: "updatedBy",
          select: "fullName role",
        },
      })
      .populate("activityLog.updatedBy", "fullName role")
      .populate("assignedOfficer", "fullName department phoneNumber"); // <--- ADD THIS LINE HERE!

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // const recentUpdates = grievance.activityLog.filter(log => log.status === 'In Progress' || log.status === 'resolved').slice(-3);
    const canSendRemainder = checkRemainderEligibility(grievance.createdAt);

    // This `ProgressUpdate.find` query is separate and its `assignedOfficer`
    // population only affects the `progressUpdates` variable here,
    // not `grievance.assignedOfficer`.
    // If 'assignedOfficer' is part of the ProgressUpdate model,
    // and you want it in the 'progressUpdates' array in the response,
    // then this population is correct for that specific array.
    const progressUpdates = await ProgressUpdate.find({
      grievance: grievance._id,
    })
      .populate("updatedBy", "fullName role")
      .populate("assignedOfficer", "fullName department phoneNumber") // This populates assignedOfficer for progressUpdates
      .sort({ timestamp: -1 });

    res.json({
      personalInfo: {
        name: grievance.fullName,
        email: grievance.email,
        gender: grievance.gender,
        DOB: grievance.dateOfBirth,
        addressLine1: grievance.addressLine1,
        addressLine2: grievance.addressLine2,
        city: grievance.city,
        state: grievance.state,
        district: grievance.district,
        postalCode: grievance.postalCode,
      },
      grievanceDetails: {
        title: grievance.title,
        category: grievance.category,
        description: grievance.grievanceDescription,
        ministry: grievance.ministryName,
        department: grievance.departmentName,
        publicAuthority: grievance.publicAuthority,
        location: grievance.locationOfIssue,
        dateOfIncident: grievance.dateOfIncident,
        attachments: grievance.attachments,
        createdAt: grievance.createdAt,
      },
      currentStatus: grievance.status,
      // Now, grievance.assignedOfficer should be populated, so you can access its properties.
      // Added a null check just in case assignedOfficer might not exist for some grievances.
      assignedTo: grievance.assignedOfficer
        ? grievance.assignedOfficer.fullName
        : null,
      assignedOfficerDepartment: grievance.assignedOfficer
        ? grievance.assignedOfficer.department
        : null,
      assignedOfficerPhone: grievance.assignedOfficer
        ? grievance.assignedOfficer.phoneNumber
        : null,

      // Added department as well
      recentUpdates: grievance.activityLog,
      progressUpdates: grievance.progressUpdates.map((p) => ({
        _id: p._id,
        message: p.message,
        updatedBy: {
          name: p.updatedBy?.fullName || "N/A",
          role: p.updatedBy?.role || "N/A",
        },
        timestamp: p.timestamp,
      })),
      isResolved: grievance.status === "Resolved",
      allowReminder: canSendRemainder,
      allowFeedback:
        grievance.status === "Resolved" && !grievance.feedbackGiven,
    });
  } catch (error) {
    // It's good practice to log the error for debugging
    console.error("Error in trackGrievance:", error);
    next(error); // Pass the error to the error handling middleware
  }
};

// exports.trackGrievance = async (req, res, next) => {
//   try {
//     const { email, uniqueID } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const grievance = await Grievance.findOne({ uniqueID, user: user._id })
//       .populate({
//         path: "progressUpdates",
//         populate: {
//           path: "updatedBy",
//           select: "fullName role",
//         },
//       })
//       .populate("activityLog.updatedBy", "fullName role");

//     if (!grievance) {
//       return res.status(404).json({ message: "Grievance not found" });
//     }
//     // const recentUpdates = grievance.activityLog.filter(log => log.status === 'In Progress' || log.status === 'resolved').slice(-3);
//     const canSendRemainder = checkRemainderEligibility(grievance.createdAt);
//     const progressUpdates = await ProgressUpdate.find({
//       grievance: grievance._id,
//     })
//       .populate("updatedBy", "fullName role")
//       .populate("assignedOfficer", "fullName department")
//       .sort({ timestamp: -1 });
//     res.json({
//       personalInfo: {
//       name: grievance.fullName,
//       email:grievance.email,
//       gender:grievance.gender,
//       DOB:grievance.dateOfBirth,
//       addressLine1:grievance.addressLine1,
//       addressLine2:grievance.addressLine2,
//       city:grievance.city,
//       state:grievance.state,
//       district:grievance.district,
//       postalCode:grievance.postalCode
//       },
//       grievanceDetails: {
//         title: grievance.title,
//         category: grievance.category,
//         description: grievance.grievanceDescription,
//         ministry: grievance.ministryName,
//         department: grievance.departmentName,
//         publicAuthority: grievance.publicAuthority,
//         location: grievance.locationOfIssue,
//         dateOfIncident: grievance.dateOfIncident,
//         attachments: grievance.attachments,
//         createdAt: grievance.createdAt,
//       },
//       currentStatus: grievance.status,
//       assignedTo: grievance.assignedOfficer.fullName,
//       recentUpdates: grievance.activityLog,
//       progressUpdates: grievance.progressUpdates.map((p) => ({
//         _id: p._id,
//         message: p.message,
//         updatedBy: {
//           name: p.updatedBy?.fullName || "N/A",
//           role: p.updatedBy?.role || "N/A",
//         },
//         timestamp: p.timestamp,
//       })),
//       isResolved: grievance.status === "Resolved",
//       allowReminder: canSendRemainder,
//       allowFeedback:
//         grievance.status === "Resolved" && !grievance.feedbackGiven,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

function checkRemainderEligibility(createdAt) {
  const now = new Date();
  const createdDate = new Date(createdAt);
  const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
  return diffDays >= 21;
}

// exports.updateGrievanceStatus = async(req,res,next) =>{
//   try {
//     const {status,comment} = req.body;
//     const grievanceId = req.params._id;
//     const userId = req.user._id;

//     const grievance = await Grievance.findById(grievanceId).populate('user','fullName email');
//     if(!grievance){
//       return
//       res.status(404).json({message:'Grievance not found'})
//     }
//     const isAssignedOfficer = grievance.assignedTo?.toString() === userId.toString();
//     const isLeadOfficer = grievance.escalatedLeadOfficer?.toString() === userId.toString();

//     if(!isAssignedOfficer && !isLeadOfficer){
//       return
//       res.status(403).json({message:"only assigned officer and lead officer can update the status"})
//     }

//     const validStatuses = ['pending','In Progress', 'Resolved', 'closed'];
//     if(!validStatuses.includes(status)){
//       return
//       res.status(400).json({message:'invalid status value'})
//     }

//     if(status === 'Closed' && !grievance.feedbackGiven){
//       return
//       res.status(400).json({message:'Grievance cannot be either closed unless user feedback is submitted'})
//     }

//     grievance.activityLog.push({
//       message: `${status} status updated`,
//       comment,
//       updatedBy:userId,
//       status
//     });
//     grievance.status = status;
//     await grievance.save();
//     res.status(200).json({
//       message:`Grievance status updated to status ${status}`,
//       grievance
//     })
//   } catch (error) {
//     next(error);
//   }
// }

exports.updateGrievanceStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const { grievanceId } = req.params;
    const userId = req.user._id;
    const userName = req.user.fullName;

    const grievance = await Grievance.findById(grievanceId)
    .populate(
      "progressUpdates.updatedBy"
    ).populate(
      "user"
    );

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    const allowedFlow = ["Pending", "In Progress", "Resolved", "Closed"];

    const lastStatus = grievance.status || "Pending"; // fallback default

    const currentIndex = allowedFlow.indexOf(lastStatus);
    const newIndex = allowedFlow.indexOf(status);

    if (newIndex <= currentIndex) {
      return res.status(400).json({
        message:
          "Cannot revert to a previous or same status. Please delete the last progress update to change status backward.",
      });
    }

    grievance.activityLog.push({
      message: `${status} updated by ${userName}`,
      updatedBy: userId,
      status,
      comment,
      timestamp: new Date(),
    });

    // ✅ Update grievance's current status
    grievance.status = status;

    // ✅ Assign officer if status is moved to 'In Progress'
    if (status === "In Progress") {
      grievance.assignedOfficer = userId;
    }

    // ✅ Enable feedback if resolved
    if (status === "Resolved") {
      grievance.isFeedbackAllowed = true;
    }

    // ❌ Disable feedback if re-closed
    if (status === "Closed") {
      grievance.isFeedbackAllowed = false;
    }

    await grievance.save();

    const userEmail = grievance.user.email;
    const userFullName = grievance.user.fullName;
    const grievanceUniqueID = grievance.uniqueID;

    const emailHTML = grievanceStatusUpdateTemplate(userFullName,grievanceUniqueID,status,comment);
    console.log("sending email to",userEmail);
    
    await sendEmail(
      userEmail,
      `Update:Your Grievance Status is now "${status}"`,
      emailHTML,
    )

    return res.status(200).json({
      message: "Status updated successfully",
      grievance,
    });
  } catch (error) {
    next(error);
  }
};

exports.addProgressUpdate = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const { message } = req.body;
    const officerId = req.user._id; // assuming you're using JWT & middleware to attach user

    // Fetch the grievance
    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found" });
    }

    // Check if current user is assigned officer
    // if (grievance.assignedOfficer.toString() !== officerId.toString()) {
    //   return res
    //     .status(403)
    //     .json({ error: "Only assigned officer can update progress" });
    // }

    // Check if status is "In Progress"
    if (grievance.status !== "In Progress") {
      return res.status(400).json({
        error: 'Progress updates allowed only when status is "In Progress"',
      });
    }

    // Push the new progress update
    grievance.progressUpdates.push({
      message,
      updatedBy: officerId,
    });

    await grievance.save();

    res.status(200).json({
      message: "Progress update added successfully",
      grievance,
    });
  } catch (error) {
    console.error("Error adding progress update:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//  console.log("req.params:",req.params);

//   try {
//     const { grievanceId } = req.params;
//     const { message } = req.body;
//     const userId = req.user._id;
//     if(!message || message.trim() === ''){
//       return
//       res.status(400).json({message:"Message is Required"})
//     }
//     const grievance = await Grievance.findById(grievanceId);
//     if(!grievance){
//       return
//       res.status(404).json({message:'Grievance not found'})
//     }
//     const isAssignedOfficer = grievance.assignedTo?.toString() === userId.toString();
//     const isLeadOfficer = grievance.escalatedLeadOfficer?.toString() === userId.toString();

//     if(!isAssignedOfficer && !isLeadOfficer){
//       return
//       res.status(403).json({message:"only assigned officer and lead officer can update the progress update"})
//     }

//     const progress = await ProgressUpdate.create({
//       grievance: grievance._id,
//       updatedBy:userId,
//       message
//     })

//     grievance.progressUpdates.push(progress._id);
//     await grievance.save();

//      res.status(201).json({
//       message:'Progress update added successfully',
//      progress
//      })

//   } catch (error) {
//     next(error)
//   }

// }

// exports.deleteGrievanceStatusLog = async (req, res, next) => {
//   try {
//     const { grievanceId, logId } = req.params;
//     const userId = req.user._id;

//     const grievance = await Grievance.findById(grievanceId);

//     if (!grievance) {
//       return res.status(404).json({ message: 'Grievance not found' });
//     }

//     const logIndex = grievance.activityLog.findIndex(log => log._id.toString() === logId);
//     if (logIndex === -1) {
//       return res.status(404).json({ message: 'Status log not found' });
//     }

//     grievance.activityLog.splice(logIndex, 1);
//     await grievance.save();

//     res.status(200).json({ message: 'Status log deleted successfully' });
//   } catch (error) {
//     next(error);
//   }
// };

exports.deleteLastActivityLog = async (req, res, next) => {
  try {
    const { grievanceId } = req.params;

    const grievance = await Grievance.findById(grievanceId);
    if (!grievance || grievance.activityLog.length === 0) {
      return res.status(404).json({ message: "No activity log to delete" });
    }

    // Remove last activity log
    grievance.activityLog.pop();

    // Get new last activity log (after popping)
    const last = grievance.activityLog[grievance.activityLog.length - 1];

    // Reset assigned officer if status isn't "In Progress"
    if (!last || last.status !== "In Progress") {
      grievance.assignedOfficer = null;
    }

    // Validate and safely assign status
    const allowedStatusValues = [
      "Pending",
      "In Progress",
      "Resolved",
      "Closed",
    ];
    if (last?.status && allowedStatusValues.includes(last.status)) {
      grievance.status = last.status;
    } else {
      grievance.status = "Pending"; // fallback
    }

    await grievance.save();

    return res.status(200).json({
      message: "Last activity log deleted",
      grievance,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProgressUpdate = async (req, res, next) => {
  try {
    const { grievanceId, progressId } = req.params;

    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // Step 1: Remove the update to delete
    grievance.progressUpdates = grievance.progressUpdates.filter(
      (p) => p._id.toString() !== progressId
    );

    // Step 2: Sort remaining updates by timestamp DESC (newest first)
    const sorted = grievance.progressUpdates
      .filter((p) => p.timestamp)
      .map((p) => {
        // Extract status either from 'status' field or from the 'message'
        let status = p.status;
        if (!status && p.message) {
          const match = p.message.match(/^(.*?) updated by/i);
          if (match) {
            status = match[1].trim(); // Extracted status from message
          }
        }
        return { ...p, extractedStatus: status };
      })
      .filter((p) => p.extractedStatus) // Only keep valid ones
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Step 3: Pick latest status or fallback to "Pending"
    const newStatus = sorted.length > 0 ? sorted[0].extractedStatus : "Pending";

    grievance.status = newStatus;

    // Step 4: Reset assignedOfficer only if NOT "In Progress"
    grievance.assignedOfficer =
      newStatus === "In Progress" ? grievance.assignedOfficer : null;

    await grievance.save();

    return res.status(200).json({
      message: "Progress update deleted and status adjusted",
      grievance,
    });
  } catch (error) {
    console.error("❌ Error deleting progress update:", error);
    next(error);
  }
};

exports.getGrievancesAssignedToOfficer = async (req, res) => {
  try {
    console.log("Authenticated user:", req.user);

    const officerId = req.user._id;

    const grievances = await Grievance.find({ assignedOfficer: officerId })
      .populate("user", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    res.status(200).json(grievances);
  } catch (err) {
    console.error("Error fetching assigned grievances:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllGrievances = async (req, res, next) => {
  try {
    const grievances = await Grievance.find()
      .populate("user", "fullName email role")
      .populate("assignedOfficer", "fullName email role")
      .populate("progressUpdates.updatedBy", "fullName email role");

    res.status(200).json({ grievances });
  } catch (error) {
    next(error);
  }
};

// exports.sendReminder = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const { grievanceId } = req.params;

//     // 1. Find grievance
//     const grievance = await Grievance.findById(grievanceId)
//       .populate('user', 'fullName email')
//       .populate('assignedTo', 'fullName email')
//       .populate('progressUpdates.updatedBy', 'fullName role');

//     if (!grievance) {
//       return res.status(404).json({ message: 'Grievance not found' });
//     }

//     // 2. Check if the user is the owner of the grievance
//     if (grievance.user._id.toString() !== userId.toString()) {
//       return res.status(403).json({ message: 'You are not allowed to send a reminder for this grievance' });
//     }

//     // 3. Check if grievance is assigned to an officer
//     // if (!grievance.assignedTo) {
//     //   return res.status(400).json({ message: 'Grievance is not assigned to any officer yet' });
//     // }

//     // 4. Optionally log the reminder in grievance
//     grievance.reminders.push({ sentBy: userId });
//     await grievance.save();

//     // 5. Return grievance details (to be sent/shown to officer)
//     res.status(200).json({
//       message: 'Reminder sent successfully',
//       grievance,
//     });

//     // 🔔 OPTIONAL: You can integrate notification/email service to alert the officer

//   } catch (err) {
//     console.error('Reminder error:', err);
//     next(err);
//   }
// };

exports.sendReminder = async (req, res, next) => {
  try {
    const { grievanceId } = req.params;
    const senderId = req.user._id;
 
    const grievance = await Grievance.findById(grievanceId).populate("user");
 
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
 
    grievance.reminders.push({
      sentBy: senderId,
      timestamp: new Date(),
    });
 
    await grievance.save();
 
    let recipient;
 
    if (grievance.assignedTo) {
      recipient = await User.findById(grievance.assignedTo);
    } else {
      recipient = await User.findOne({ role: "lead_officer" });
    }
 
    if (!recipient) {
      return res
        .status(404)
        .json({ message: "No officer or lead officer found to send reminder" });
    }
 
    // ✅ Send email to officer
    const officerEmailHTML = reminderNotificationTemplate(
      recipient.fullName,
      grievance.uniqueID,
      grievance.user.fullName
    );
 
    await sendEmail(
      recipient.email,
      `Reminder: Action Required on Grievance ${grievance.uniqueID}`,
      officerEmailHTML,
    );
 
    // ✅ Send confirmation email to user
    const userEmailHTML = reminderNotificationTemplate(
      grievance.user.fullName,
      grievance.uniqueID,
      "You (Reminder Sent)"
    );
 
    await sendEmail(
grievance.user.email,
      `Reminder Sent on Grievance ${grievance.uniqueID}`,
       userEmailHTML,
    );
 
    res.status(200).json({
      message: `Reminder sent successfully to ${recipient.fullName}`,
      recipient: {
        name: recipient.fullName,
email: recipient.email,
        role: recipient.role,
      },
    });
  } catch (err) {
    console.error("Reminder send error:", err);
    next(err);
  }
};
// exports.getAllReminders = async(req,res,next) => {
//   try {
//     const officerId = req.user._id;
//     if(req.user.role !== 'officer' && req.user.role !== 'lead_officer'){
//       return
//       res.status(403).json({
//         message:'Access Denied. Only Officers can view reminders'
//       })
//     }
//       const grievances = await Grievance.find({
//         assignedTo: officerId,
//         reminders:{$exists: true, $ne:[]}
//       })
//       .populate('user', 'fullName email')
//       .populate('reminders.sentBy', 'fullName email')
//       .populate('progressUpdates.updatedBy','fullName')
//       .sort({updatedAt: -1});

//       res.status(200).json({
//         count:grievances.length,
//         grievances
//       })
//   } catch (error) {
//     console.error('Error Fetching reminders',err);
//     next(error)
//   }
// }

exports.getAllReminders = async (req, res, next) => {
  try {
    const officerId = req.user._id;
    const role = req.user.role;

    if (role !== "officer" && role !== "lead_officer") {
      return res
        .status(403)
        .json({ message: "Access denied. Only officers can view reminders." });
    }

    let query;

    if (role === "officer") {
      // Officer sees reminders for grievances assigned to them
      query = { assignedTo: officerId, reminders: { $exists: true, $ne: [] } };
    } else if (role === "lead_officer") {
      // Lead officer sees reminders for grievances that are not yet assigned
      query = {
        assignedTo: { $exists: false },
        reminders: { $exists: true, $ne: [] },
      };
    }

    const grievances = await Grievance.find(query)
      .populate("user", "fullName email")
      .populate("reminders.sentBy", "fullName email")
      .populate("progressUpdates.updatedBy", "fullName")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      count: grievances.length,
      grievances,
    });
  } catch (err) {
    console.error("Error fetching reminders:", err);
    next(err);
  }
};

exports.submitFeedback = async (req, res, next) => {
  try {
    const { uniqueID } = req.params;
    const { rating, message } = req.body;
    const userId = req.user._id;

    const grievance = await Grievance.findOne({ uniqueID }).populate("user");

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    if (grievance.status !== "Resolved") {
      return res
        .status(400)
        .json({ message: "Feedback allowed only on resolved grievances" });
    }

    // Check if feedback already exists for this grievance
    const existingFeedback = await Feedback.findOne({
      grievance: grievance._id,
    });
    if (existingFeedback) {
      return res.status(400).json({ message: "Feedback already submitted" });
    }

    // Save feedback in Feedback collection
    const feedback = await Feedback.create({
      grievance: grievance._id,
      satisfied: rating >= 3, // or use a separate field like `satisfied: true`
      comments: message,
    });

    // Optionally mark in grievance that feedback was given
    grievance.feedbackGiven = true;
    await grievance.save();

    // Send thank-you email
    await sendMail(
      grievance.user.email,
      `Thanks for your feedback on grievance ${grievance.uniqueID}`,
      `
        <p>Dear ${grievance.user.fullName},</p>
        <p>Thanks for submitting your feedback. Here's what you submitted:</p>
        <ul>
          <li><strong>Rating:</strong> ${rating} / 5</li>
          <li><strong>Message:</strong> ${message}</li>
        </ul>
        <p>We appreciate your time!</p>
      `
    );

    return res
      .status(200)
      .json({ message: "Feedback submitted and email sent" });
  } catch (error) {
    next(error);
  }
};

exports.getAllFeedbacksForOfficers = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find()
      .populate({
        path: "grievance",
        populate: {
          path: "user",
          select: "fullName email",
        },
      })
      .sort({ createdAt: -1 });

    const feedbackList = feedbacks.map((feedback) => ({
      uniqueID: feedback.grievance?.uniqueID,
      grievanceTitle: feedback.grievance?.title,
      user: feedback.grievance?.user?.fullName,
      email: feedback.grievance?.user?.email,
      rating: feedback.satisfied ? 5 : 2, // Example mapping, adjust if needed
      message: feedback.comments,
      submittedAt: feedback.createdAt,
    }));

    return res.status(200).json({ feedbacks: feedbackList });
  } catch (error) {
    next(error);
  }
};

