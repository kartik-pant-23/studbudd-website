const jwt = require("jsonwebtoken");
const Faculty = require("../models/faculty");
const Student = require("../models/student");
const { insertChatItem, getChats } = require("../controllers/chats");

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

module.exports = (socket) => {
    socket.emit("auth");
    socket.on("auth", async data => {
        socket.join(data.reference);
        try {
            const decode = jwt.verify(data.token, process.env.JWT_KEY);
            const userData = await getUserData(decode);
            const chats = await getChats(data.reference, 0, 50);
            socket.emit("userData", {
                userData: userData,
                chats: chats.reverse()
            });
        } catch(err) {
            console.log(err);
            socket.emit("userData", { error: err });
        }
    });

    socket.on("chat", async (data) => {
        try {
            const savedMessage = await insertChatItem(data);
            socket.to(data.reference).emit("chat", savedMessage);
            socket.emit("chat", savedMessage);
        } catch (err) {
            console.log(err);
            socket.emit("chat", { error: err });
        }
    });

    socket.on("loadMoreChat", async ({reference, skipCount}) => {
        try {
            const moreChats = await getChats(reference, skipCount, 50);
            socket.emit("loadedChats", moreChats.reverse());
        } catch(err) {
            console.log(err);
            socket.emit("loadedChats", { error: err });
        }
    })
}