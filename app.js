//UCO Advisement Service
const express = require ('express')
const session = require('express-session')
const ejs = require('ejs')
var bodyParser = require("body-parser");
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')
const csrf = require('csurf')

const passport = require('passport')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')

const app = express()
app.set('view engine','ejs')
app.set('views','./ejs_views')
app.use(cookieParser());
app.use(express.urlencoded({extended: false}))

//Import class used to update the server's email authentication
const UpdateServerEmail = require('./models/UpdateServerEmail')
//This is an example of how to use the UpdateServerEmail function
//UpdateServerEmail('[InsertEmail]@gmail.com','[InsertPassword]');

//Import database models
require('./models/Database')

//Import class that will be used to send emails
const Mailer = require('./models/Mailer')
//Example of user the Mailer class to send an email
//Mailer.sendMail(arrayOfEmails, subject title, body of email)
//Mailer.sendMail(['jiwertz9@gmail.com','jiwertz@uco.edu'],'Registration','Thank you for registering')

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const multerUtility = require('./public/Utilities/MulterUtility')
const VerifyCode = require('./config/VerifyCode')

const UserSchema = require('./models/UserSchema')
const UserModel = require('./models/UserModel')

app.use(session({
    secret: 'UCOCSADVISEMENT',
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 60*60*1000 //Cookie lasts for 1 hour
    }
}))
app.use(flash());
app.use(passport.initialize())
app.use(passport.session())
app.use(csrf())

require('./config/passport');

app.get("/", (req, res)=>{
    let user = null
    if (req.session.userInfo){
        user =  UserModel.deserialize(req.session.userInfo)
    }
    let data = getCalendarEvents()
    let verifyMessage = req.flash('verifySuccess')
    let loginMessage = req.flash('signinsuccess')
    res.render('index',{user, data, verifyMessage, loginMessage})
})

app.get("/SignIn", (req,res)=>{
    if (!req.session.userInfo){
        let signIn = {
            error: null,
            email: null
        }
        let messages = req.flash('loginerror')
        res.render('SignIn', {signIn, messages, csrfToken: req.csrfToken()})
    }
    else{
        res.redirect("/")
    }
})

app.post("/SignIn", passport.authenticate('locallogin',{
    successRedirect: '/',
    failureRedirect: '/SignIn',
    failureFlash: true
}))

app.get("/SignUp", (req,res)=>{
    let user = null;
    if (!req.session.userInfo){
        user = {
            firstName: null,
            lastName: null,
            email: null,
            accountType: null,
            facultyID: null,
            studentID: null,
            majorCode: null
        }
    } else{
        user =  UserModel.deserialize(req.session.userInfo)
    }
    const messages = req.flash('signuperror');
    res.render('SignUp',{req, messages, csrfToken, user, csrfToken: req.csrfToken()})
})

app.post("/SignUp", passport.authenticate('localsignup',{
    successRedirect: '/verifyCode',
    failureRedirect: '/SignUp',
    failureFlash: true
}))

app.get("/verifyCode", isLoggedIn, (req,res)=>{
    let user = UserModel.deserialize(req.session.userInfo)
    let messages = req.flash('verifyError')
    res.render("VerifyCode", {user, messages, csrfToken: req.csrfToken()})
})

app.post("/verifyCode",(req, res)=>{
    let user = UserModel.deserialize(req.session.userInfo)
    VerifyCode.verify(req, (err,a)=>{
        if (err){
           return res.redirect("/verifyCode")
        }
        else{
            return res.redirect("/")
        }
    })
})

app.get("/logout", (req, res)=>{
    req.session.destroy()
    res.redirect("/")
})

app.get("/calendar", (req, res)=>{
    let user = null
    if (req.session.userInfo){
        user =  UserModel.deserialize(req.session.userInfo)   
    }
    let data = getCalendarEvents()
    res.render('calendar', {user, data})
})

app.post("/SignUpAdvisement", (req,res)=>{
    res.redirect("/")
})

app.get("/editProfile", isLoggedIn, (req, res)=>{
    let user = UserModel.deserialize(req.session.userInfo);
    res.render('ProfileEdit', {user, csrfToken: req.csrfToken()})
})

app.post("/editProfile", (req, res)=>{
    if (!req.session.userInfo){
        req.redirect("/")
    }
    multerUtility.uploadPicture(req, res, (err) =>{
        if (err){
            console.log(err)
            return res.status(500).send('<h1>Unable to upload file to server</h1>')
        }
        const query = {_id: req.body._id}
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
        if (req.file){
            update.$set.profilePic = multerUtility.uploadImageDir + "/" + req.file.filename
        }
        if (req.body.password != ''){
            update.$set.password = bcrypt.hashSync(req.body.password, saltCount)
        }
        UserSchema.findOneAndUpdate(query,update,(err, result)=>{
            if (err){
                fs.unlink(multerUtility.uploadImageDir + "/" + req.file.filename)
                return res.status(500).send('<h1>Internal DB Error</h1>')
            }
            if (req.file){
                console.log(req.body.image_path)
                if (req.body.image_path != ''){
                    console.log('delete old picture')
                    fs.unlink(req.body.image_path)
                }
                let user = UserModel.deserialize(req.session.userInfo)
                user.profilePic = multerUtility.uploadImageDir + "/" + req.file.filename
                req.session.userInfo = user.serialize()
            }
            res.redirect("/")
        })
    })
})

const port = process.env.PORT || 3000
app.listen(port, () =>{
    console.log('Server is running at port', port)
})

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.render('errorpage', {message: 'Login required to access this page.'});
    }
}

function getCalendarEvents(){
    return [
    {
        id: "1234",
        text: "appointment",
        start_date: "04/02/2018 12:00",
        end_date: "04/02/2018 12:10",
        booked: true
    },
    {
        id: "1235",
        text: "appointment",
        start_date: "04/02/2018 12:10",
        end_date: "04/02/2018 12:20"
    },
    {
        id: "1236",
        text: "appointment",
        start_date: "04/02/2018 12:20",
        end_date: "04/02/2018 12:30"
    },
    {
        id: "1237",
        text: "appointment",
        start_date: "04/02/2018 12:30",
        end_date: "04/02/2018 12:40"
    },
    {
        id: "1238",
        text: "appointment",
        start_date: "04/02/2018 12:40",
        end_date: "04/02/2018 12:50"
    },
    {
        id: "1239",
        text: "appointment",
        start_date: "04/02/2018 12:50",
        end_date: "04/02/2018 13:00"
    },
    {
        id: "1240",
        text: "appointment",
        start_date: "04/02/2018 13:00",
        end_date: "04/02/2018 13:10"
    },
    {
        id: "1241",
        text: "appointment",
        start_date: "04/02/2018 13:10",
        end_date: "04/02/2018 13:20"
    },
    {
        id: "1242",
        text: "appointment",
        start_date: "04/02/2018 13:20",
        end_date: "04/02/2018 13:30"
    },
    {
        id: "1243",
        text: "appointment",
        start_date: "04/02/2018 13:30",
        end_date: "04/02/2018 13:40"
    },
    {
        id: "1244",
        text: "appointment",
        start_date: "04/02/2018 13:40",
        end_date: "04/02/2018 13:50"
    },
    {
        id: "1245",
        text: "appointment",
        start_date: "04/02/2018 13:50",
        end_date: "04/02/2018 14:00"
    }
]
}
