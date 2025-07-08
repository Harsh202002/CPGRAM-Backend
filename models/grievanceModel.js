const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending'
    },
    uniqueID: {
        type: String,
        required: true,
        unique: true
    },
    ministryName: {
        type: String,
        required: true
    },
    departmentName: {
        type: String,
        required: true
    },
    publicAuthority: {
        type: String,

    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
      
    },
    locationOfIssue: {
        type: String,
       
    },
    dateOfIncident:{
        type: Date,
       
    },
    grievanceDescription: {
        type: String,
        required: true
    },
    attachments: [{
        public_id: String,
        url: String
    }],
    resolution: {
        type: String,
    },

},{timestamps: true});

module.exports = mongoose.model('Grievance', grievanceSchema);