const mongoose = require('mongoose')

const progressUpdateSchema = new mongoose.Schema({
    grievance:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Grievance',
        required:true
    },
    updatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    message:{
        type:String,
        required:true
    },
    timestamp:{
        type:Date,
        default:Date.now
    }
})


module.exports = mongoose.model('ProgressUpdate', progressUpdateSchema);