const mongoose = require('mongoose')
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema

const appointmentSchema = new Schema({
    text: String,
    start_date: String,
    end_date: String,
    studentID: {type:Schema.Types.ObjectId, ref:'UserSchema'},
    booked: Boolean,
    studentComment: String
});

module.exports = mongoose.model('AppointmentSchema',appointmentSchema);