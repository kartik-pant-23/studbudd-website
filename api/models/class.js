const mongoose = require('mongoose');
const Organization = require("./organization")

const classSchema = mongoose.Schema({
    batch: { type: mongoose.SchemaTypes.ObjectId, required: true },
    tag: { type: String, required: true, trim: true  },
    subjects: [{
        name: { type: String, required: true, trim: true },
        subjectCode: { type: String },
        coordinator: { 
            type: mongoose.SchemaTypes.ObjectId, 
            ref: "Faculty" 
        },
    }],
    studentsCount: { type: Number, default: 0 }
}, {timestamps: true});

classSchema.pre('save', function (next) {
    var _obj = this;
    if(_obj.batch && _obj.tag) {
        Organization.findOneAndUpdate(
            { "batches._id": _obj.batch },
            { $inc: { 'batches.$.classCount': 1 } }
        ).exec()
        .then(_ => next())
        .catch(err => next(err));
    } else {
        next(new Error("Missing required fields!"));
    }
})

module.exports = mongoose.model('Class', classSchema);