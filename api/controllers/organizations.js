const Organization = require("../models/organization");
const Document = require("../models/document");
const Faculty = require("../models/faculty");

const errorHandler = require("../../middleware/error_handler")
const emailHandler = require("../../middleware/emails");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

const auth_error = new Error('Authentication failed!');
auth_error.status = 401;

// Get short info for home page
exports.getInfo = (req, res) => {
    const reqFields = 'name domain studentsCount maxStudentsCount documentsSize maxDocumentsSize batches dueDate';
    Organization.findById(req.user._id)
    .select(reqFields)
    .exec()
    .then(org => {
        if(org) {
            var dateNow = new Date();
            dateNow.setDate(dateNow.getDate()-5);
            if(org.dueDate.getTime() > dateNow.getTime()) {
                Document.find({ref: org._id}).select('tag').exec()
                .then(docs => {
                    res.status(200).json({
                        message: "Organization found!",
                        details: org,
                        documents: docs
                    });
                })
                .catch(err => errorHandler(res,err));
            } else {
                res.status(402).json({
                    message: "Monthly bill not paid! Services are getting stopped until next payment!",
                    dueDate: org.dueDate
                })
            }
        } else {
            res.status(404).json({
                message: "Organization not found!"
            });
        }
    })
    .catch(err => errorHandler(res,err));
}
// Get detailed info about organization
exports.orgDetails = (req,res) => {
    Organization.findById(req.user._id)
    .select('-batches')
    .exec()
    .then(org => {
        if(org) res.status(200).json(org);
        else res.status(404).json({ message: "Organization not found!" });
    })
    .catch(err => errorHandler(res,err));
}

// Register an organization
exports.register = function (req, res) {
    const organization = Organization(req.body);

    organization.save()
        .then(org => {
            emailHandler.createContent(org, 0, (err, email) => {
                if (err) {
                    errorHandler(res, err);
                } else {
                    emailHandler.sendMail(organization.email, email, (err, info) => {
                        if (err) {
                            errorHandler(res, err);
                        } else {
                            res.status(200).json({
                                message: "Verify email to get started!"
                            })
                        }
                    })
                }
            })
        })
        .catch(err => errorHandler(res, err));
}

// Allow login with either email or domain
exports.login = function (req, res) {
    Organization.findOne({ $or: [{ email: req.body.userId }, { domain: req.body.userId }] })
        .select('+password +verified -faculty -class')
        .exec()
        .then(org => {
            if (org) {
                org.comparePassword(req.body.password, (err, matched) => {
                    if (err) {
                        res.status(500).json({message: "Something went wrong!", debug: err});
                    } else if (!org.verified) {
                        res.status(401).json({message: "Check your email for verification link!"})
                    } else if (!matched) {
                        res.status(401).json({message: "Authentication failed!"})
                    } else {
                        org.generateToken((err, token) => {
                            if (err) {
                                res.status(500).json({message: "Something went wrong!", debug: err})
                            } else {
                                res.status(200).json({
                                    message: "Login successful!",
                                    token: token,
                                    domain: org.domain
                                })
                            }
                        });
                    }
                })
            } else {
                res.status(401).json({message: "Requested user was not found!"})
            }
        }).catch(err => res.status(500).json({message: "Something went wrong!", debug: err}));
}

// Email verification for registration
exports.verifyEmail = (req, res) => {
    const token = req.params.token;
    try {
        const decode = jwt.verify(token, `${process.env.JWT_KEY}`);
        Organization.findByIdAndUpdate(decode._id, { $set: { verified: true } }).exec()
            .then(_ => res.status(301).redirect(`${process.env.BASE_URL}/signin/org`))
            .catch(err => errorHandler(res, err));
    } catch (err) {
        errorHandler(res, err);
    }
}

// Forgot Password

// Adding new batch
exports.addBatch = (req, res) => {
    Organization.findById(req.user._id).exec()
        .then(org => {
            if(org) {
                if (org.batches.find(obj => { return obj.tag == req.body.tag })) {
                    res.status(409).json({
                        message: "Conflict: Batch already exists!",
                        batches: org.batches
                    })
                } else {
                    const batch = {
                        _id: new mongoose.Types.ObjectId(),
                        tag: req.body.tag,
                        classCount: 0
                    }
                    org.updateOne({ $push: { batches: batch } }, { new: true }).exec()
                        .then(update => {
                            if (update.ok == 1) {
                                res.status(200).json({
                                    message: "Batch added!",
                                    batch: batch
                                })
                            } else {
                                errorHandler(res,err);
                            }
                        })
                        .catch(err => errorHandler(res, err));
                }
            } else {
                res.status(404).json({ message: "Organization not found!" })
            }
        })
        .catch(err => errorHandler(res, err));
}
// Getting data about batch
exports.getBatchDetails = (req, res) => {
    Organization.findById(req.user._id)
        .select('batches')
        .exec()
        .then(org => {
            if (org) {
                res.status(200).json(org.batches.find(obj => {
                    return obj._id == req.params['_id']
                }))
            } else {
                res.status(404).json({
                    message: "Organization not found!"
                })
            }
        })
        .catch(err => errorHandler(res, err))
}
// Change name of a batch
exports.patchBatchDetails = (req, res) => {
    Organization.findById(req.user._id).exec()
        .then(org => {
            if (org.batches.find(obj => { return obj.tag == req.body.tag })) {
                res.status(409).json({
                    message: "Conflict: Batch already exists!",
                    batches: org.batches
                })
            } else {
                Organization.findOneAndUpdate({
                    _id: req.user._id,
                    'batches._id': req.params['_id']
                }, { $set: { 'batches.$.tag': req.body.tag } }, { new: true })
                    .exec()
                    .then(updatedOrg => {
                        res.status(200).json({
                            message: "Batch Tag updated!",
                            updatedBatch: updatedOrg.batches.find(obj => {
                                return obj._id == req.params['_id']
                            })
                        })
                    })
                    .catch(err => errorHandler(res, err));
            }
        })
        .catch(err => errorHandler(res, err))
}
// Delete a batch
exports.deleteBatch = (req, res) => {
    Organization.findByIdAndUpdate(req.user._id, {
        $pull: { batches: { _id: req.params._id } }
    }, { new: true }).exec()
        .then(org => res.status(200).json({
            message: "Batch deleted!",
            updatedDetails: org
        }))
        .catch(err => errorHandler(res, err));
}

// Faculty routes
exports.getAllFaculty = (req, res) => {
    Faculty.find({ org: req.user._id }).exec()
    .then(faculty => res.status(200).json({
        count: faculty.length,
        faculty: faculty
    }))
    .catch(err => error_handler(res,err));
}

exports.deleteFaculty = (req, res) => {
    Faculty.findOneAndDelete(
        { $and: [{ _id: req.params['_id'] }, { org: req.user._id }] }
    )
    .exec()
    .then(faculty => {
        if(!faculty) res.status(404).json({ message: "User doesn't exist!" });
        else {
            Organization.findByIdAndUpdate(
                req.user._id,
                { $inc: { facultyCount: -1 } }
            ).exec()
            .then(_ => {
                res.status(200).json({ message: "Faculty deleted!" });
            })
            .catch(err => errorHandler(res, err));
        }
    })
    .catch(err => errorHandler(res, err));
}