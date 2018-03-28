const mongoose = require('mongoose')
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema

const serverEmailSchema = new Schema({
    name: String,
    email: String,
    password: String
});

module.exports = mongoose.model('ServerEmail',serverEmailSchema);