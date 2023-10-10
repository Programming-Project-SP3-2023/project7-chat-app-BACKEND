const ioSvr = require("socket.io");
const chatData = require('./chatData');
const friendshipController = require('../controllers/friendshipController')

function initialiseSockets(server) {
    const io = ioSvr(server, {
        cors: { //cross orgin scripting
            origin: ("http://localhost:3000"), //origin set to whatever front end URL is - this is **mandatory**
        }
    });

    //called on socket.connect()
    io.use(async (socket, next) => {
        const accountID = socket.handshake.auth.accountID;
        console.log(accountID);

        //you can assign any attirubtes to the socket
        next();
    });

    //this remains active for every connection, all the time.
    io.on("connection", (socket) => {
        console.log("Connection established. With username " + socket.username);
        let currentChatID = null;

        const friends = [];
        //grab all connections as globalsocket
        for (let [accountID, globalSocket] of io.of("/").sockets) {
            //add only valid friendships to the array
            console.log(socket.accountID + " and "+ globalSocket.accountID)
            if(friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID)){
                friends.push({
                    accountID: accountID,
                    username: globalSocket.username,
                });
        }
        }
        socket.emit("online-friends", friends);

        //need to send chat history for current user



        //refresh and notify all users of the new connection
        //socket.broadcast.emit will broadcast to all except the socket itself (the connection instance)
        //if you want to broadcast to all including itself, use io.emit
        socket.broadcast.emit("user-connected", {
            userID: socket.id,
            username: socket.username,
        });
        //new
        socket.on("connect-chat", ({accountID, friendAccountID}) => {
            //if socket is currently in a chat, leave the chat
            if(currentChatID){
                socket.leave(currentChatID);
                currentChatID = null;
            }
            currentChatID = chatData.generateChatID(accountID,friendAccountID);
            if(currentChatID){
            socket.join(currentChatID);
            }
            else{
                next(new Error("Error joining chat"));
            }
        })

        socket.on("private-message", ({ message }) => {
            if(currentChatID){
                socket.to(currentChatID).emit("private-message", {
                    message,
                    from: socket.username
                });
            }
            else{
                next(new Error("No chat selected"));
            }
        });



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