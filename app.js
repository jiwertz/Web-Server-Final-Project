const express = require ('express')
const session = require('express-session')
const ejs = require('ejs')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

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
    res.render('index')
})

const port = process.env.PORT || 3000
app.listen(port, () =>{
    console.log('Server is running at port', port)
})