const mongoose = require('mongoose');

const DocumentSchema = mongoose.Schema({
    tag: {type: String, required: true},
    url: {type: String, required: true},
    key: {type: String, required: true},
    batch: mongoose.Types.ObjectId,
    class: mongoose.Types.ObjectId
}, {timestamps: true})

module.exports = mongoose.model("Document", DocumentSchema);