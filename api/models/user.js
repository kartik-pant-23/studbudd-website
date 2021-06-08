const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const Organization = require("./organization")

const { generate } = require("../../middleware/auth")

const userSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true  },
    email: { type: String, unique: true, trim: true  },
    password: { type: String, select: false },
    role: { type: String, required: true },
    org: { type: mongoose.Types.ObjectId, ref: "Organization" },
    class: { type: mongoose.Types.ObjectId, ref: "Class" }
}, { timestamps: true });

// Compare Password
userSchema.methods.comparePassword = function (password, cb) {
    var user = this;
    bcryptjs.compare(password, user.password).then(matched => {
        return cb(null, matched);
    }).catch(err => {
        return cb(err);
    })
};

// Generate token
userSchema.methods.generateToken = function (cb) {
    generate(this, cb);
}

module.exports = mongoose.model("User", userSchema)