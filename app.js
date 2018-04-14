//UCO Advisement Service
const express = require('express')
const session = require('express-session')
const ejs = require('ejs')
var bodyParser = require("body-parser");
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')
const csrf = require('csurf')
const moment = require('moment') // This is used when rendering the index.ejs file to format the dates displayed from the pendingAppointments.ejs file
moment.suppressDeprecationWarnings = true;

const passport = require('passport')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')

const app = express()
app.set('view engine', 'ejs')
app.set('views', './ejs_views')
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }))

//Import class used to update the server's email authentication
const UpdateServerEmail = require('./models/UpdateServerEmail')
//This is an example of how to use the UpdateServerEmail function
//UpdateServerEmail('[InsertEmail]@gmail.com','[InsertPassword]');

//Import database models
require('./models/Database')

//Import class that will be used to send emails
const Mailer = require('./models/Mailer')
//Example of user the Mailer class to send an email
//Mailer.sendMail(arrayOfEmails, subject title, body of email, boolean to include Enroll.docx as attachment)
//Mailer.sendMail(['jiwertz9@gmail.com','jiwertz@uco.edu'],'Registration','Thank you for registering', false)

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const multerUtility = require('./public/Utilities/MulterUtility')
const VerifyCode = require('./config/VerifyCode')

const UserSchema = require('./models/UserSchema')
const UserModel = require('./models/UserModel')
const AppointmentSchema = require('./models/AppointmentSchema')
const AppointmentModel = require('./models/AppointmentModel')

app.use(session({
    secret: 'UCOCSADVISEMENT',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60 * 60 * 1000 //Cookie lasts for 1 hour
    }
}))

app.use(flash());
app.use(passport.initialize())
app.use(passport.session())

require('./config/passport');

app.post("/SignUpAdvisement", isLoggedIn, (req, res) => 
{
    let user = UserModel.deserialize(req.session.userInfo)
    let query = {_id: req.body.id}
    let update = {
        $set: {
            studentID: user._id,
            booked: true
        }
    }
    AppointmentSchema.findOneAndUpdate(query,update,(err, result)=>{
        if (err){
            return res.status(500).send('<h1>Internal DB Error</h1>')
        }
        Mailer.sendMail(
            user.email,
            "Appointment Registration",
            `
            <html>
            <body style="background-color:#0b2d63; margin:8px; padding:8px">
                <font size="6" color="#e5b509">
                    You have registred for a CS Advisement Appointment on
                    ${moment(result.start_date).format('MMM Do YYYY')} 
                    from ${moment(result.start_date).format('hh:mm A')} to ${moment(result.end_date).format('hh:mm A')}.
                    <br><br>
                    Please fill out the attached document
                    and bring it with you to the appointment or email it to the advisor before the appointment.
                </font
            </body>
            </html>
            `,
            true
        )
        req.flash('registerSuccess', 'Successfully Registered For An Appointment On ' + result.start_date + '!')
        res.redirect("/")
    })
})

app.post('/unregisterAppointment',(req,res)=>{
    let query = {_id: req.body.id}
    let update = {
        $set: {
            studentID: null,
            booked: false
        }
    }
    AppointmentSchema.findOneAndUpdate(query,update,(err, result)=>{
        if (err){
            return res.status(500).send('<h1>Internal DB Error</h1>')
        }
        req.flash('registerSuccess', 'Successfully Unregistred For An Appointment On ' + result.start_date + '!')
        res.redirect("/")
    })
})

app.post("/editProfile", (req, res) => {
    if (!req.session.userInfo) {
        req.redirect("/")
    }
    multerUtility.uploadPicture(req, res, (err) => {
        if (err) {
            return res.status(500).send('<h1>Unable to upload file to server</h1>')
        }
        const query = { _id: req.body._id }
        let update = {
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                facultyID: req.body.facultyID,
                studentID: req.body.studentID,
                majorCode: req.body.majorCode,
            }
        }
        if (req.file) {
            update.$set.profilePic = multerUtility.uploadImageDir + "/" + req.file.filename
        }
        if (req.body.password != '') {
            update.$set.password = bcrypt.hashSync(req.body.password, saltCount)
        }
        UserSchema.findOneAndUpdate(query, update, (err, result) => {
            if (err) {
                fs.unlink(multerUtility.uploadImageDir + "/" + req.file.filename)
                return res.status(500).send('<h1>Internal DB Error</h1>')
            }
            if (req.file) {
                if (req.body.image_path != '') {
                    fs.unlink(req.body.image_path)
                }
            }
            let user = new UserModel(result)
            user.profilePic = multerUtility.uploadImageDir + "/" + req.file.filename
            req.session.userInfo = user.serialize()
            res.redirect("/")
        })
    })
})

app.post("/remove", (req, res) => {
    let query = { _id: req.body.id }
    AppointmentSchema.findOne(query).populate("studentID").exec((er, resl)=>{
        if (er){
            return res.status(500).send('<h1>Error attempting to remove from database</h1>')
        }
        Mailer.sendMail(
            resl.studentID.email,
            "CS Advisement Appointment Cancelled",
            "<h1>Your CS Advisement appointment for " + resl.start_date + " to " + resl.end_date + " was cancelled. Please sign up for a new appointment. </h1>",
            false
        )
        AppointmentSchema.remove(query, (err, results) => {
            if (err) {
                return res.status(500).send('<h1>Error attempting to remove from database</h1>')
            }
            else {
                res.redirect('/');
            }
        })
    })
})

app.post("/add", (req, res) => {
    let query = { _id: req.body.id }
    let update = {
        $set: {
            start_date: new Date(req.body.start_date),
            end_date: new Date(req.body.end_date),
            text: req.body.text,
        }
    }
    AppointmentSchema.findOneAndUpdate(query, update, (err, result) => {
        if (err) {
            let event = new AppointmentSchema({
                start_date: new Date(req.body.start_date),
                end_date: new Date(req.body.end_date),
                text: req.body.text,
                studentID: '',
                booked: false
            })
            event.save((err, result) => {
                if (err) {
                    return res.status(500).send('<h1> Internal Database Error</h1>')
                }
                return res.redirect("/")
            })
        }
        else {
            return res.redirect("/")
        }

    })
})

//Any app.get() or app.post() above this point doesn't fall victim to the csurf middleware
app.use(csrf())
//Any app.get or app.post beyond this point falls victim to the csurf middleware

app.get("/", (req, res) => {
    let user = null
    if (req.session.userInfo) {
        user = UserModel.deserialize(req.session.userInfo)
    }
    let data = []
    getCalendarEvents((err, data) => {
        let verifyMessage = req.flash('verifySuccess')
        let loginMessage = req.flash('signinsuccess')
        let registerMessage = req.flash('registerSuccess')
        res.render('index', { user, data, verifyMessage, loginMessage, registerMessage, moment, csrfToken: req.csrfToken()})
    })
})

app.get("/SignIn", (req, res) => {
    if (!req.session.userInfo) {
        let signIn = {
            error: null,
            email: null
        }
        let messages = req.flash('loginerror')
        res.render('SignIn', { signIn, messages, csrfToken: req.csrfToken() })
    }
    else {
        res.redirect("/")
    }
})

app.post("/SignIn", passport.authenticate('locallogin', {
    successRedirect: '/',
    failureRedirect: '/SignIn',
    failureFlash: true
}))

app.get("/SignUp", (req, res) => {
    let user = null;
    if (!req.session.userInfo) {
        user = {
            firstName: null,
            lastName: null,
            email: null,
            accountType: null,
            facultyID: null,
            studentID: null,
            majorCode: null
        }
    } else {
        user = UserModel.deserialize(req.session.userInfo)
    }
    const messages = req.flash('signuperror');
    res.render('SignUp', { req, messages, user, csrfToken: req.csrfToken() })
})

app.post("/SignUp", passport.authenticate('localsignup', {
    successRedirect: '/verifyCode',
    failureRedirect: '/SignUp',
    failureFlash: true
}))

app.get("/verifyCode", isLoggedIn, (req, res) => {
    let user = UserModel.deserialize(req.session.userInfo)
    let messages = req.flash('verifyError')
    res.render("VerifyCode", { user, messages, csrfToken: req.csrfToken() })

})

app.post("/verifyCode", (req, res) => {
    let user = UserModel.deserialize(req.session.userInfo)
    VerifyCode.verify(req, (err, a) => {
        if (err) {
            return res.redirect("/verifyCode")
        }
        else {
            return res.redirect("/")
        }
    })
})

app.get("/logout", (req, res) => {
    req.session.destroy()
    res.redirect("/")
})

app.get("/calendar", (req, res) => {
    let user = null
    if (req.session.userInfo) {
        user = UserModel.deserialize(req.session.userInfo)
    }
    getCalendarEvents((err, data) => {
        res.render('calendar', { user, data })
    })

})

app.get("/editProfile", isLoggedIn, (req, res) => {
    let user = UserModel.deserialize(req.session.userInfo);
    res.render('ProfileEdit', { user, csrfToken: req.csrfToken() })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Server is running at port', port)
})

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.render('errorpage', { message: 'Login required to access this page.' });
    }
}

app.get("/addAppointments", isLoggedIn, (req, res) => {
    let user = req.session.userInfo
    if (user.isFaculty) {
        res.render('addAppointments', { user, csrfToken: req.csrfToken() })
    }
    else {
        res.redirect("/")
    }
})

app.post("/addAppointments", (req, res) => {
    let MINUTES = 0;
    let HOURS = parseInt(req.body.end_date.substring(0, 2)) - parseInt(req.body.start_date.substring(0, 2))
    let begMINUTES = parseInt(req.body.start_date.substring(3, 5))
    let endMINUTES = parseInt(req.body.end_date.substring(3, 5))
    let begHOURS = parseInt(req.body.start_date.substring(0, 2))
    let endHOURS = parseInt(req.body.end_date.substring(0, 2))

    if (parseInt(req.body.end_date.substring(3, 5)) >= parseInt(req.body.start_date.substring(3, 5))) {
        MINUTES = parseInt(req.body.end_date.substring(3, 5)) - parseInt(req.body.start_date.substring(3, 5))
    }
    else if (parseInt(req.body.end_date.substring(3, 5)) < parseInt(req.body.start_date.substring(3, 5))) {
        MINUTES = parseInt(60 - req.body.start_date.substring(3, 5)) + parseInt(req.body.end_date.substring(3, 5))
        HOURS = HOURS - 1
    }
    if (MINUTES % 10 != 0) {
        MINUTES = ((parseInt(60 - req.body.start_date.substring(3, 5)) + parseInt(req.body.end_date.substring(3, 5))) - MINUTES % 10) + 10
    }

    MINUTES = MINUTES + HOURS * 60;
    let num_of_appointments = MINUTES / 10;
    let x;
    let data = []

    for (x = 0; x < num_of_appointments; x++) {
        if (begMINUTES >= 60) {
            begMINUTES = begMINUTES - 60
            begHOURS = begHOURS + 1
        }
        let final_beginning_date = req.body.date + " " + (begHOURS + ":" + parseInt(begMINUTES))
        endMINUTES = begMINUTES + 10
        endHOURS = begHOURS
        if (endMINUTES >= 60) {
            endMINUTES = endMINUTES - 60
            endHOURS = endHOURS + 1
        }

        let final_ending_date = req.body.date + " " + (endHOURS + ":" + parseInt(endMINUTES))

        let obj = {
            text: "appointment " + (x + 1),
            start_date: new Date(final_beginning_date),
            end_date: new Date(final_ending_date),
            studentID: null,
            booked: false
        };
        data.push(obj)
        begMINUTES = begMINUTES + 10
        endMINUTES = endMINUTES = 10
    }
    AppointmentSchema.insertMany(data)
    res.redirect("/")
})

Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};

function getCalendarEvents(callback) {
    AppointmentSchema.find().populate('studentID').exec((err, res) => {
        if (err) {
            return res.status(500).send('<h1> Internal Database Error</h1>')
        }
        //Insert the appointments into the event array, but place them in sorted order!
        let event = []
        for (let appointment of res){
            apt = new AppointmentModel(appointment)
            inserted = false;
            if (event.length == 0){
                event.push(apt)
            } else{
                InnerLoop:
                for (let index in event){
                    if (moment(moment(apt.start_date).format('MM/DD/YYYY HH:MM')).isBefore(moment(event[index].start_date).format('MM/DD/YYYY HH:MM'))){
                        event.insert(index, apt)
                        inserted = true
                        break InnerLoop
                    }
                }
                if (inserted == false){
                    event.push(apt)
                }
            }
        }
        console.log('array', event)
        return callback(false, event);
    })
}