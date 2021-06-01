const mongoose = require('mongoose');
const Organization = require('../models/organization')
const Class = require('../models/class')

const DocumentSchema = mongoose.Schema({
    tag: {type: String, required: true},
    url: {type: String, required: true},
    key: {type: String, required: true},
    type: {type: Number, required: true},
    ref1: {type: mongoose.SchemaTypes.ObjectId, required: true},
    ref2: mongoose.SchemaTypes.ObjectId
}, {timestamps: true})

DocumentSchema.pre('remove', function(next) {
    const _doc = this;

    function _removeFromClass(_inSubject=false) {
        var _find = (_inSubject)
            ? { _id: _doc.ref1, "subjects._id": _doc.ref2 }
            : { _id: _doc.ref1 };
        var _update = { $pull: (_inSubject) ? { "subjects.$.documents": _doc._id } : { documents: _doc._id } };
        Class.findOneAndUpdate(_find, _update, { new: true }).exec()
            .then(_ => next())
            .catch(err => next(err));
    }
    function _removeFromOrg(_inBatch=false) {
        var _find = (_inBatch)
            ? { _id: _doc.ref1, "batches._id": _doc.ref2 }
            : { _id: _doc.ref1 };
        var _update = { $pull: (_inBatch) ? { "batches.$.documents": _doc._id } : { documents: _doc._id } };
        Organization.findOneAndUpdate(_find, _update, { new: true }).exec()
            .then(_ => next())
            .catch(err => next(err));
    }

    switch(_doc.type) {
        case 1:
            _removeFromClass(true); break;
        case 2:
            _removeFromClass(); break;
        case 3:
            _removeFromOrg(true); break;
        case 4:
            _removeFromOrg(); break;
        default:
            next(new Error());
    }
})

module.exports = mongoose.model("Document", DocumentSchema);