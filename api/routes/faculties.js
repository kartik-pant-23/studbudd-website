const router = require("express").Router();
const { authAllowOrg, authAllowFaculty } = require("../../middleware/auth");
const { upload, get_data, uploadDoc } = require("../../middleware/files_upload");
const controller = require("../controllers/faculties");

router.post('/register', authAllowOrg, upload, get_data, controller.register);
router.post('/login', controller.login);

router.get('/', authAllowFaculty, controller.getDetails);
router.post('/change_password', authAllowFaculty, controller.changePassword);
router.patch('/:_id', authAllowFaculty, uploadDoc, controller.patch);

module.exports = router;