const router = require("express").Router();
const { auth } = require('../../middleware/auth')

const controller = require('../controllers/users')

router.post('/login', controller.login);
router.get('/', auth, controller.getUserData);

module.exports = router;