
class UserModel{
    constructor(user_entry) {
        this.firstName = user_entry.firstName
        this.lastName = user_entry.lastName
        this.email = user_entry.email
        this.isFaculty = user_entry.isFaculty
        this.facultyID = user_entry.facultyID
        this.studentID = user_entry.studentID
        this.majorCode = user_entry.majorCode
        this.profilePic = user_entry.profilePic
        this.verifyCode = user_entry.verifyCode
        this.verified = user_entry.verified
        this.facultyVerified = user_entry.facultyVerified
        
    }

    serialize(){
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            isFaculty: (this.isFaculty) ? "1" : "0",
            facultyID: this.facultyID,
            studentID: this.studentID,
            majorCode: this.majorCode,
            profilePic: this.profilePic,
            verifyCode: this.verifyCode,
            verified: (this.verified) ? "1" : "0",
            facultyVerified: (this.facultyVerified) ? "1": "0"
        }
    }

    static deserialize(sUser) {
        return new UserModel({
            firstName: sUser.firstName,
            lastName: sUser.lastName,
            email: sUser.email,
            isFaculty: (sUser.isFaculty == "1") ? true : false,
            facultyID: sUser.facultyID,
            studentID: sUser.studentID,
            majorCode: sUser.majorCode,
            profilePic: sUser.profilePic,
            verifyCode: sUser.verifyCode,
            verified: (sUser.verified == "1") ? true : false,
            facultyVerified: (sUser.facultyVerified == "1") ? true : false
        })
    }
}

module.exports = UserModel