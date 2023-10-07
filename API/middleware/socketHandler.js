const ioSvr = require("socket.io");
const socketData = require('./socketData');


function initialiseSockets(server) {
    const io = ioSvr(server, {
        cors: { //cross orgin scripting
            origin: ("http://localhost:3000"), //origin set to whatever front end URL is - this is **mandatory**
        }
    });

    io.use(async (socket, next) => {
        //check if session already exists and is active
        const sessionID = socket.handshake.auth.sessionID;
        if (sessionID) {
            console.log("found session!");
            const session = socketData.findSession(sessionID);
            if (session) {
                socket.sessionID = sessionID;
                socket.userID = session.userID;
                socket.username = session.username;
                return next();
            }
        }
        //otherwise, create new session
        const username = socket.handshake.auth.username;
        if (!username) {
            return next(new Error("Invalid Username"));
        }
        //you can assign any attirubtes to the socket
        socket.sessionID = socketData.getRandomID();
        socket.userID = socketData.getRandomID();
        socket.username = username;
        next();
    });

    //this remains active for every connection, all the time.
    io.on("connection", (socket) => {
        console.log("Connection established. With username " + socket.username);
        //send session data to front
        socket.emit("session", {
            sessionID: socket.sessionID,
            userID: socket.userID,
        });

        const users = [];
        //broadcast all current socket users to all users
        //change this to pull only friends of user later
        for (let [id, socket] of io.of("/").sockets) {
            users.push({
                userID: id,
                username: socket.username,
            });
        }
        socket.emit("users", users);

        //refresh and notify all users of the new connection
        //socket.broadcast.emit will broadcast to all except the socket itself (the connection instance)
        //if you want to broadcast to all including itself, use io.emit
        socket.broadcast.emit("userconnected", {
            userID: socket.id,
            username: socket.username,
        });

        socket.on("privatemessage", ({ message, to }) => {
            console.log(message + " " + to);
            socket.to(to).emit("privatemessage", {
                message,
                from: socket.username
            });
        });

        //sub socket functions trigger on action

        socket.on('chatmsg', (message) => {
            io.emit('chatmsg', message, socket.username, socket.id);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

}

module.exports = {
    initialiseSockets
}