const router = require("express").Router();
const { auth, authAllowOrg } = require('../../middleware/auth');

const controller = require("../controllers/organizations")

router.get('/', auth, controller.getInfo);
router.get('/details', auth, controller.orgDetails);

router.post('/register', controller.register);
router.get('/verify_email/:token', controller.verifyEmail);
router.post('/login', controller.login);

router.get('/batch/:_id', auth, controller.getBatchDetails)
router.post('/batch', authAllowOrg, controller.addBatch);
router.patch('/batch/:_id', authAllowOrg, controller.patchBatchDetails);
router.delete('/batch/:_id', authAllowOrg, controller.deleteBatch);

router.get('/faculty', authAllowOrg, controller.getAllFaculty);
router.delete('/faculty/:_id', authAllowOrg, controller.deleteFaculty);

module.exports = router;