const User = require("../models/user")
const errorHandler = require("../../middleware/error_handler")

const auth_error = new Error('Authentication failed!');
auth_error.status = 401;

exports.login = (req,res) => {
    User.findOne({email: req.body.email})
    .select('+password')
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
                                token: token
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