const router = require("express").Router();
const controller = require("../controllers/assignments");

const { authAllowFaculty } = require("../../middleware/auth")
const { uploadDoc } = require("../../middleware/files_upload");

router.post("/upload_doc", authAllowFaculty, uploadDoc, controller.uploadDoc);
router.post("/upload_form", authAllowFaculty, controller.uploadForm);
router.patch("/:_id", authAllowFaculty, controller.update);
router.delete("/:_id", authAllowFaculty, controller.delete);

module.exports = router;