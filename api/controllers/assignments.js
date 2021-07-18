const mongoose = require("mongoose");
const path = require("path");

const { uploadS3 } = require("../../middleware/files_upload");
const errorHandler = require("../../middleware/error_handler");
const Document = require("../models/document");
const Assignment = require("../models/assignment");

exports.uploadDoc = (req,res) => {
    const { title, description, marks, submissionDate, subject } = req.body;

    var file = req.file;
    const _id = new mongoose.Types.ObjectId(); // _id for document
    var ext = path.extname(file.originalname);
    file.originalname = req.user.domain + "/assignments/" + _id + "." + ext;

    uploadS3(req.user.domain, file, (err,url) => {
        if(err) errorHandler(res,err);
        else {
            const document = Document({
                _id: _id,
                tag: title,
                description: description,
                url: url,
                key: file.originalname,
                ref: subject,
                uploadedBy: req.user._id
            });
            document.save()
            .then(doc => {
                const assignment = Assignment({
                    title: title,
                    description: description,
                    subject: subject,
                    document: doc._id,
                    marks: marks,
                    submissionDate: submissionDate,
                    uploadedBy: req.user._id
                })
                assignment.save()
                .then(_assignment => res.status(200).json({
                    document: doc,
                    assignment: _assignment
                }))
                .catch(err => errorHandler(res,err));
            })
            .catch(err => errorHandler(res,err));
        }
    })
}

exports.uploadForm = (req, res) => {
    req.body.type = 1;
    req.body.uploadedBy = req.user._id;
    const assignment = Assignment(req.body);
    assignment.save()
    .then(_assignment => res.status(200).json(_assignment))
    .catch(err => errorHandler(res,err));
}

exports.update = (req,res) => {
    const { marks, submissionDate, questions } = req.body;
    const _update = { $set: {} };
    if(marks) _update.$set.marks = marks;
    if(submissionDate) _update.$set.submissionDate = new Date(submissionDate);
    if(questions) _update.$set.questions = questions;

    Assignment.findOneAndUpdate(
        {$and: [{_id: req.params['_id']}, {uploadedBy: req.user._id}]},
        _update, { new: true }
    ).exec()
    .then(_assignment => {
        if(_assignment)
            res.status(200).json({
                message: "Assignment updated!",
                assignment: _assignment
            })
        else
            res.status(404).json({
                message: "Unauthorized or assignment deleted!"
            })
    })
    .catch(err => errorHandler(res,err));
}

exports.delete = (req,res) => {
    Assignment.findOneAndDelete({
        $and: [{_id: req.params['_id']}, {uploadedBy: req.user._id}]
    }).exec()
    .then(del => {
        if(del) 
            res.status(200).json({
                message: "Assignment deleted!",
                doc: del
            })
        else
            res.status(404).json({
                message: "Assignment was not found!"
            })
    })
    .catch(err => errorHandler(res,err));
}