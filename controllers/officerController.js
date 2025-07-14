const Grievance = require('../models/grievanceModel');
const User = require('../models/userModel');

exports.getGrievanceByToken = async (req, res,next   ) => {
    try {
        const {uniqueID} = req.params;
        const grievance = await Grievance.findOne({ grievanceID: uniqueID }).populate('user', '-username -password -role -department -address -city -state -district -pincode')
        .populate('assignedTo', 'name role')
        .populate('activityLog.updatedBy', 'name role');
        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }
        res.status(200).json(grievance);

    } catch (error) {
        next(error);
        
    }
}

exports.assignGrievance = async (req, res, next) => {
    try {
        const { grievanceId, officerId } = req.body;

        // Find the grievance and assign it to the officer
        const grievance = await Grievance.findByIdAndUpdate(
            grievanceId,
            { assignedTo: officerId },
            { new: true }
        ).populate('user', '-username -password -role -department -address -city -state -district -pincode')
         .populate('assignedTo', 'name role')
         .populate('activityLog.updatedBy', 'name role');

        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }

        // Log the activity
        grievance.activityLog.push({
            message: `Grievance assigned to officer ${officerId}`,
            updatedBy: req.user._id,
            status: 'Assigned'
        });

        await grievance.save();

        res.status(200).json(grievance);
    } catch (error) {
        next(error);
    }
}

// exports.assignGrievance = async (req, res, next) => {
//     try {
//         const { grievanceId, officerId } = req.body;

//         const grievance = await Grievance.findById(grievanceId);
//         grievance.assignedTo = officerId;
//         grievance.activityLog.push({
//             message: `Grievance assigned to officer ${officerId}`,
//             updatedBy: req.user._id,
//             status: 'Assigned'
//         });
//         await grievance.save();
//         res.json({
//             message: 'Grievance assigned successfully',
//             grievance
//         });
//     } catch (error) {
//         next(error);
//     }
// }

exports.updateStatus = async (req, res, next) => {
  try {
    const { grievanceId } = req.params;
    const { status, comment } = req.body;
 
    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }
 
    grievance.status = status;
 
    grievance.activityLog.push({
      message: `Status updated to ${status}`,
      updatedBy: req.user._id, // ✅ Just the ObjectId
      comment: comment || '',
      status: status
    });
 
    if (status === 'Resolved') {
      grievance.feedbackGiven = true;
    }
 
    await grievance.save();
 
    res.json({
      message: `Grievance status marked as ${status}`,
      grievance
    });
 
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//   grievance.activityLog.push({
//             message: `Status updated to ${status}`,
//             updatedBy: req.user._id,
//             comment: comment || '',
//             status: status
//         });

exports.escalateGrievance = async (req, res, next) => {
    try {
        const { grievanceId} = req.params;
        const {leadOfficerId} = req.body;
        const leadOfficer = await User.findById(leadOfficerId);
        if (!leadOfficer || leadOfficer.role !== 'lead_officer') {
            return res.status(404).json({ message: 'Lead Officer not found or invalid role' });
        }
        const grievance = await Grievance.findById(grievanceId);
        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        };
        grievance.escalatedToLeadOfficer = true;
        grievance.escalatedLeadOfficer = leadOfficerId;
        grievance.assignedTo = null;
        grievance.activityLog.push({
            message: `Grievance escalated to Lead Officer ${leadOfficerId}`,
            updatedBy: req.user._id,
            status: 'Escalated'
        });

        await grievance.save();
        res.status(200).json({
            message: 'Grievance escalated to Lead Officer successfully',
            grievance
        });
    } catch (error) {
        next(error);
    }
}

exports.closeGrievance = async (req, res, next) => {
    try {
        const { grievanceId } = req.params;
        const {finalComment} = req.body;
        const grievance = await Grievance.findById(grievanceId);
        grievance.status = 'Closed';
        grievance.isClosed = true;
        grievance.activityLog.push({
            message: `Grievance closed with comment: ${finalComment}`,
            updatedBy: req.user._id,
            status: 'Closed'
        });

        await grievance.save();
        res.status(200).json({
            message: 'Grievance closed successfully',
            grievance
        });
    } catch (error) {
        next(error);
    }
}


exports.addProgressMessage = async (req, res, next) => {
    try {
        const { grievanceId } = req.params;
        const { message } = req.body;

        const grievance = await Grievance.findById(grievanceId);
        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }
        if(grievance.status !== 'In Progress'){
            return res.status(400).json({ message: 'can only send progress messages when status is in progress '});
        }

        grievance.activityLog.push({
            message,
            updatedBy: req.user._id,
            status: "In Progress"
        });

        await grievance.save();
        res.status(200).json({
            message: 'Progress update added',
            grievance
        });
    } catch (error) {
        next(error);
    }
}

exports.escalateGrievance = async (req, res, next) => {
    try {
        const { grievanceId } = req.params;
        const { officerId } = req.body;
        const leadOfficer = await User.findById(officerId);
        if (!leadOfficer || leadOfficer.role !== 'lead_officer') {
            return res.status(404).json({ message: 'Lead Officer not found or invalid role' });
        }
        const grievance = await Grievance.findById(grievanceId);
        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }
        grievance.escalatedToLeadOfficer = true;
        grievance.escalatedLeadOfficer = leadOfficerId;
        grievance.activityLog.push({
            message: `Grievance escalated to Lead Officer ${leadOfficer.fullName}`,
            updatedBy: req.user._id,
            status: 'Escalated'
        });

        await grievance.save();
        res.status(200).json({
            message: 'Grievance escalated to Lead Officer successfully',
            grievance
        });
    } catch (error) {
        next(error);
    }
}

exports.addProgressMessage = async (req, res, next) => {
    try {
        const { grievanceId } = req.params;
        const { message } = req.body;

        const grievance = await Grievance.findById(grievanceId);
        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }
        if (grievance.status !== 'In Progress') {
            return res.status(400).json({ message: 'Can only send progress messages when status is In Progress' });
        }

        grievance.activityLog.push({
            message,
            updatedBy: {
                id: req.user._id,
                name: req.user.fullName,
            },
            status: "In Progress"
        });

        await grievance.save();
        res.status(200).json({
            message: 'Progress update added',
            grievance
        });
    } catch (error) {
        next(error);
    }
}