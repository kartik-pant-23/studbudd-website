const mongoose = require("mongoose");
const { uploadS3, deleteS3 } = require("../../middleware/files_upload");

const Document = require('../models/document');

const errorHandler = require('../../middleware/error_handler');

exports.getDocuments = (req,res) => {
    Document.find({ref: req.params['ref']}).exec()
    .then(docs => res.status(200).json({documents: docs}))
    .catch(err => errorHandler(res,err));
}

exports.getDocumentDetails = (req,res) => {
    Document.findById(req.params['_id']).exec()
    .then(doc => req.status(200).json({document: doc}))
    .catch(err => errorHandler(res,err));
}

exports.uploadDocument = (req, res) => {
    const _id = new mongoose.Types.ObjectId();
    const file = req.file;
    const fileExtension = req.file.originalname.split('.').reverse()[0];
    file.originalname = req.user.domain + '/documents/' + _id + '.' + fileExtension;

    const { ref } = req.body;

    if (ref) {
        uploadS3(req.user.domain, file, (err, url) => {
            if (err) errorHandler(res, err);
            else {
                const document = Document({
                    _id: _id,
                    tag: req.body.tag,
                    description: req.body.description,
                    key: file.originalname,
                    url: url,
                    ref: ref,
                    uploadedBy: req.user._id
                });

                document.save()
                    .then(doc => res.status(200).json({
                        message: "Document saved!",
                        document: doc
                    }))
                    .catch(err => errorHandler(res, err));
            }
        })
    } else {
        res.status(400).json({
            message: "Some fields are not provided!"
        })
    }
}

exports.patch = (req,res) => {
    const { tag } = req.body;
    var _update = { $set: {} };
    if(tag) _update.$set.tag = tag;
    
    Document.findOneAndUpdate(
        {$and: [{_id: req.params['_id']}, {uploadedBy: req.user._id}]},
        _update, { new: true }
    ).exec()
    .then(doc => res.status(200).json({
        message: "Document updated!",
        document: doc
    }))
    .catch(err => errorHandler(res,err));
}

exports.deleteDocument = (req,res) => {
    Document.findOneAndDelete({
        $and: [{_id: req.params['_id']}, {uploadedBy: req.user._id}]
    }).exec()
    .then(doc => {
        if(doc) {
            deleteS3(doc.key, (err,_) => {
                if(err) errorHandler(res,err);
                else {
                    res.status(200).json({
                        message: "Document deleted!",
                        document: doc
                    })
                }
            })
        } else {
            res.status(404).json({
                message: "Document already deleted and unauthorised!"
            })
        }
    })
    .catch(err => errorHandler(res,err));
}