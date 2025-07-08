const mmongoose = require('mongoose');

const notificationSchema = new mmongoose.Schema({
    recipient: {
        type: mmongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tittle:{
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
   link:{
    type: String,
   }

},{timestamps:true})

module.exports = mmongoose.model('Notification', notificationSchema);