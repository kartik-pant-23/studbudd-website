const Class = require('../models/class');
const Organization = require('../models/organization');
const Document = require('../models/document');
const Student = require("../models/student");
const Faculty = require("../models/faculty");

const error_handler = require('../../middleware/error_handler');
const faculty = require('../models/faculty');

exports.getClassesInBatch = (req,res) => {
    Organization.findOne(
        {"batches._id": req.params['_batchId']}
    ).select('batches')
    .exec()
    .then(org => {
        var batch = org.batches.find(obj => obj._id == req.params['_batchId']);
        Class.find({batch: req.params['_batchId']})
        .select('tag subjects studentsCount')
        .exec()
        .then(data => {
            Document.find({ref: req.params['_batchId']})
            .select('tag')
            .exec()
            .then(docs => res.status(200).json({
                _batchId: batch._id,
                tag: batch.tag,
                classCount: batch.classCount,
                classes: data,
                documents: docs
            }))
            .catch(err => error_handler(res,err));
        })
        .catch(err => error_handler(res,err));
    })
    .catch(err => error_handler(res,err));
}

// Add a new class
exports.addClass = (req, res) => {
    const { tag, subjects } = req.body;
    const classObject = Class({
        tag: tag,
        subjects: subjects,
        batch: req.params['_batchId']
    });
    classObject.save()
    .then(data => res.status(200).json(data))
    .catch(err => error_handler(res,err));
}

// Get details of a class
exports.getClassDetails = (req, res) => {
    Class.findById(req.params['_id'])
    .select('tag subjects')
    .populate("subjects.coordinator", "name")
    .exec()
    .then(classDetails => {
        if(classDetails) {
            Student.find({ class: req.params['_id'] })
            .select('name email')
            .exec()
            .then(students => {
                Document.find({ ref: classDetails._id }).select('tag').exec()
                .then(docs => {
                    res.status(200).json({
                        tag: classDetails.tag,
                        subjects: classDetails.subjects,
                        students: students,
                        documents: docs
                    })
                })
                .catch(err => error_handler(res, err));
            })
            .catch(err => error_handler(res, err));
        } else {
            res.status(404).json({ message: "Class does not exist!" });
        }
    })
    .catch(err => error_handler(res, err));
}

// Update class
exports.updateClass = (req, res) => {
    const update = { $set: {}, $push: {} };
    if (req.body.newName) {
        update.$set = { tag: req.body.newName };
    }
    if (req.body.subjects) {
        update.$push.subjects = { $each: req.body.subjects };
    }
    Class.findOneAndUpdate(
        {_id: req.params['_id'] },
        update,
        { new: true })
        .select('-batch')
        .exec()
        .then(updatedClass => {
            if(updatedClass) {
                res.status(200).json({
                    message: "Class updated!",
                    updatedClass: updatedClass
                })
            } else {
                res.status(404).json({ message: "Class does not exist!" });
            }
        })
        .catch(err => error_handler(res, err));
}

// Get a subject details
exports.getSubjectDetails = (req, res) => {
    const subjectId = req.params['_id'];
    Class.findOne({ 'subjects._id': subjectId })
    .select('subjects')
    .populate('subjects.coordinator')
    .exec()
    .then(({subjects}) => {
        const subject = Array.from(subjects).find(subject => subject._id == subjectId);
        Faculty.find({ email: { $regex: `@${req.user.domain}` }})
        .select('name email img_url')
        .exec()
        .then(faculty => {
            res.status(200).json({
                subject: subject,
                faculty: faculty
            });
        })
        .catch(err => error_handler(res, err));
    })
    .catch(err => error_handler(res, err));
}
// Update a subjects details
exports.patchSubject = (req, res) => {
    const subjectId = req.params['_id'];
    const { name, subjectCode, coordinator } = req.body;

    const update = { };
    if(name) update['subjects.$.name'] = name;
    if(subjectCode) update['subjects.$.subjectCode'] = subjectCode;
    if(coordinator && req.user.role == 'org') update['subjects.$.coordinator'] = coordinator;

    Class.findOneAndUpdate(
        { 'subjects._id': subjectId },
        { $set: update },
        { new: true }
    )
    .populate("subjects.coordinator", "name email")
    .exec()
    .then(updateClass => res.status(200).json(updateClass))
    .catch(err => error_handler(res, err));
}

// Delete class 
exports.deleteClass = (req, res) => {
    Class.findByIdAndDelete(req.params['_id'])
    .then(obj => {
        if(obj) {
            // Delete students
            Student.deleteMany({ class: obj._id })
            .then(delRes => {
                // Update organization info
                Organization.findOneAndUpdate(
                    { 'batches._id': obj.batch },
                    { $inc: {
                        'batches.$.classCount': -1,
                        'studentsCount': -1*delRes.deletedCount
                    }},
                    { new: true }
                ).then(_ => res.status(200).json({ message: "Class deleted!" }))
                .catch(err => error_handler(res, err));
            })
            .catch(err => error_handler(res, err));
        }
        else {
            res.status(404).json({ message: "Class doesn't exist!" });
        }
    })
    .catch(err => error_handler(res, err));
}