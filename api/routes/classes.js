const router = require('express').Router();
const { auth, authAllowOrg, authAllowFaculty } = require('../../middleware/auth');

const controller = require('../controllers/classes')

router.get('/batch/:_batchId', auth, controller.getClassesInBatch);
router.post('/:_batchId', authAllowOrg, controller.addClass);
// router.get('/:_id', controller.getClassDetails);
router.patch('/:_id', authAllowFaculty, controller.updateClass);
router.delete('/:_id', authAllowOrg, controller.deleteClass);

module.exports = router;