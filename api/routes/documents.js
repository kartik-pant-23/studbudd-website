const router = require('express').Router()

const { authAllowFaculty, auth } = require('../../middleware/auth');
const { uploadDoc } = require('../../middleware/files_upload');
const controller = require('../controllers/documents')

router.get('/:_id', auth, controller.getDocumentDetails);
router.get('/all/:ref', auth, controller.getDocuments);
router.post('/upload', authAllowFaculty, uploadDoc, controller.uploadDocument);
router.patch('/:_id', authAllowFaculty, controller.patch);
router.delete('/:_id', authAllowFaculty, controller.deleteDocument);

module.exports = router;