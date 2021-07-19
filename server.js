const app = require("./app");
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const socketHandler = require("./api/routes/socket");
io.on("connection", socketHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
})