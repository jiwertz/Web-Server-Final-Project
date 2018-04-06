const UserSchema = require('../models/UserSchema');
const UserModel = require('../models/UserModel')

class VerifyCode{
    static verify(req, callback){
        let user = UserModel.deserialize(req.session.userInfo)
        console.log(user.verifyCode, req.body.code);
        if (user.verifyCode == req.body.code){
            let query = {email: user.email}
            let update = {
                $set: {
                    verified: true
                }
            }
            UserSchema.findOneAndUpdate(query,update,(err,result)=>{
                if (err){
                    return callback(true, req.flash('verifyError', error));
                }
                user.verified = true
                req.session.userInfo = user.serialize()
                return callback(false, req.flash('verifySuccess', 'Successfully Verified Account!'));
            })
        } else{
            return callback(true, req.flash('verifyError', 'Wrong Verification Code'));
        }
    }
}

module.exports = VerifyCode