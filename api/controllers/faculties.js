const error_handler = require("../../middleware/error_handler");
const Faculty = require("../models/faculty");
const Organization = require("../models/organization");
const Class = require("../models/class");
const bcryptjs = require("bcryptjs");
const path = require("path");

const { uploadS3 } = require("../../middleware/files_upload");

exports.register = (req, res) => {
    const usersData = req.body.users;

    // Check if we can add more faculty
    Organization.findById(req.user._id)
    .select('maxFacultyCount facultyCount')
    .exec()
    .then(org => {
        const facultySpace = org.maxFacultyCount - org.facultyCount;
        if(usersData.length > facultySpace) {
            res.status(409).json({
                message: "Update pack to add more faculty!"
            })
        } else {
            const facultyData = usersData.map(user => {
                const faculty = Faculty({
                    org: req.user._id,
                    name: user.name,
                    email: user.uid+`@${req.user.domain}`,
                    password: req.user.domain.split('.')[0] || req.user.domain,
                    role: "faculty"
                });
                faculty.password = bcryptjs.hashSync(faculty.password, 10);
                return faculty;
            });
            
            // Inserting faculty into database
            Faculty.insertMany(facultyData, { ordered: false }, (err, addedFaculty) => {
                if(err) addedFaculty = err.insertedDocs;
                // Updating faculty count in organization
                Organization.findOneAndUpdate(
                    { _id: req.user._id },
                    { $inc: { facultyCount: addedFaculty.length }}
                ).exec()
                .then(_ => {
                    res.status(200).json({
                        queuedItemsCount: usersData.length,
                        addedItemsCount: addedFaculty.length,
                        addedFaculty: addedFaculty
                    });
                })
                .catch(err => error_handler(res,err));
            });
        }
    })
    .catch(err => error_handler(res,err));
}

exports.login = (req,res) => {
    // TODO
    // Add a field in org so that we can check if bill paid
    // Only then show the results
    Faculty.findOne({ email: req.body.email })
    .select('+password')
    .exec()
    .then(faculty => {
        if(faculty) {
            faculty.matchPassword(req.body.password, (err, isMatch) => {
                if(err) error_handler(res, err);
                else {
                    if(isMatch) {
                        faculty.generateToken((err, token) => {
                            if(err) error_handler(res, err);
                            else res.status(200).json({
                                message: "Login successful!",
                                token: token
                            });
                        })
                    } else {
                        res.status(401).json({ message: "Authentication failed!" })
                    }
                }
            })
        } else {
            res.status(404).json({
                message: "User does not exist!"
            })
        }
    })
    .catch(err => error_handler(res,err));
}

exports.getDetails = (req, res) => {
    // TODO
    // Add a field in org so that we can check if bill paid
    // Only then show the results
    Faculty.findById(req.user._id)
    .exec()
    .then(faculty => {
        if(faculty) {
            Class.find({ 'subjects.coordinator': faculty._id }).exec()
            .then(classes => {
                res.status(200).json({
                    faculty: faculty,
                    classes: classes
                });
            })
            .catch(err => error_handler(res, err));
        } else {
            res.status(404).json({ message: "User does not exist!" });
        }
    })
    .catch(err => error_handler(res, err));
}

exports.changePassword = (req, res) => {
    Faculty.findById(req.user._id)
    .select('+password')
    .exec()
    .then(faculty => {
        if(faculty) {
            faculty.matchPassword(req.body.oldPassword, (err, isMatch) => {
                if(err) error_handler(res, err);
                else {
                    if(isMatch) {
                        faculty.password = bcryptjs.hashSync(req.body.newPassword, 10);
                        Faculty.findByIdAndUpdate(
                            faculty._id,
                            { $set: { password: faculty.password } }
                        ).exec()
                        .then(_ => res.status(200).json(_))
                        .catch(err => error_handler(res, err));
                    } else {
                        res.status(401).json({ message: "Authentication failed!" })
                    }
                }
            })
        } else {
            res.status(404).json({ message: "User does not exist!" });
        }
    })
    .catch(err => error_handler(res,err));
}

exports.patch = (req, res) => {
    const { qualification, details, newPassword, flag_show } = req.body;
    const file = req.file;
    if(file) {
        const extName = path.extname(file.originalname);
        file.originalname = req.user.domain+'/faculty/'+req.params['_id']+extName;
    }
    Faculty.findById(req.params['_id'])
    .select('org _id')
    .exec()
    .then(faculty => {
        if(faculty) {
            if(faculty._id==req.user._id || faculty.org==req.user._id) {
                var update = {};
                if(qualification) update.qualification = qualification;
                if(details) update.details = details;
                if(newPassword && req.user.role == 'org') update.password = bcryptjs.hashSync(newPassword, 10);
                if(flag_show) update.flag_show = flag_show;
                if(file) {
                    uploadS3(req.user.domain, file, (err, url) => {
                        if(err) error_handler(res, err);
                        else {
                            update.img_url = url;
                            Faculty.findByIdAndUpdate(faculty._id, update, {new: true})
                            .exec()
                            .then(updatedFaculty => res.json(updatedFaculty))
                            .catch(err => error_handler(res, err));
                        }
                    })
                } else {
                    Faculty.findByIdAndUpdate(faculty._id, update, {new: true})
                    .exec()
                    .then(updatedFaculty => res.json(updatedFaculty))
                    .catch(err => error_handler(res, err));
                }
            } else {
                res.status(401).json({ message: "Authentication failed!" });
            }
        } else {
            res.status(404).json({ message: "User does not exist!" });
        }
    })
    .catch(err => error_handler(res, err));
}