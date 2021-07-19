const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
    sender: { type: mongoose.SchemaTypes.ObjectId, required: true },
    senderName: { type: String, required: true },
    reference: { type: mongoose.SchemaTypes.ObjectId, required: true },
    message: String,
    assignment: { type: mongoose.SchemaTypes.ObjectId, ref: "Assignment" },
    note: { type: mongoose.SchemaTypes.ObjectId, ref: "Document" },
    examination: { type: mongoose.SchemaTypes.ObjectId, ref: "Examination" }
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);