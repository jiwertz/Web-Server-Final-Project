const mongoose = require('mongoose')
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    isFaculty: Boolean,
    facultyID: String,
    studentID: String,
    majorCode: String,
    profilePic: String,
    verifyCode: String,
    verified: Boolean,
    facultyVerified: Boolean
});

module.exports = mongoose.model('UserSchema',userSchema);