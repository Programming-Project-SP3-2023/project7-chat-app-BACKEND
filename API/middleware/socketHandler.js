const ioSvr = require("socket.io");
const chatData = require('./chatData');
const friendshipController = require('../controllers/friendshipController')

function initialiseSockets(server) {
    const io = ioSvr(server, {
        cors: { //cross orgin scripting
            origin: ("http://localhost:3000"), //origin set to whatever front end URL is - this is **mandatory**
        }
    });

    //TESTING
    chatData.testFunctions();

    //called on socket.connect()
    io.use(async (socket, next) => {
        socket.accountID = socket.handshake.auth.accountID;
        socket.username = socket.handshake.auth.username;
        next();
    });

    //this remains active for every connection, all the time.
    io.on("connection", (socket) => {
        console.log("Connection established. With username " + socket.username);
        let currentChatID = null;

        //alerts all currently connected users on this socket's connection
        //use to update online status dynamically 
        socket.broadcast.emit("userConnected", {
            userID: socket.accountID,
            username: socket.username,
        });

        socket.on("getOnlineFriends", () => {
            //this notifies the socket of all friends currently online
            const friends = [];
            //grab all connections as globalsocket
            for (let [accountID, globalSocket] of io.of("/").sockets) {
                //add only valid friendships to the array
                console.log(socket.accountID + " and " + globalSocket.accountID)
                if (friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID)) {
                    friends.push({
                        //what data does front end need here? just sending this for now
                        accountID: globalSocket.accountID
                    });
                }
            }
            socket.emit("onlineFriends", friends);
        })



        //connect with chatID (should have from friendships)
        socket.on("connectChat", ({ chatID }) => {
            //if socket is currently in a chat, leave the chat
            if (currentChatID) {
                socket.leave(currentChatID);
                currentChatID = null;
            }
            //join chat
            currentChatID = chatID;
            if (currentChatID) {
                socket.join(currentChatID);
                //grab message history for this chat
                let messages = chatData.getMessageHistory(currentChatID);
                socket.emit("messageHistory", messages);
            }
            else {
                next(new Error("Error joining chat"));
            }
        })

        socket.on("privateMessage", ({ message, timestamp }) => {
            if (currentChatID) {
                socket.to(currentChatID).emit("messageResponse", {
                    message,
                    from: socket.username,
                    timestamp: timestamp,
                });
                chatData.saveMessage(message, socket.accountID, timestamp, currentChatID);
            }
            else {
                next(new Error("No chat selected"));
            }
        });

        socket.on("typing", (data) => socket.broadcast.emit("typingResponse", data));

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

}

module.exports = {
    initialiseSockets
}