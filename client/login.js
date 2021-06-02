const router = require("express").Router();
const fetch = require("node-fetch");

router.get("/", (req, res) => res.render("signin", { error: false }));
router.post("/", (req, res) => {
    const { username, password } = req.body;

    const data = {
        userId: username,
        password: password
    };

    fetch(`${process.env.BASE_URL}/api/org/login`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    }).then(response => {

        if (response.status == 200) {
            res.status(200).render("secrets");
        } else {
            res.status(401).render("signin", { error: true })
        }
    })

});

module.exports = router;