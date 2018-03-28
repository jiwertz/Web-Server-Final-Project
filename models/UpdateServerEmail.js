const ServerEmailSchema = require('./ServerEmailSchema')

module.exports = function(newEmail, newPass){
//function UpdateServerEmail(newEmail, newPass){
    //Validate that an admin email and password was provided
    if (newEmail == null || newPass == null){
        return;
    }
    //Set the update query parameters
    let update ={
        $set: {
            email : newEmail,
            password : newPass
        }
    }
    //Find and update the one and only server email
    ServerEmailSchema.findOneAndUpdate({}, update, (err, result)=>{
        //Database error, could not update the server email
        if (err){
            console.log(err)
            AddFirstServerEmail(newEmail, newPass)
        }
        //Check to see if the server email was updated, if result == null, then no server email exists, so create one
        if (result == null){
            //Add the brand new server email information when no prior one exsisted.
            AddFirstServerEmail(newEmail, newPass)
        }
    })
}

//Adds brand new server email information to the database
function AddFirstServerEmail(newEmail, newPass){
    //Create a new ServerEmailSchema record for the database
    const newServerEmail = new ServerEmailSchema({
        name: 'UCO CS Advisement',
        email: newEmail,
        password: newPass
    })
    //Save the record to the database
    newServerEmail.save((err, results)=>{
        //If err, then database could not save the new record
        if (err){
            console.log(err)
            return;
        }
        //Else, new server email information was succesfully saved
        console.log('New Server Email Information Saved!');
    })
}