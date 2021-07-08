const mongoose = require('mongoose');

const DocumentSchema = mongoose.Schema({
    tag: {type: String, default: "Untitled", trim: true },
    description: { type: String, trim: true },
    url: {type: String, required: true},
    key: {type: String, required: true},
    ref: {type: mongoose.SchemaTypes.ObjectId, required: true},
    uploadedBy: {type: mongoose.SchemaTypes.ObjectId, required: true}
}, {timestamps: true})

module.exports = mongoose.model("Document", DocumentSchema);