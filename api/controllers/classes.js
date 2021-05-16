const mongoose = require('mongoose');
const Class = require('../models/class');

const errorHandler = require('../../middleware/error_handler');
const Organization = require('../models/organization');

// Add a new classes
exports.addClasses = (req, res) => {
    const classesToAdd = req.body.classes;
    const classes = [];

    classesToAdd.forEach(obj => {
        classes.push(Class({
            org: req.user._id,
            batch: req.params['_batchId'],
            tag: obj.tag,
            subjects: obj.subjects,
            students: obj.students
        }))
    })

    Class.insertMany(classes)
        .then(docs => {
            insertedClassesId = docs.map(obj => { return obj._id; })
            Organization.findOneAndUpdate(
                {
                    _id: req.user._id,
                    'batches._id': req.params['_batchId']
                },
                { $push: { 'batches.$.classes': { $each: insertedClassesId } } },
                { new: true }
            ).exec()
                .then(updatedOrg => res.status(200).json({
                    count: classes.length,
                    addedClassesCount: docs.length,
                    addedClasses: docs,
                    updatedOrg: updatedOrg
                }))
                .catch(err => errorHandler(res, err))
        })
        .catch(err => errorHandler(res, err));
}
// Get details of a class
exports.getClassDetails = (req, res) => {
    Class.findById(req.params['_id'])
        .populate('students subjects.coordinator', 'name email')
        .select('-org -batch')
        .exec()
        .then(details => res.status(200).json(details))
        .catch(err => errorHandler(res, err));
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