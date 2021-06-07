const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const { generate } = require("../../middleware/auth")

const organizationSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "org" },
    domain: { type: String, required: true, unique: true, trim: true  },
    email: { type: String, required: true, unique: true, trim: true  },
    password: { type: String, select: false },
    monthlyBill: { type: Number, required: true },
    maxFacultyCount: { type: Number, required: true },
    facultyCount: { type: Number, default: 0 },
    maxStudentsCount: { type: Number, required: true },
    studentsCount: { type: Number, default: 0 },
    maxAssignmentsCount: { type: Number, required: true },
    assignmentsCount: { type: Number, default: 0 },
    maxExamsCount: { type: Number, required: true },
    examsCount: { type: Number, default: 0 },
    maxDocumentsSize: { type: Number, required: true },
    documentsSize: { type: Number, default: 0 },
    verified: { type: Boolean, default: false, select: false },
    allowChangePassword: { type: Boolean, default: false, select: false },
    faculty: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    batches: [{
        tag: { type: String, required: true, unique: true, trim: true  },
        classes: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Class"
        }],
    }]
}, {timestamps: true});

// hash password before saving
organizationSchema.pre("save", function(next) {
    var org = this;
    
    bcryptjs.genSalt(5).then(salt => {
        bcryptjs.hash(org.password, salt).then(hash => {
            org.password = hash;
            next();
        }).catch(err => {
            return next(err);
        })
    }).catch(err => {
        return next(err);
    })
})

// Compare password
organizationSchema.methods.comparePassword = function (password, cb) {
    var org = this;
    bcryptjs.compare(password, org.password).then(matched => {
        return cb(null, matched);
    }).catch(err => {
        return cb(err);
    })
};

// Generate token
organizationSchema.methods.generateToken = function (cb) {
    generate(this, cb);
}

module.exports = mongoose.model("Organization", organizationSchema);