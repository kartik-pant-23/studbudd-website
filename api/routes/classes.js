const router = require('express').Router();
const { authAllowOrg, authAllowFaculty } = require('../../middleware/auth');

const controller = require('../controllers/classes')

router.post('/:_batchId', authAllowOrg, controller.addClasses);
router.get('/:_id', controller.getClassDetails);
router.patch('/:_id', authAllowFaculty, controller.updateClass);
router.delete('/:_id', authAllowOrg, controller.deleteClass);

module.exports = router;