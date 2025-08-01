const Grievance = require("../models/grievanceModel");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const assignmentNotificationTemplate = require("../utils/assignmentNotification");

exports.assignGrievance = async (req, res, next) => {
  try {
    const { grievanceId, officerId } = req.body;

    const grievance = await Grievance.findByIdAndUpdate(
      grievanceId,
      { assignedTo: officerId, assignedDate: new Date() },
      { new: true }
    )
      .populate(
        "user",
        "-username -password -role -department -address -city -state -district -pincode"
      )
      .populate("assignedTo", "fullName email role")
      .populate("activityLog.updatedBy", "fullName role");

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // Log activity
    grievance.activityLog.push({
      message: `Grievance assigned to officer ${grievance.assignedTo.fullName}`,
      updatedBy: req.user._id,
      status: "Assigned",
    });

    await grievance.save();

    // ✅ Officer email (assigned person)
    const officerEmailHTML = assignmentNotificationTemplate(
      grievance.assignedTo.fullName,
      grievance.uniqueID,
      req.user.fullName,
      grievance.assignedTo.fullName,
      true // isRecipientOfficer
    );

    await sendEmail(
      grievance.assignedTo.email,
      `New Grievance Assigned: ${grievance.uniqueID}`,
      officerEmailHTML
    );

    // ✅ Lead officer confirmation email
    const leadOfficerEmailHTML = assignmentNotificationTemplate(
      req.user.fullName,
      grievance.uniqueID,
      req.user.fullName,
      grievance.assignedTo.fullName,
      false // isRecipientOfficer
    );

    await sendEmail(
      req.user.email,
      `Grievance Assigned Successfully to ${grievance.assignedTo.fullName}`,
      leadOfficerEmailHTML
    );

    res.status(200).json(grievance);
  } catch (error) {
    next(error);
  }
};

exports.getGrievanceById = async (req, res, next) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate(
        "user",
        "-username -password -role -department -address -city -state -district -pincode"
      )
      .populate("assignedOfficer", "fullName email role")
      .populate("assignedTo", "fullName email role")
      .populate("activityLog.updatedBy", "fullName role");

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    res.status(200).json({ grievance });
  } catch (error) {
    console.error("Error fetching grievance:", error);
    next(error);
  }
};

exports.unassignGrievance = async (req, res, next) => {
  try {
    const { grievanceId } = req.body;

    const grievance = await Grievance.findByIdAndUpdate(
      grievanceId,
      { $unset: { assignedTo: "" } }, // <-- this removes the field
      { new: true }
    )
      .populate(
        "user",
        "-username -password -role -department -address -city -state -district -pincode"
      )
      .populate("assignedTo", "name email role")
      .populate("activityLog.updatedBy", "name role");

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    await grievance.save();

    res.status(200).json(grievance);
  } catch (error) {
    next(error);
  }
};

exports.getAllAssignedGrievances = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const grievances = await Grievance.find({
      $or: [{ assignedTo: userId }],
    })
      .populate("user", "fullName email role")
      .populate("assignedTo", "name role")
      .populate("progressUpdates.updatedBy", "fullName email role");
    res.status(200).json({ grievances });
  } catch (error) {
    next(error);
  }
};

exports.getAllOfficer = async (req, res, next) => {
  try {
    const officers = await User.find({
      role: "officer",
    }).select("-password");

    res.status(200).json({
      message: "officers fetched successfully",
      officers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getGrievanceStats = async (req, res, next) => {
  try {
    const total = await Grievance.countDocuments();

    const pendingReview = await Grievance.countDocuments({ status: "Pending" });
    const inProgress = await Grievance.countDocuments({
      status: "In Progress",
    });
    const resolved = await Grievance.countDocuments({ status: "Resolved" });

    res.status(200).json({
      totalGrievances: total,
      pendingReview,
      inProgress,
      resolved,
    });
  } catch (err) {
    console.error("Error getting grievance stats:", err);
    next(err);
  }
};

exports.getRecentGrievances = async (req, res, next) => {
  try {
    const recentGrievances = await Grievance.find()
      .sort({ createdAt: -1 }) // descending by date
      .limit(5)
      .populate("user", "fullName email") // optional: populate user info
      .populate("assignedTo", "fullName"); // optional: populate assigned officer
    // .populate('escalatedLeadOfficer', 'fullName'); // optional

    res.status(200).json({
      success: true,
      grievances: recentGrievances,
    });
  } catch (err) {
    console.error("Error fetching recent grievances:", err);
    next(err);
  }
};

exports.getRecentActivities = async (req, res, next) => {
  try {
    // Flatten all activity logs from all grievances
    const grievances = await Grievance.find({}, "uniqueID activityLog")
      .populate("activityLog.updatedBy", "fullName role")
      .sort({ "activityLog.timestamp": -1 });

    let activities = [];

    grievances.forEach((grievance) => {
      grievance.activityLog.forEach((log) => {
        activities.push({
          ticketId: grievance.uniqueID,
          status: log.status,
          message: log.message,
          comment: log.comment,
          updatedBy: log.updatedBy?.name || "System",
          role: log.updatedBy?.role || "System",
          timestamp: log.timestamp,
        });
      });
    });

    // Sort by timestamp descending and limit to 5 recent activities
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = activities.slice(0, 5);

    res.status(200).json({
      success: true,
      data: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    next(error);
  }
};
