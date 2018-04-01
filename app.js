//UCO Advisement Service
const express = require ('express')
const session = require('express-session')
const ejs = require('ejs')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')

const app = express()
app.set('view engine','ejs')
app.set('views','./ejs_views')

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

const GenerateCode = require('./models/GenerateCode')
//Usage: GenerateCode.getId()
//Will return a 6 dgit alpha-numeric code

const UserSchema = require('./models/UserSchema')
const UserModel = require('./models/UserModel')

const saltCount = 10

app.use('/public', express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: false}))

app.use(session({
    secret: 'UCOCSADVISEMENT',
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 60*60*1000 //Cookie lasts for 1 hour
    }
}))

app.get("/",(req, res)=>{
    if (!req.session.userInfo){
        req.session.userInfo = null
    }
    let user = req.session.userInfo
    res.render('index',{user})
})

app.get("/SignIn",(req,res)=>{
    if (!req.session.userInfo){
        let signIn = {
            error: null,
            email: null
        }
        res.render('SignIn', {signIn})
    }
    else{
        res.redirect("/")
    }
})

app.post("/SignIn",(req,res)=>{
    const query = {email: req.body.email}
    UserSchema.findOne(query,(err, results)=>{
        if (err){
            return res.status(500).send('<h1>User sign in error! Could not read database! Please contact the site administrator</h1>',err);
        
        }
        if (results == null){
            let signIn = {
                error: true,
                email: null
            }
            return res.render("SignIn",{signIn})   
        } else if (!bcrypt.compareSync(req.body.password,results.password)){
            let signIn = {
                error: true,
                email: req.body.email
            }
            return res.render("SignIn",{signIn})
        } else{
            let user = new UserModel({
                firstName: results.firstName,
                lastName: results.lastName,
                email: results.email,
                isFaculty: results.isFaculty,
                facultyID: results.facultyID,
                studentID: results.studentID,
                majorCode: results.majorCode,
                profilePic: results.profilePic,
                verifyCode: results.verifyCode,
                verified: results.verified,
                facultyVerified: results.facultyVerified
            })
            req.session.userInfo = user.serialize()
            res.redirect("/")
        }
    })
})

app.get("/SignUp",(req,res)=>{
    let user = null;
    if (!req.session.userInfo){
        user = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            accountType: req.body.accountType,
            facultyID: req.body.facultyID,
            studentID: req.body.studentID,
            majorCode: req.body.majorCode,
        }
    } else{
        user = req.session.userInfo
    }
    let err = {error: false}
    res.render('SignUp',{user, err})
})

app.post("/SignUp",(req,res)=>{
    let query = {email: req.body.email}
    UserSchema.findOne(query,(err,result)=>{
        if (err){
            return res.status(500).send('<h1>User registration error! Could not read database! Please contact the site administrator</h1>',err);
        }
        if (result != null){
            let user = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                accountType: req.body.accountType,
                facultyID: req.body.facultyID,
                studentID: req.body.studentID,
                majorCode: req.body.majorCode,
            }
            let err = {error: true}
            return res.render("SignUp",{user, err})
        }
        let randomCode = GenerateCode.getId()
        const newUser = new UserSchema({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, saltCount),
            //double check how the isFaculty feature is working!! IWERTZ
            isFaculty: (req.body.accountType == "0") ? false : true,
            facultyID: req.body.facultyID,
            studentID: req.body.studentID,
            majorCode: req.body.majorCode,
            profilePic: null,
            verifyCode: randomCode,
            verified: false,
            facultyVerified: false
        })
        newUser.save((err, results)=>{
            if (err){
                return res.status(500).send('<h1>User registration error! Please contact the site administrator</h1>',err);
            }
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
            let user = new UserModel({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                isFaculty: (req.body.accountType == "0") ? false : true,
                facultyID: req.body.facultyID,
                studentID: req.body.studentID,
                majorCode: req.body.majorCode,
                profilePic: null,
                verifyCode: randomCode,
                verified: false,
                facultyVerified: false
            })
            req.session.userInfo = user.serialize();    

            res.render("VerifyCode", {user, err: false})
        })
    })
})

app.get("/verifyCode", (req,res)=>{
    if (!req.session.userInfo){
        return res.redirect("/")
    }
    let user = UserModel.deserialize(req.session.userInfo)
    res.render("VerifyCode", {user, err: false})
})

app.post("/verifyCode",(req,res)=>{
    if (!req.session.userInfo){
        return res.redirect("/")
    }
    let user = UserModel.deserialize(req.session.userInfo)
    if (user.verifyCode == req.body.code){
        let query = {email: user.email}
        let update = {
            $set: {
                verified: true
            }
        }
        UserSchema.findOneAndUpdate(query,update,(err,result)=>{
            if (err){
                return res.status(500).send('<h1>User verification error! Please contact the site administrator</h1>',err);
            }
            user.verified = true
            req.session.userInfo = user.serialize()
            return res.redirect("/")
        })
    } else{
        res.render("VerifyCode",{user, err: true})
    }
})

app.get("/logout",(req, res)=>{
    if (!req.session.userInfo){
        return req.redirect("/")
    }
    req.session.destroy()
    res.redirect("/")
})

const port = process.env.PORT || 3000
app.listen(port, () =>{
    console.log('Server is running at port', port)
})