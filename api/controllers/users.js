const User = require("../models/user")
const errorHandler = require("../../middleware/error_handler")

const auth_error = new Error('Authentication failed!');
auth_error.status = 401;

exports.login = (req,res) => {
    User.findOne({email: req.body.email})
    .select('+password')
    .populate({
        path: "class",
        populate: [{
            path: "subjects.coordinator",
            model: "User",
            select: "name"
        }, {
            path: "org",
            model: "Organization",
            select: "documents name email batches._id batches.tag batches.documents",
        }],
        select: "subjects documents org tag batch"
    })
    .exec()
    .then(user => {
        if(user) {
            user.comparePassword(req.body.password, (err, matched) => {
                if(err) {
                    errorHandler(res, err);
                } else if(!matched) {
                    errorHandler(res, auth_error);
                } else {
                    user.generateToken((err, token) => {
                        if(err) {
                            errorHandler(res, err);
                        } else {
                            res.status(200).json({
                                message: "Login successful!",
                                token: token,
                                user: user
                            })
                        }
                    })
                }
            })
        } else {
            errorHandler(res, auth_error);
        }
    })
    .catch(err => errorHandler(res, err));
}

exports.getUserData = (req,res) => {
    User.findById(req.user._id)
    .populate({
        path: "class",
        populate: [{
            path: "subjects.coordinator",
            model: "User",
            select: "name"
        }, {
            path: "org",
            model: "Organization",
            select: "documents name email domain batches._id batches.tag batches.documents",
        }],
        select: "subjects documents org tag batch"
    })
    .exec()
    .then(user => res.status(200).json(user))
    .catch(err => errorHandler(res,err));
}