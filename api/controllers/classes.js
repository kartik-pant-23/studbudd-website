const mongoose = require('mongoose');
const Class = require('../models/class');

const errorHandler = require('../../middleware/error_handler');
const Organization = require('../models/organization');
const Document = require('../models/document');

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
            .catch(err => errorHandler(res,err));
        })
        .catch(err => errorHandler(res,err));
    })
    .catch(err => errorHandler(res,err));
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
    .catch(err => errorHandler(res,err));
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
    if (req.body.students) {
        update.$push.students = { $each: req.body.students };
    }
    Class.findOneAndUpdate(
        {
            org: req.user._id,
            _id: req.params['_id']
        },
        update,
        { new: true })
        .select('-org -batch')
        .exec()
        .then(updatedClass => {
            res.status(200).json({
                message: "Class updated!",
                updatedClass: updatedClass
            })
        })
        .catch(err => errorHandler(res, err));
}
// Delete class 
exports.deleteClass = (req, res) => {
    Class.findById(req.params['_id']).exec()
        .then(obj => {
            if (obj) {
                const { org, batch, _id } = obj;
                obj.deleteOne({ _id: _id }, (err, _) => {
                    if (err) {
                        errorHandler(res, err);
                    } else {
                        // Remove entry from Organization as well
                        Organization.findOneAndUpdate(
                            { _id: org, 'batches._id': batch },
                            { $pull: { 'batches.$.classes': _id } },
                            { new: true }
                        ).exec()
                            .then(updatedOrg => {
                                res.status(200).json({
                                    message: "Class deleted",
                                    updatedOrg: updatedOrg
                                })
                            })
                            .catch(err => errorHandler(res, err));
                    }
                })
            } else {
                res.status(404).json({
                    message: "Class does not exist"
                })
            }
        })
        .catch(err => errorHandler(res, err));
}