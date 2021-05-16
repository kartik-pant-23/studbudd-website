const mongoose = require("mongoose");
const { uploadS3, deleteS3 } = require("../../middleware/files_upload");

const Document = require('../models/document');
const Organization = require('../models/organization')
const Class = require('../models/class')

const errorHandler = require('../../middleware/error_handler')

exports.uploadDocument = (req, res) => {
    const _id = new mongoose.Types.ObjectId();
    const file = req.file;
    const fileExtension = req.file.originalname.split('.').reverse()[0];
    file.originalname = req.user.domain + '/' + _id + '.' + fileExtension;

    uploadS3(req.user.domain, file, (err, url) => {
        if (err) errorHandler(res, err);
        else {
            const { _batchId, _classId } = req.body;

            const document = Document({
                _id: _id,
                tag: req.body.tag,
                key: file.originalname,
                url: url,
                class: _classId,
                batch: _batchId
            })

            document.save()
                .then(doc => {
                    if (_batchId) {
                        Organization.findOneAndUpdate({
                            domain: req.user.domain,
                            'batches._id': _batchId
                        }, {
                            $push: { 'batches.$.documents': doc._id }
                        }, { new: true }).exec()
                            .then(_ => {
                                if (_) res.status(200).json({
                                    message: "Document saved!", document: doc
                                });
                                else errorHandler(res, new Error());
                            })
                            .catch(err => errorHandler(res,err));
                    } else if (_classId) {
                        Class.findByIdAndUpdate(_classId, 
                            { $push: { documents: doc._id } },
                            { new: true }).exec()
                            .then(_ => {
                                if (_) res.status(200).json({
                                    message: "Document saved!", document: doc
                                });
                                else errorHandler(res, new Error());
                            })
                            .catch(err => errorHandler(res, err));
                    } else {
                        Organization.findOneAndUpdate({
                            domain: req.user.domain
                        }, {
                            $push: { documents: doc._id }
                        }, { new: true }).exec()
                            .then(_ => {
                                if (_) res.status(200).json({
                                    message: "Document saved!", document: doc
                                });
                                else errorHandler(res, new Error());
                            })
                            .catch(err => errorHandler(res, err));
                    }
                })
                .catch(err => errorHandler(res, err));
        }
    })
}

exports.deleteDocument = (req, res) => {
    Document.findById(req.params['_id']).exec()
    .then(doc => {
        deleteS3(doc.key, (err, _) => {
            if(err) errorHandler(res,err);
            else {
                Document.findByIdAndDelete(doc._id).exec()
                .then(deleted => {
                    if(deleted) {
                        if(doc.class) {
                            Class.findByIdAndUpdate(doc.class, {
                                $pull: { documents: doc._id }
                            }).exec()
                            .then(_ => res.status(200).json({
                                message: "Item deleted!",
                                deletedObject: doc
                            }))
                            .catch(err => errorHandler(res,err));
                        } else if(doc.batch) {
                            Organization.findOneAndUpdate(
                                { domain: req.user.domain, 'batches._id': doc.batch },
                                { $pull: {'batches.$.documents': doc._id} },
                                { new: true }
                            ).exec()
                            .then(_ => res.status(200).json({
                                message: "Item deleted!",
                                deletedObject: doc
                            }))
                            .catch(err => errorHandler(res,err));
                        } else {
                            Organization.findOneAndUpdate(
                                { domain: req.user.domain },
                                { $pull: {documents: doc._id} },
                                { new: true }
                            ).exec()
                            .then(_ => res.status(200).json({
                                message: "Item deleted!",
                                deletedObject: doc
                            }))
                            .catch(err => errorHandler(res,err));
                        }
                    } else
                        res.status(404).json({message: "Item not found!"})
                }) 
                .catch(err => errorHandler(res,err));
            }
        })
    })
    .catch(err => errorHandler(res,err));
}