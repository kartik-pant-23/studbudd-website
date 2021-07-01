const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const { generate } = require("../../middleware/auth")

const studentSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true  },
    email: { type: String, unique: true, trim: true  },
    password: { type: String, select: false },
    role: { type: String, default: "student" },
    class: { type: mongoose.Types.ObjectId, ref: "Class", required: true }
}, { timestamps: true });

// Compare Password
studentSchema.methods.comparePassword = function (password, cb) {
    var user = this;
    bcryptjs.compare(password, user.password).then(matched => {
        return cb(null, matched);
    }).catch(err => {
        return cb(err);
    })
};

// Generate token
studentSchema.methods.generateToken = function (cb) {
    generate(this, cb);
}

module.exports = mongoose.model("Student", studentSchema)