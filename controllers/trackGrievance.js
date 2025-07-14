const Grievance = require('../models/grievanceModel');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');

exports.trackGrievance = async (req, res, next) => {
   try {
    const {email, uniqueId} = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const grievance = await Grievance.findOne({ uniqueId, user: user._id })
    .populate('assignedTo', 'name department role')
    .populate('activityLog.updatedBy', 'name role');

    if (!grievance) {
        return res.status(404).json({ message: 'Grievance not found' });
    }
    const recentUpdates = grievance.activityLog.filter(log => log.status === 'In Progress' || log.status === 'resolved').slice(-3);
     const canSendRemainder = checkRemainderEligibility(grievance.createdAt);
     res.json({
        grievanceDetails:{
            title: grievance.title,
            category:grievance.category,
            description:grievance.description,
            ministry:grievance.ministryName,
            department:grievance.departmentName,
            publicAuthority:grievance.publicAuthority,
            location:grievance.locationOfIssue,
            dateOfIncident:grievance.dateOfIncident,
            attachments:grievance.attachments,
            createdAt:grievance.createdAt,
        },
        currentStatus: grievance.status,
        assignedOfficer:grievance.assignedTo?{
            name:grievance.assignedTo.name,
            department:grievance.assignedTo.department
        }:null,
        recentUpdates,
        isResolved:grievance.status === 'Resolved',
        allowReminder: canSendRemainder,
        allowFeedback:grievance.status === 'Resolved' && !grievance.feedbackGiven


        });

   } catch (error) {
    next(error)
    
   }
};


function checkRemainderEligibility(createdAt){
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffDays = Math.floor((now-createdDate)/(1000 * 60 * 60 * 24));
    return diffDays >=21;
}