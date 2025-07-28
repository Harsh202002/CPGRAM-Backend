const Grievance = require("../models/grievanceModel");

exports.submitFeedback = async (req, res) => {
  try {
    const { uniqueID } = req.params;
    const { feedback } = req.body;
    const userId = req.user.id;

    const grievance = await Grievance.findOne({ uniqueID, user: userId });

    if (!grievance) return res.status(404).json({ message: "Grievance not found" });

    if (grievance.status !== "Resolved") {
      return res.status(400).json({ message: "Feedback allowed only after grievance is resolved" });
    }

    if (grievance.feedbackGiven) {
      return res.status(400).json({ message: "Feedback already submitted" });
    }

    grievance.feedbackGiven = true;
    grievance.activityLog.push({
      message: "Feedback submitted",
      updatedBy: req.user.id,
      comment: feedback,
      status: grievance.status,
    });

    await grievance.save();
    res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit feedback", error });
  }
};
