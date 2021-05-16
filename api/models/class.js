const mongoose = require('mongoose');

const classSchema = mongoose.Schema({
    org: { type: mongoose.SchemaTypes.ObjectId, ref: "Organization", required: true },
    batch: { type: mongoose.SchemaTypes.ObjectId, required: true },
    tag: { type: String, required: true },
    subjects: [{
        name: { type: String, required: true },
        subjectCode: { type: String },
        coordinator: { 
            type: mongoose.SchemaTypes.ObjectId, 
            ref: "User" 
        }
    }],
    students: [{
        type: mongoose.SchemaTypes.ObjectId, 
        ref: "User"
    }],
    documents: [{
        type: mongoose.SchemaTypes.ObjectId, 
        ref: "Document"
    }]
}, {timestamps: true});

module.exports = mongoose.model('Class', classSchema);