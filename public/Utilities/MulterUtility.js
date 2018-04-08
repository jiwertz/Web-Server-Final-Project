const multer = require('multer')
const fs = require('fs')
const path = require('path')

const uploadImagePrefix = 'image-';
const uploadImageDir = './public/pictureUploads';

// set storage options of multer
const imageStorageOptions = multer.diskStorage({
    destination: (req, file, callback) => {
        // upload dir path
        callback(null, uploadImageDir);
    },
    filename: (req, file, callback) => {
        callback(null, uploadImagePrefix + Date.now()
            + path.extname(file.originalname));
    }
});

// configure multer
const MAX_FILESIZE = 1024 * 1024 * 3; // 3 MB
const pictureFileTypes = /jpeg|jpg|png|gif/; // accepted file types in regexp

const uploadPicture = multer({
    storage: imageStorageOptions,
    limits: {
        fileSize: MAX_FILESIZE
    }, 
    fileFilter: (req, file, callback) => {
        const extname = pictureFileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = pictureFileTypes.test(file.mimetype);
        if (mimetype && extname) {
            return callback(null, true);
        } else {
            return callback('Error: Images only');
        }
    }
}).single('profileImage'); // parameter name of the file upload input from ProfielEdit.ejs

module.exports = {
    uploadImageDir,
    uploadPicture
    }