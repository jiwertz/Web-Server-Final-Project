//Import the schema needed to get the server's email authentication settings
const ServerEmailSchema = require('./ServerEmailSchema');
const nodemailer = require('nodemailer');

class Mailer{
    static sendMail(receiver, subject, msg, includeAttachment){
        //Get the server's email address information from the database
        ServerEmailSchema.findOne({}, (err, results)=>{
            //If error, then could not get the server's email username and password
            if (err){
                console.log(err);
                return;
            }
            //Make the SMTP transporter that will authenticate the email server
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                //host: 'smtp.gmail.com',
                auth: {
                    user: results.email,
                    pass: results.password
                }
            });
            //Create the mailList if an array of emails was sent
            let mailList = ""
            if (Array.isArray(receiver)){
                for (var s in receiver){
                    if (mailList != ""){
                        mailList = mailList + ', '
                    }
                    mailList = mailList + receiver[s]
                }
            }
            else{
                //Else, set the mail list to the single email
                mailList = receiver
            }

            //Setup the email options
            let mailOptions = {
                from : `${results.name} <${results.email}>`,
                to : mailList,
                subject: subject,
                html: msg
            }
            //Check to see if the Enroll document needs to be attached to the email.
            if (includeAttachment == true){
                mailOptions.attachments =[{
                    filename: 'Enroll.docx',
                    path: './public/Enroll.docx'
                }]
            }

            //Have the transporter send the email to the client's email
            transporter.sendMail(mailOptions, (err, res)=>{
                if (!err){
                    console.log('Email Sent');
                } else{
                    console.log('Email Error')
                    console.log(err)
                }

            })
        })
    }
};

module.exports = Mailer;
