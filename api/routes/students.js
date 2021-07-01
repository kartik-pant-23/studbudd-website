const router = require("express").Router();
const { auth, authAllowFaculty } = require('../../middleware/auth');
const { upload, get_data } = require("../../middleware/files_upload");

const controller = require('../controllers/students')

router.post('/register', authAllowFaculty, upload, get_data, controller.register);
router.post('/login', controller.login);
router.get('/', auth, controller.getInfo);

module.exports = router;