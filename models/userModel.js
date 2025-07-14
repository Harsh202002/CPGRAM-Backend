const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    gender: {
        type: String,  
    },
        
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber:{
        type: String,
       
    },
    role:{
        type: String,
        enum: ['user','officer','lead_officer','admin'],
        default: 'user',
        required: true,
    },
    department: {
        type: String,
        // required: function() {
        //     return this.role === 'officer' || this.role === 'lead_officer';
        // },
    },
    address: {
        type: String,
        
    },
    city: {
        type: String,
        
    },
    state:{
        type: String,
        
    },
    district: {
        type: String,
       
    },
    pincode: {  
        type: String,
        
    },
    password: {
        type: String,
        required: true,
    }}, {

    timestamps: true,   })

module.exports = mongoose.model('User', userSchema);