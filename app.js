const express = require("express");
const app = express();
const connectDB = require('./middleware/db')
const ejs = require("ejs");

const orgRouter = require('./api/routes/organizations')
const usersRouter = require('./api/routes/users')
const classesRouter = require('./api/routes/classes')
const documentsRouter = require('./api/routes/documents')

const clientLoginRouter = require("./client/login")

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

app.use(express.static("public"));


// Allowing requests from all origins and all headers
// Setting allowed methods
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, DELETE, PATCH, GET')
        return res.status(200).json({})
    }
    next()
})

// Connect with database
connectDB();

//Frontend code

app.get("/", function (req, res) {
    res.render("home");
});
app.use("/signin", clientLoginRouter)
app.get("/register", function (req, res) {
    res.render("register");
});


//Backend code

app.get('/api', (req, res) => {
    res.status(200).json({
        message: "StudBudd server up and running!",
        version: process.env.VERSION,
        createdBy: process.env.AUTHOR,
        startedOn: process.env.STARTED_ON
    })
})
app.use('/api/org', orgRouter);
app.use('/api/user', usersRouter);
app.use('/api/class', classesRouter);
app.use('/api/document', documentsRouter);

// Handle 404 error
app.use((req, res) => {
    let error = new Error("Route not implemented");
    error.status = 404;
    throw error;
})

// Handle errors
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message || "Unknown error occurred!"
    })
})

module.exports = app;