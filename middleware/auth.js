const jwt = require("jsonwebtoken");
const errorHandler = require("./error_handler");

exports.generate = (user, callback) => {
    jwt.sign(
        {
            _id: user._id,
            role: user.role,
            domain: user.domain || user.email.split('@')[1]
        },
        `${process.env.JWT_KEY}`,
        {expiresIn: '7d'},
        (err, token) => {
            if(err)
                return callback(err);
            else
                return callback(null, token);
        }
    );
}

exports.auth = (req, res, next) => {
    try {
        decode = jwt.verify(
        req.headers['token'],
        `${process.env.JWT_KEY}`);
        req.user = decode;
        next();
    } catch(error) {
        error.status = 401;
        errorHandler(res,error);
    }
}

exports.authAllowOrg = (req, res, next) => {
    try {
        decode = jwt.verify(
        req.headers['token'],
        `${process.env.JWT_KEY}`);
        req.user = decode;

        if(req.user.role == 'org')
            next();
        else 
            throw new Error('Restricted method!')
    } catch(error) {
        error.status = 401;
        errorHandler(res,error);
    }
}

exports.authAllowFaculty = (req, res, next) => {
    try {
        decode = jwt.verify(
        req.headers['token'],
        `${process.env.JWT_KEY}`);
        req.user = decode;
        
        if(req.user.role == 'org' || req.user.role == 'faculty')
            next();
        else 
            throw new Error('Restricted method!')
    } catch(error) {
        error.status = 401;
        errorHandler(res,error);
    }
}