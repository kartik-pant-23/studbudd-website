const mongoose = require('mongoose');

const classSchema = mongoose.Schema({
    org: { type: mongoose.SchemaTypes.ObjectId, ref: "Organization", required: true },
    batch: { type: mongoose.SchemaTypes.ObjectId, required: true },
    tag: { type: String, required: true, trim: true  },
    subjects: [{
        name: { type: String, required: true, trim: true },
        subjectCode: { type: String },
        coordinator: { 
            type: mongoose.SchemaTypes.ObjectId, 
            ref: "User" 
        },
    }],
    students: [{
        type: mongoose.SchemaTypes.ObjectId, 
        ref: "User"
    }]
}, {timestamps: true});

module.exports = mongoose.model('Class', classSchema);