// passport is also imported at app.js
// the configuration made at app.js is available here too
// do not configure it again
const passport = require('passport');
const UserSchema = require('../models/UserSchema');
const LocalStrategy = require('passport-local').Strategy;

const GenerateCode = require('../models/GenerateCode')
//Usage: GenerateCode.getId()
//Will return a 6 dgit alpha-numeric code

const Mailer = require('../models/Mailer')
const UserModel = require('../models/UserModel')

// how to serialize user to store in session
passport.serializeUser((user, callback) => {
    callback(null, user._id);
});

// how to deserailize user from serialized data (user)
passport.deserializeUser((id, callback) => {
    UserSchema.findById(id, (err, user) => {
        callback(err, user);
    })
});

const localStrategyConfig = {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // pass the eniter request to the callback
}

passport.use('localsignup',
    new LocalStrategy(localStrategyConfig, (req, email, password, callback) => {
        UserSchema.findOne({'email': email}, (err, user) => {
            if (err) return callback(null, false, req.flash('signuperror', err));
            if (user) {
                req.session.userInfo = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    accountType: req.body.accountType,
                    facultyID: req.body.facultyID,
                    studentID: req.body.studentID,
                    majorCode: req.body.majorCode
                }
                return callback(null, false, req.flash('signuperror','Email is already in use'));
            }

            let randomCode = GenerateCode.getId()
            const newUser = new UserSchema({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password,
                isFaculty: (req.body.accountType == "0") ? false : true,
                facultyID: req.body.facultyID,
                studentID: req.body.studentID,
                majorCode: req.body.majorCode,
                profilePic: null,
                verifyCode: randomCode,
                verified: false,
                facultyVerified: false
            })
            newUser.encryptPassword(password, (err, result) => {
                if (err) return callback(null, false, req.flash('signuperror', err));
                newUser.password = result;
                newUser.save((err, result) => {
                    if (err) return callback(err);
                    let msg = `
                    <html>
                        <body style="background-color:#0b2d63; margin:8px; padding:8px">
                            <font size="6" color="#e5b509">
                                Thank you ${req.body.firstName} ${req.body.lastName} for registering an account with the UCO CS Advisment Scheduling System!
                                <br><br>
                                Please use the code below to complete your registration: <br>
                            </font>
                            <font size="20" color="#e5b509">
                                &nbsp;&nbsp;&nbsp;&nbsp;<b>${randomCode}</b>
                            </font>
                            <font size="6" color="#e5b509">
                                <br><br>
                                Thank you, <br>
                                CS UCO Advisment Scheduling System 
                                <br><br><br>
                                *Note: This email was auto generated, please do not respond directly to this email. If you have any questions regarding the system,
                                please contact the site administrator.
                            </font>
                        </body>
                    </html>
                    `
                    Mailer.sendMail(req.body.email,"UCO CS Advisement Registration", msg)
                    let user = new UserModel(newUser)
                    req.session.userInfo = user
                    return callback(null, newUser, req.flash('signupsuccess', 'Sign up successful! Please check your email for a verification code!'));
                });
            });
        });
    })
);

passport.use('locallogin',
    new LocalStrategy(localStrategyConfig, (req, email, password, callback) => {
        UserSchema.findOne({'email': email}, (err, user) => {
            if (err) return callback(null, false, req.flash('loginerror', err));
            if (!user) return callback(null, false, req.flash('loginerror', 'Invalid email'));
            user.verifyPassword(password, (err, result) => {
                if (err) return callback(null, false, req.flash('loginerror', err)); 
                if (!result) return callback(null, false, req.flash('loginerror', 'Incorrect password'));
                req.session.userInfo = new UserModel(user)
                return callback(null, user, req.flash('signinsuccess','Succesfully Signed In'));
            });
        });
    })
);