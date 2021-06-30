const multer = require('multer');
const fs = require('fs');
const path = require("path");

const AWS = require("aws-sdk");

const Organization = require('../api/models/organization');

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, 'org_data/');
    },
    filename: (req,file,cb) => {
        let orgShortName = req.user.domain || req.body.orgDomain.split(',')[0] || req.body.orgDomain;
        let mimeType = file.mimetype.split('/')[1];
        cb(null, orgShortName+'.'+mimeType);
    }
})

const err = new Error("File type not allowed!");
err.status = 409;
const upload = multer({
    storage: storage,
    fileFilter: function(req,file,callback) {
        var ext = path.extname(file.originalname);
        if(ext != '.csv') {
            return callback(err)
        }
        callback(null, true)
    }
});

exports.upload = upload.single('contentFile');

exports.get_data = function (req, res, next) {
    if(req.file) {
        const path = req.file.path;
        fs.readFile(path, 'utf8', (err, data) => {
            if(err) {
                return next(err);
            } else {
                try {
                    let parsedData = data.split('\n').splice(1,data.length-1);
                    const usersList = []
                    parsedData.forEach( userData => {
                        if(userData) {
                            var uid = userData.split(',')[0].trim();
                            var name = userData.split(',')[1].trim();
                            usersList.push({
                                name: name,
                                uid: uid
                            });
                        }
                    })
                    req.body.users = usersList;
                    next();
                } catch(err) {
                    err.message = "Some error in reading the uploaded file!"
                    return next(err);
                }
            }
        })
    } else next();
}

exports.uploadDoc = multer({
    fileFilter: function(req,file,callback) {
        var ext = path.extname(file.originalname);
        if(ext != '.png' && ext != '.jpg' && ext !== '.pdf' && ext !== '.jpeg') {
            return callback(err)
        }
        callback(null, true)
    }
}).single('file');
const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET
})
exports.uploadS3 = (domain, file, cb) => {
    const err = new Error("Upgrade your pack to add more documents!");
    err.status = 409;

    Organization.findOne({ domain: domain }).exec()
    .then(org => {
        const allowedSize = org.maxDocumentsSize - org.documentsSize;
        if(file.size > allowedSize) {
            cb(err);
        } else {
            const params = {
                Bucket: process.env.BUCKET_NAME,
                Key: file.originalname,
                Body: file.buffer,
                ContentType: file.mimetype 
            }
            S3.upload(params, (err, data) => {
                if(err) cb(err);
                else {
                    Organization.findOneAndUpdate(
                        { domain: domain },
                        { $inc: {documentsSize: file.size} }
                    ).exec()
                    .then(_ => cb(null,data.Location))
                    .catch(err => cb(err));
                }
            })
        }
    })
    .catch(err => cb(err));
}

exports.deleteS3 = (key, cb) => {
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: key
    };

    S3.deleteObject(params, (err, _) => {
        if(err) cb(err);
        else cb(null, _);
    })
}