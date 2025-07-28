const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    grievance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grievance',
        required: true
    },  
    satisfied: {
        type: Boolean,
        required: true  
    },
    comments: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
