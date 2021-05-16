const express = require("express");
const app = express();
const connectDB = require('./middleware/db')

const orgRouter = require('./api/routes/organizations')
const usersRouter = require('./api/routes/users')
const classesRouter = require('./api/routes/classes')
const documentsRouter = require('./api/routes/documents')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Allowing requests from all origins and all headers
// Setting allowed methods
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    if(req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, DELETE, PATH, GET')
        return res.status(200).json({})
    }
    next()
  })

// Connect with database
connectDB();

app.get('/api', (req,res) => {
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
app.use((req,res) => {
    let error = new Error("Route not implemented");
    error.status = 404;
    throw error;
})

// Handle errors
app.use((err,req,res,next) => {
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message || "Unknown error occurred!"
    })
})

module.exports = app;