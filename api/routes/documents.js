const router = require('express').Router()

const { authAllowFaculty } = require('../../middleware/auth');
const { uploadDoc } = require('../../middleware/files_upload');
const controller = require('../controllers/documents')

router.post('/upload', authAllowFaculty, uploadDoc, controller.uploadDocument);
router.delete('/delete/:_id', authAllowFaculty, controller.deleteDocument);

module.exports = router;