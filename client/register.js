const router = require("express").Router();
const fetch = require("node-fetch");
const error_handler = require("../middleware/error_handler");
const errorHandler = require("../middleware/error_handler");

router.get("/", (req, res) => res.render("register"));
router.post("/", (req, res) => {
    var monthlyBill, maxFacultyCount, maxStudentsCount, maxAssignmentsCount, maxExamsCount, maxDocumentsSize;
    switch (req.body.selectPack) {
        case 1:
            monthlyBill = 0;
            maxFacultyCount = 2;
            maxStudentsCount = 50;
            maxAssignmentsCount = 5;
            maxDocumentsSize = 256 * 1024;
            maxExamsCount = 5;
            break;

        case 3:
            monthlyBill = 999;
            maxFacultyCount = 20;
            maxStudentsCount = 500;
            maxAssignmentsCount = 20;
            maxDocumentsSize = 5 * 1024 * 1024;
            maxExamsCount = 20;
            break;

        default:
            monthlyBill = 499;
            maxFacultyCount = 10;
            maxStudentsCount = 250;
            maxAssignmentsCount = 10;
            maxDocumentsSize = 2 * 1024 * 1024;
            maxExamsCount = 10;
            break;

    }
    req.body.monthlyBill = monthlyBill;
    req.body.maxFacultyCount = maxFacultyCount;
    req.body.maxDocumentsSize = maxDocumentsSize;
    req.body.maxStudentsCount = maxStudentsCount;
    req.body.maxAssignmentsCount = maxAssignmentsCount;
    req.body.maxExamsCount = maxExamsCount;

    fetch(`${process.env.BASE_URL}/api/org/register`, {
        method: 'POST',
        body: JSON.stringify(req.body),
        headers: { 'Content-Type': 'application/json' }
    }).then(response => {

        if (response.status == 200) {
            res.status(200).render("secrets");
        } else {
            res.status(401).render("register", { error: true })
        }
    })

});

module.exports = router;