const mongoose = require("mongoose");
const { uploadS3, deleteS3 } = require("../../middleware/files_upload");

const Document = require('../models/document');
const Organization = require('../models/organization')
const Class = require('../models/class')

const errorHandler = require('../../middleware/error_handler');

exports.uploadDocument = (req, res) => {
    const _id = new mongoose.Types.ObjectId();
    const file = req.file;
    const fileExtension = req.file.originalname.split('.').reverse()[0];
    file.originalname = req.user.domain + '/' + _id + '.' + fileExtension;

    const { _orgId, _batchId, _classId, _subjectId } = req.body;

    var type = 0;
    if (_subjectId) {
        type = _classId ? 1 : 0;
    } else if (_classId) {
        type = 2;
    } else if (_batchId) {
        type = _orgId ? 3 : 0;
    } else if (_orgId) {
        type = 4;
    }

    function _saveInClass(_doc, _inSubject = false) {
        var _find = (_inSubject)
            ? { _id: _classId, "subjects._id": _subjectId }
            : { _id: _classId };
        var _update = { $push: (_inSubject) ? { "subjects.$.documents": _doc._id } : { documents: _doc._id } };
        Class.findOneAndUpdate(_find, _update, { new: true }).exec()
            .then(_class => res.status(200).json({
                message: "Document has been added!",
                addedDocument: _doc,
                updatedEntity: _class
            }))
            .catch(err => errorHandler(res, err));
    }
    function _saveInOrg(_doc, _inBatch = false) {
        var _find = (_inBatch)
            ? { _id: _orgId, "batches._id": _batchId }
            : { _id: _orgId };
        var _update = { $push: (_inBatch) ? { "batches.$.documents": _doc._id } : { documents: _doc._id } };
        Organization.findOneAndUpdate(_find, _update, { new: true }).exec()
            .then(_org => res.status(200).json({
                message: "Document has been added!",
                addedDocument: _doc,
                updatedEntity: _org
            }))
            .catch(err => errorHandler(res, err));
    }

    if (type != 0) {
        uploadS3(req.user.domain, file, (err, url) => {
            if (err) errorHandler(res, err);
            else {
                const document = Document({
                    _id: _id,
                    tag: req.body.tag,
                    key: file.originalname,
                    url: url,
                    type: type,
                    ref1: (_classId) ?_classId :_orgId,
                    ref2: (_subjectId) ?_subjectId :_batchId
                });

                document.save()
                    .then(doc => {
                        switch (type) {
                            case 1:
                                _saveInClass(doc, true);
                                break;
                            case 2:
                                _saveInClass(doc);
                                break;
                            case 3:
                                _saveInOrg(doc, true);
                                break;
                            case 4:
                                _saveInOrg(doc);
                                break;
                            default:
                                errorHandler(res, new Error());
                                break;
                        }
                    })
                    .catch(err => errorHandler(res, err));
            }
        })
    } else {
        res.status(400).json({
            message: "Some fields are not provided!"
        })
    }
}

exports.deleteDocument = (req,res) => {
    Document.findById(req.params['_id']).exec()
    .then(doc => {
        deleteS3(doc.key, (err,_) => {
            if(err)
                errorHandler(res,err);
            else {
                doc.remove()
                .then(doc => res.status(200).json({
                    message: "Item has been deleted!"
                }))
                .catch(err => errorHandler(res,err));
            }
        })
    })
}