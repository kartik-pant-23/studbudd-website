const Student = require("../models/student")
const Organization = require("../models/organization")
const Class = require("../models/class");
const Document = require("../models/document");

const bcryptjs = require("bcryptjs");

const error_handler = require("../../middleware/error_handler");

const auth_error = new Error('Authentication failed!');
auth_error.status = 401;

exports.register = (req, res) => {
    const usersData = req.body.users;

    Organization.findOne({ domain: req.user.domain })
        .select('maxStudentsCount studentsCount')
        .exec()
        .then(org => {
            const studentSpace = org.maxStudentsCount - org.studentsCount;
            if (usersData.length > studentSpace) {
                res.status(409).json({
                    message: "Update pack to add more students!"
                })
            } else {
                const studentsData = usersData.map(user => {
                    const student = Student({
                        name: user.name,
                        email: user.uid + `@${req.user.domain}`,
                        password: req.user.domain.split('.')[0] || req.user.domain,
                        role: "student",
                        class: req.body.classId
                    });
                    student.password = bcryptjs.hashSync(student.password, 10);
                    return student;
                });

                Student.insertMany(studentsData, { ordered: false }, (err, addedStudents) => {

                    if (err) addedStudents = err.insertedDocs;
                    console.log(addedStudents);
                    Organization.findOneAndUpdate(
                        { domain: req.user.domain },
                        { $inc: { studentsCount: addedStudents.length } }
                    ).exec()
                        .then(_ => {
                            Class.findByIdAndUpdate(req.body.classId, { $inc: { studentsCount: addedStudents.length } }).exec()
                                .then(__ => res.status(200).json({
                                    queuedItemsCount: usersData.length,
                                    addedItemsCount: addedStudents.length,
                                    addedStudents: addedStudents
                                }))
                                .catch(err => error_handler(res, err));
                        })
                        .catch(err => error_handler(res, err));
                });
            }
        })
        .catch(err => error_handler(res, err));
}

exports.login = (req, res) => {
    Student.findOne({ email: req.body.email })
        .select('+password')
        .exec()
        .then(user => {
            if (user) {
                user.comparePassword(req.body.password, (err, matched) => {
                    if (err) {
                        error_handler(res, err);
                    } else if (!matched) {
                        error_handler(res, auth_error);
                    } else {
                        user.generateToken((err, token) => {
                            if (err) {
                                error_handler(res, err);
                            } else {
                                res.status(200).json({
                                    message: "Login successful!",
                                    token: token
                                })
                            }
                        })
                    }
                })
            } else {
                res.status(404).json({ message: "User does not exist!" });
            }
        })
        .catch(err => error_handler(res, err));
}

exports.getInfo = (req, res) => {
    Student.findById(req.user._id)
        .select('name email class')
        .populate({
            path: "class",
            populate: {
                path: "subjects.coordinator",
                model: "Faculty",
                select: "name"
            },
            select: "tag subjects"
        })
        .exec()
        .then(user => {
            Document.find({ ref: user.class._id }).exec()
            .then(docs => {
                res.status(200).json({
                    user: {
                        name: user.name,
                        email: user.email
                    },
                    class: user.class,
                    documents: docs
                })
            })
            .catch(err => error_handler(res, err));
        })
        .catch(err => error_handler(res, err));
}