const jwt = require("jsonwebtoken");
const Faculty = require("../models/faculty");
const Student = require("../models/student");

async function getUserData(decode) {
    try {
        switch(decode.role) {
            case 'org': 
                return {_id: decode._id, name: "Organization-Admin"};
            case 'student': 
                const student = await Student.findById(decode._id).select('name');
                return student;
            case 'faculty': 
                const faculty = Faculty.findById(decode._id).select('name');
                return faculty;
            default: throw new Error();
        }
    } catch(err) {
        throw err;
    }
}

function saveMessage(message, callback) {
    return callback(null, message);
}

module.exports = (socket) => {
    // Authorize user and send chat data
    socket.emit("auth");
    socket.on("auth", async data => {
        socket.join(data.subjectId);
        try {
            const decode = await jwt.verify(data.token, process.env.JWT_KEY);
            const userData = await getUserData(decode);
            socket.emit("userData", userData);
        } catch(err) {
            console.log(err);
            socket.emit("userData", { error: err });
        }
    });

    socket.on("chat", (data) => {
        saveMessage(data, (err, savedMessage) => {
            if(err) socket.emit("chat-self", { error: err });
            else {
                socket.to(data.subjectId).emit("chat", savedMessage);
                // socket.broadcast.emit("chat", savedMessage);
                socket.emit("chat", savedMessage);
            }
        })
    })
}