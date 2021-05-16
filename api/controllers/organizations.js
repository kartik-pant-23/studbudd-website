const Organization = require("../models/organization");
const User = require("../models/user")
const Class = require("../models/class")

const errorHandler = require("../../middleware/error_handler")
const emailHandler = require("../../middleware/emails");

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

const auth_error = new Error('Authentication failed!');
auth_error.status = 401;

// Get all general info about organization
exports.getInfo = (req, res) => {
    Organization.findById(req.user._id)
        .populate('faculty', 'name email')
        .exec()
        .then(org => {
            if (org) {
                res.status(200).json({
                    message: "Organization found!",
                    details: org
                })
            } else {
                var err = new Error('Not found!');
                err.status = 404;
                errorHandler(res, err);
            }
        })
        .catch(err => errorHandler(res, err));
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
                        errorHandler(res, err);
                    } else if (!matched || !org.verified) {
                        errorHandler(res, auth_error);
                    } else {
                        org.generateToken((err, token) => {
                            if (err) {
                                errorHandler(res, err)
                            } else {
                                res.status(200).json({
                                    message: "Login successful!",
                                    token: token,
                                    details: org
                                })
                            }
                        });
                    }
                })
            } else {
                errorHandler(res, auth_error);
            }
        }).catch(err => errorHandler(res, err));
}

// Email verification for registration
exports.verifyEmail = (req, res) => {
    const token = req.params.token;
    try {
        const decode = jwt.verify(token, `${process.env.JWT_KEY}`);
        Organization.findByIdAndUpdate(decode._id, { $set: { verified: true } }).exec()
            .then(_ => res.status(301).redirect("https://google.com/"))
            .catch(err => errorHandler(res, err));
    } catch (err) {
        errorHandler(res, err);
    }
}

// Forgot Password

// Get all teachers in an organization
exports.getFacultyDetail = (req, res) => {
    User.findById(req.params['_id'])
        .exec()
        .then(faculty => res.status(200).json(faculty))
        .catch(err => errorHandler(res, err));
}
// Add users in bulk by either passing in the array or .csv file
// If student, req.body.class defines the class he is to be added 
// Role is in params { faculty, student }
// Faculty can be added only by Organization
exports.addUsers = (req, res) => {

    function pushData(usersData, cb) {
        if (usersData && usersData.length > 0) {
            if (usersData[0].role == 'faculty') {
                Organization.findByIdAndUpdate(usersData[0].org, {
                    $push: { faculty: { $each: usersData } },
                    $inc: { facultyCount: usersData.length }
                }, { new: true }).exec()
                    .then(docs => {
                        cb(null, docs)
                    })
                    .catch(err => cb(err));
            } else {
                Class.findByIdAndUpdate(usersData[0].class, {
                    $push: { students: { $each: usersData } },
                    $inc: { studentsCount: usersData.length }
                }, { new: true }).exec()
                    .then(updatedClass => {
                        if(updatedClass) {
                            Organization.findByIdAndUpdate(updatedClass.org, {
                                $inc: { studentsCount: usersData.length }
                            }, { new: true }).exec()
                                .then(_ => {
                                    cb(null, updatedClass)
                                })
                                .catch(err => cb(err));
                        } else {
                            const err = new Error('Class not found!')
                            err.status = 404;
                            cb(err);
                        }
                    })
                    .catch(err => cb(err));
            }
        } else {
            const err = new Error('No users are found!')
            err.status = 404;
            cb(err);
        }
    }

    const role = req.params['role'];
    const orgDomain = req.body.orgDomain;
    if ((role == 'faculty' && req.user.role != 'org') ||
        (role == 'student' && req.body.class == null)) {
        errorHandler(res, auth_error);
    } else if (role != 'faculty' && role != 'student') {
        const err = new Error('Method not allowed!');
        err.status = 405;
        errorHandler(res, err);
    } else {
        const usersData = req.body.users;
        const users = usersData.map(obj => {
            const user = User({
                name: obj.name,
                email: obj.uid + `@${orgDomain}`,
                password: orgDomain.split('.')[0] || orgDomain,
                role: role
            })
            bcryptjs.genSalt(5).then(salt => {
                bcryptjs.hash(user.password, salt).then(hash => {
                    user.password = hash;
                }).catch(err => {
                    return errorHandler(res,err)
                })
            }).catch(err => {
                return errorHandler(res,err);
            })
            return user;
        })

        // Check if more users can be added, then only add
        Organization.findOne({ domain: orgDomain })
            .select('facultyCount studentsCount')
            .exec()
            .then(org => {
                const allowedFacultyCount = org.maxFacultyCount - org.facultyCount;
                const allowedStudentsCount = org.maxStudentsCount - org.studentsCount;

                if ((role == 'faculty' && usersData.length > allowedFacultyCount) ||
                    (role == 'student' && usersData.length > allowedStudentsCount)) {
                    res.status(409).json({
                        message: "Upgrade your pack to add more users!",
                        allowedFacultyCount: allowedFacultyCount,
                        allowedStudentsCount: allowedStudentsCount
                    })
                } else {
                    users.forEach(element => {
                        if (role == 'faculty') element.org = req.user._id;
                        else element.class = req.body.class;
                    });
                    User.insertMany(users)
                        .then(addedUsers => {
                            pushData(addedUsers, (err, docs) => {
                                if (err) errorHandler(res, err);
                                else {
                                    res.status(200).json({
                                        itemsCount: users.length,
                                        addedItemsCount: addedUsers.length,
                                        addedItems: addedUsers,
                                        updatedInfo: docs
                                    })
                                }
                            })
                        })
                        .catch(err => errorHandler(res, err));
                }
            })
            .catch(err => errorHandler(res, err));
    }
}
// Deleting a faculty
exports.deleteFaculty = (req, res) => {
    User.findByIdAndDelete(req.params['_id']).exec()
        .then(_ => {
            if(_) {
                Organization.findByIdAndUpdate(req.user._id, {
                    $pull: { faculty: req.params['_id'] },
                    $inc: { facultyCount: -1 }
                }, { new: true }).exec()
                    .then(org => res.status(200).json({
                        message: "Faculty deleted!",
                        updatedDetails: org
                    }))
                    .catch(err => errorHandler(res, err));
            } else {
                res.status(404).json({
                    message: "Item not found!"
                })
            }
        })
        .catch(err => errorHandler(res, err));
}

// Adding new batch
exports.addBatch = (req, res) => {
    Organization.findById(req.user._id).exec()
        .then(org => {
            if (org.batches.find(obj => { return obj.tag == req.body.tag })) {
                res.status(409).json({
                    message: "Conflict: Batch already exists!",
                    batches: org.batches
                })
            } else {
                req.body._id = new mongoose.Types.ObjectId();
                req.body.classes = [];
                org.updateOne({ $push: { batches: req.body } }, { new: true }).exec()
                    .then(update => {
                        if (update.ok == 1) {
                            res.status(200).json({
                                message: "Batch added!",
                                batch: req.body
                            })
                        } else {
                            res.status(500).json({
                                message: "Something went wrong!"
                            })
                        }
                    })
                    .catch(err => errorHandler(res, err));
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