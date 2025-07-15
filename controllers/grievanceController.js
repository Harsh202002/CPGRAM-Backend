const Grievance = require('../models/grievanceModel');
const User = require('../models/userModel');
const ProgressUpdate = require('../models/progressUpdateModel');
const sendEmail = require('../utils/sendEmail');
const generateUniqueID = require('../utils/generateUniqueID');
const cloudinary = require('../config/cloudinary');
const fs = require("fs");
const path = require("path");

exports.createGrievance = async (req, res, next) => {
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
    const grievance = await Grievance.findOne({ uniqueID: req.params.id, user: req.user._id }).populate('user', 'fullName email');
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }
    res.status(200).json(grievance);
  } catch (error) {
    next(error);
  }
};

exports.getUserGrievances = async (req, res, next) => {
  try {
    const grievances = await Grievance.find({ user: req.user._id }).populate('user', 'fullName email');
    res.status(200).json(grievances);
  } catch (error) {
    next(error);
  }
}

exports.updateGrievanceStatus = async (req, res, next) => {
  try {
    const { status, resolution } = req.body;
    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { status, resolution },
      { new: true }
    ).populate('user', 'fullName email');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    res.status(200).json({
      message: 'Grievance status updated successfully',
      grievance
    });
  } catch (error) {
    next(error);
  }
};
exports.updateGrievance = async (req, res, next) => {
  try {
    const { ministryName, grievanceDescription, departmentName, publicAuthority, title, locationOfIssue, dateOfIncident, category } = req.body;
    const files = req.files || [];
    const attachments = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'grievances_attachments',
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
        attachments
      },
      { new: true }
    ).populate('user', 'fullName email');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    res.status(200).json({
      message: 'Grievance updated successfully',
      grievance
    });
  } catch (error) {
    next(error);
  }
};

exports.trackGrievance = async (req, res, next) => {
   try {
    const {email, uniqueID} = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const grievance = await Grievance.findOne({ uniqueID, user: user._id })
    .populate('assignedTo', 'fullName department role')
    .populate('activityLog.updatedBy', 'name');

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
            name:grievance.assignedTo.fullName,
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

exports.updateGrievanceStatus = async(req,res,next) =>{
  try {
    const {status,comment} = req.body;
    const grievanceId = req.params._id;
    const userId = req.user._id;

    const grievance = await Grievance.findById(grievanceId).populate('user','fullName email');
    if(!grievance){
      return
      res.status(404).json({message:'Grievance not found'})
    }
    const isAssignedOfficer = grievance.assignedTo?.toString() === userId.toString();
    const isLeadOfficer = grievance.escalatedLeadOfficer?.toString() === userId.toString();

    if(!isAssignedOfficer && !isLeadOfficer){
      return
      res.status(403).json({message:"only assigned officer and lead officer can update the status"})
    }


    const validStatuses = ['pending','In Progress', 'Resolved', 'closed'];
    if(!validStatuses.includes(status)){
      return
      res.status(400).json({message:'invalid status value'})
    }

    if(status === 'Closed' && !grievance.feedbackGiven){
      return
      res.status(400).json({message:'Grievance cannot be either closed unless user feedback is submitted'})
    }

    grievance.activityLog.push({
      message: `${status} status updated`,
      comment,
      updatedBy:userId,
      status
    });
    grievance.status = status;
    await grievance.save();
    res.status(200).json({
      message:`Grievance status updated to status ${status}`,
      grievance
    })
  } catch (error) {
    next(error);
  }
}

exports.addProgressUpdate =async(res,req,next)=>{

  try {
    const grievanceId = req.params.id;
    const {message} = req.body;
    const userId = req.user._id;
    if(!message || message.trim() === ''){
      return
      res.status(400).json({message:"Message is Required"})
    }
    const grievance = await Grievance.findById(grievanceId);
    if(!grievance){
      return
      res.status(404).json({message:'Grievance not found'})
    }
    const isAssignedOfficer = grievance.assignedTo?.toString() === userId.toString();
    const isLeadOfficer = grievance.escalatedLeadOfficer?.toString() === userId.toString();

    if(!isAssignedOfficer && !isLeadOfficer){
      return
      res.status(403).json({message:"only assigned officer and lead officer can update the progress update"})
    }

    const ProgressUpdate = await ProgressUpdate.create({
      grievance: grievanceId,
      updatedBy:userId,
      message
    })
     res.status(201).json({
      message:'Progress update added successfully',
      ProgressUpdate
     })


  } catch (error) {
    next(error)
  }
  


}
