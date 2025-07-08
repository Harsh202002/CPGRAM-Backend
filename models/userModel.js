const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    gender: {
        type: String,  
        required: true,         
},
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber:{
        type: String,
        required: true,
        unique: true,
    },
    role:{
        type: String,
        enum: ['user','officer','admin'],
        default: 'user',
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state:{
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    pincode: {  
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }}, {

    timestamps: true,   })

module.exports = mongoose.model('User', userSchema);