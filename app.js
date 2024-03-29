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
app.get("/class/:_id", (req, res) => res.status(200).render("class"));
app.get("/subject/:_id", (req, res) => res.status(200).render("subject"));
app.get('/add_faculty', (req, res) => res.render("addFaculty"));
app.get('/sample_faculty', (req, res) => 
    res.download(__dirname+"/assets/teachers_data.csv"));
app.get('/sample_student', (req, res) => 
    res.download(__dirname+"/assets/students_data.csv"));

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
app.get('/sample_faculty', (req, res) => 
    res.download(__dirname+'/assets/teachers_data.csv'));
app.get('/sample_student', (req, res) => 
    res.download(__dirname+'/assets/students_data.csv'));
app.get("/test", (req, res) => res.render("test"));

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