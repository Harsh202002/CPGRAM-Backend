const Grievance = require('../models/grievanceModel');
const User = require('../models/userModel');

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


exports.getAllAssignedGrievances = async(req,res,next) => {
    try {
        const userId = req.user._id
        const grievances = await Grievance.find({
            $or:[
                {assignedTo:userId},
            ]
        })
        .populate('user','fullName email role')
        .populate('assignedTo', 'name email role')
        .populate('progressUpdates.updatedBy','fullName email role')
        res.status(200).json({grievances});
    } catch (error) {
        next(error)
    }
}


exports.getAllOfficer = async(req,res,next) =>{
    try {
        const officers = await User.find({
            role:'officer'
        }).select('-password');

        res.status(200).json({
            message:'officers fetched successfully',
            officers
        })
    } catch (error) {
        next(error)
    }
}




