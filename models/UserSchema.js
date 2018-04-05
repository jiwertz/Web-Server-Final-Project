const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
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

userSchema.methods.encryptPassword = function(password, callback) {
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return callback(err);
        else return callback(null, hash);
    });
}

userSchema.methods.verifyPassword = function(password, callback) {
    bcrypt.compare(password, this.password, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

module.exports = mongoose.model('UserSchema',userSchema);