const ioSvr = require("socket.io");
const chatData = require('./chatData');
const friendshipController = require('../controllers/friendshipController')

function initialiseSockets(server) {
    const io = ioSvr(server, {
        cors: { //cross orgin scripting
            origin: ("https://main.d11izrd17dq8t7.amplifyapp.com"), //origin set to whatever front end URL is - this is **mandatory**
        }
    });

    //this remains active for every connection, all the time.
    io.on("connection", (socket) => {
        console.log("Connection established. Awaiting username.");

        socket.on("connectSocket", ({ accountID, username }) => {

            socket.accountID = accountID;
            socket.username = username;
            if (socket.accountID && socket.username) {
                socket.emit("connectionResponse", {
                    "response": "OK"
                });
                console.log("Connected with " + socket.accountID + " " + socket.username);
                for (let [accountID, globalSocket] of io.of("/").sockets) {
                    console.log(socket.accountID + " and " + globalSocket.accountID)
                    if (globalSocket.accountID) {
                        friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID).then((isFriend) => {
                            if (isFriend) {
                                console.log(socket.accountID + " and " + globalSocket.accountID + " Are friends!")
                                if (globalSocket.accountID != socket.accountID) {
                                    socket.to(globalSocket.id).emit("userConnected", {
                                        userID: socket.accountID,
                                        username: socket.username,
                                    });
                                }
                            }
                        });
                    }
                }
            }
            else {
                socket.emit("error", {
                    "error": "Connection Fail"
                });
            }

        });

        socket.on("getOnlineFriends", () => {
            //this notifies the socket of all friends currently online
            const friends = [];
            //grab all connections as globalsocket
            for (let [accountID, globalSocket] of io.of("/").sockets) {
                //add only valid friendships to the array
                console.log(socket.accountID + " and " + globalSocket.accountID)
                if (globalSocket.accountID) {
                    friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID).then((isFriend) => {
                        if (isFriend) {
                            if (globalSocket.accountID != socket.accountID) {
                                friends.push({
                                    //what data does front end need here? just sending this for now
                                    accountID: globalSocket.accountID
                                });
                            }
                        }
                    });

                }
            }
            socket.emit("onlineFriends", friends);
        })


        //if chat already connected, just get history
        //connect with chatID (should have from friendships)
        socket.on("connectChat", ({ chatID }) => {
            //join chat if not already joined
            console.log("checking chatid" + chatID);
            if (!socket.rooms.has(chatID)) {
                isValidID = chatData.isValidChatID(chatID)
                console.log("we're in the isvalid method now vaid is " + isValidID)
                if (isValidID) {
                    console.log("socket not already in room, joining room");
                    socket.join(chatID);
                }
                else {
                    socket.emit("error", {
                        "error": "ChatID not valid"
                    });
                }

            }
            else {
                socket.emit("error", {
                    "error": "Failed to join room"
                });
            }
        });

        socket.on("getMessages", ({ chatID }) => {
            console.log("checking messages for " + chatID)
            if (socket.rooms.has(chatID)) {
                console.log("socket in room, grabbing history");

                //grab top 10 message history for this chat
                chatData.getMessageHistory(chatID, 10).then(messages => {
                    console.log(messages);
                    socket.emit("messageHistory", messages);
                });

            }
            else {
                socket.emit("error", {
                    "error": "Fail - Socket is not connected to the chat specified."
                });
            }
        });
        //request top X messages from database
        socket.on("moreMessages", ({ chatID, num }) => {
            if (socket.rooms.has(chatID)) {
                console.log("socket in room, grabbing history");

                //grab top 10 message history for this chat
                chatData.getMessageHistory(chatID, num).then(messages => {
                    console.log(messages);
                    socket.emit("messageHistory", messages);
                });

            }
            else {
                socket.emit("error", {
                    "error": "Fail - Socket is not connected to the chat specified."
                });
            }
        });

        socket.on("sendMessage", ({ chatID, message }) => {
            let timestamp = new Date();

            if (socket.rooms.has(chatID)) {
                socket.to(chatID).emit("messageResponse", {
                    message,
                    from: socket.username,
                    timestamp: chatData.formatDate(timestamp),
                });
                chatData.saveMessage(message, socket.accountID, timestamp, chatID);
            }
            else {
                socket.emit("error", {
                    "error": "Fail - Socket is not connected to the chat specified."
                });
            }
        });

        socket.on('disconnect', () => {
            for (let [accountID, globalSocket] of io.of("/").sockets) {
                console.log(socket.accountID + " and " + globalSocket.accountID)
                if (globalSocket.accountID) {
                    friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID).then((isFriend) => {
                        if (isFriend) {
                            if (globalSocket.accountID != socket.accountID) {
                                socket.to(globalSocket.id).emit("userDisconnected", {
                                    userID: socket.accountID,
                                    username: socket.username,
                                });
                            }
                        }
                    });

                }
            }
        });

    });

}

module.exports = {
    initialiseSockets
}