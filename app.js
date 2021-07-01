const express = require("express");
const app = express();
const connectDB = require('./middleware/db')

const orgRouter = require('./api/routes/organizations');
const facultyRouter = require('./api/routes/faculties');
const studentsRouter = require('./api/routes/students');
const classesRouter = require('./api/routes/classes');
const documentsRouter = require('./api/routes/documents');
const assignmentsRouter = require("./api/routes/assignments");


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

app.get("/", (req, res) => res.render("home"));
app.get("/signin/:url", (req, res) => 
    res.render("signin", {data: req.params['url']}));
app.get("/register/:choice", (req,res) => 
    res.render("register", { choice: req.params['choice'] }));
app.get("/org/:domain", (req, res) => 
    res.render("orghome", {data: req.params['domain']}));
app.get("/batch/:_id", (req, res) => res.status(200).render("batch"));
app.get("/profile", (req,res) => res.status(200).render('profile'));
app.get("/error", (req, res) => res.render("error"));

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
app.use('/api/faculty', facultyRouter);
app.use('/api/student', studentsRouter);
app.use('/api/class', classesRouter);
app.use('/api/document', documentsRouter);
app.use('/api/assignment', assignmentsRouter);

// Handle 404 error
app.use((req, res) => {
    res.render("home")
    // let error = new Error("Route not implemented");
    // error.status = 404;
    // throw error;
})

// Handle errors
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message || "Unknown error occurred!"
    })
})

module.exports = app;