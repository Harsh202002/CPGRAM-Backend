const Grievance = require("../models/grievanceModel");
const User = require("../models/userModel");
const ProgressUpdate = require("../models/progressUpdateModel");
const sendEmail = require("../utils/sendEmail");
const generateUniqueID = require("../utils/generateUniqueID");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

exports.createGrievance = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      gender,
      phoneNumber,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      state,
      district,
      pincode,
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

    const grievance = await Grievance.create({
      user: req.user._id,
      fullName,
      email,
      gender,
      phoneNumber,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      state,
      district,
      pincode,
      ministryName,
      grievanceDescription,
      departmentName,
      publicAuthority,
      title,
      locationOfIssue,
      dateOfIncident,
      category,
      attachments,
      uniqueID: generateUniqueID(),
    });

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
    const {uniqueID} = req.params;
    const grievance = await Grievance.findOne(
      {uniqueID}
    )
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
      .populate("assignedTo", "fullName department role")
      .populate({
        path: "progressUpdates",
        populate: {
          path: "updatedBy",
          select: "fullName role",
        },
      })
      .populate("activityLog.updatedBy", "fullName role");

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    // const recentUpdates = grievance.activityLog.filter(log => log.status === 'In Progress' || log.status === 'resolved').slice(-3);
    const canSendRemainder = checkRemainderEligibility(grievance.createdAt);
    const progressUpdates = await ProgressUpdate.find({
      grievance: grievance._id,
    })
      .populate("updatedBy", "fullName role")
      .sort({ timestamp: -1 });
    res.json({
      personalInfo: {
      name: grievance.fullName,
      email:grievance.email,
      gender:grievance.gender,
      DOB:grievance.dateOfBirth,
      addressLine1:grievance.addressLine1,
      addressLine2:grievance.addressLine2,
      city:grievance.city,
      state:grievance.state,
      district:grievance.district,
      postalCode:grievance.postalCode
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
      assignedOfficer: grievance.assignedTo
        ? {
            name: grievance.assignedTo.fullName,
            department: grievance.assignedTo.department,
          }
        : null,
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
    next(error);
  }
};

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

    const grievance = await Grievance.findById(grievanceId).populate(
      "activityLog.updatedBy"
    );

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    const allowedFlow = ["Pending", "In Progress", "Resolved", "Closed"];

    const lastStatus = grievance.activityLog?.length
      ? grievance.activityLog[grievance.activityLog.length - 1].status
      : "Pending"; // fallback default

    const currentIndex = allowedFlow.indexOf(lastStatus);
    const newIndex = allowedFlow.indexOf(status);

    if (newIndex === -1) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (newIndex <= currentIndex) {
      return res.status(400).json({
        message:
          "Cannot revert to a previous or same status. Please delete the last activity log to change status backward.",
      });
    }

    // Add new entry in activity log
    grievance.activityLog.push({
      message: `${status} updated by ${userName}`,
      updatedBy: userId,
      status,
      comment,
    });

    grievance.status = status;

    // Assign officer if status is moved to 'In Progress'
    if (status === "In Progress") {
      grievance.assignedOfficer = userId;
    }

    await grievance.save();

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
    if (grievance.assignedOfficer.toString() !== officerId.toString()) {
      return res
        .status(403)
        .json({ error: "Only assigned officer can update progress" });
    }

    // Check if status is "In Progress"
    if (grievance.status !== "In Progress") {
      return res
        .status(400)
        .json({
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

    // Remove last log
    grievance.activityLog.pop();

    // Re-check last status for assignedOfficer reset
    const last = grievance.activityLog[grievance.activityLog.length - 1];
    if (!last || last.status !== "In Progress") {
      grievance.assignedOfficer = null;
    }

    grievance.status = last.status;

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
    const userId = req.user._id;

    const grievance = await Grievance.findById(grievanceId);

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // Find the progress update
    const progress = grievance.progressUpdates.id(progressId);
    if (!progress) {
      return res.status(404).json({ message: "Progress update not found" });
    }

    const isAuthor = progress.updatedBy.toString() === userId.toString();
    const isAssigned =
      grievance.assignedOfficer?.toString() === userId.toString();
    const isLead =
      grievance.escalatedLeadOfficer?.toString() === userId.toString(); // Optional

    if (!isAuthor && !isAssigned && !isLead) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this progress message" });
    }

    // Remove the progress update
    progress.deleteOne();
    await grievance.save();

    res.status(200).json({ message: "Progress message deleted successfully" });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
