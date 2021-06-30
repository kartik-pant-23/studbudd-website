const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const { generate } = require("../../middleware/auth");

const facultySchema = mongoose.Schema({
    org: { type: mongoose.SchemaTypes.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true },
    password: { type: String, required: true, select: false },
    role: String,
    img_url: String,
    details: String,
    qualification: String,
    flag_show: { type: Boolean, default: false }
}, { timestamps: true });

facultySchema.methods.hashPassword = function (cb) {
    bcryptjs.hash(this.password, 10, (err, hash) => {
        if(err) return cb(err);
        else {
            this.password = hash;
            return cb(null);
        }
    })
}

facultySchema.methods.matchPassword = function (password, cb) {
    bcryptjs.compare(password, this.password, (err, isMatch) => {
        if(err) return cb(err);
        else return cb(err, isMatch);
    })
}

facultySchema.methods.generateToken = function (cb) {
    generate(this, cb);
}

module.exports = mongoose.model("Faculty", facultySchema);