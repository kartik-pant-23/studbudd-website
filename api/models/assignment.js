const mongoose = require("mongoose");

const AssignmentSchema = mongoose.Schema({
    document: mongoose.SchemaTypes.ObjectId,
    subject: {type: mongoose.SchemaTypes.ObjectId, required: true},
    marks: { type: Number, default: 0 },
    type: { type: Number, default: 0 }, // type:0-> documents, 1-> Typed Questions
    questions: [{
        question: {type: String, trim: true},
        type: { type: Number, default: 0 },
        options: [{type: String, trim: true}]
    }],
    submissionDate: { type: Date, required: true },
    uploadedBy: { type: mongoose.SchemaTypes.ObjectId, required: true }
}, {timestamps: true});

module.exports = mongoose.model("Assignment", AssignmentSchema);