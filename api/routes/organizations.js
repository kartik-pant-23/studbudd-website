const router = require("express").Router();
const { auth, authAllowFaculty, authAllowOrg } = require('../../middleware/auth');

const controller = require("../controllers/organizations")

const { upload, get_data } = require('../../middleware/files_upload');

router.get('/', auth, controller.getInfo);

router.post('/register', controller.register);
router.get('/verify_email/:token', controller.verifyEmail);
router.post('/login', controller.login);

router.get('/batch/:_id', auth, controller.getBatchDetails)
router.post('/batch', authAllowFaculty, controller.addBatch);
router.patch('/batch/:_id', authAllowFaculty, controller.patchBatchDetails);
router.delete('/batch/:_id', authAllowOrg, controller.deleteBatch);

// Add users -> {faculty, student}
router.post('/:role', authAllowFaculty, controller.addUsers);
router.post('/bulk/:role', authAllowFaculty, upload, get_data, controller.addUsers);

router.delete('/faculty/:_id', authAllowOrg, controller.deleteFaculty);

module.exports = router;