const ioSvr = require("socket.io");
const chatData = require('./chatData');
const friendshipController = require('../controllers/friendshipController')

function initialiseSockets(server, frontEndpoint) {
    const io = ioSvr(server, {
        cors: { //cross orgin scripting
            origin: (frontEndpoint), //origin set to whatever front end URL is - this is **mandatory**
        }
    });

    //this remains active for every connection, all the time.
    io.on("connection", (socket) => {

        socket.on("connectSocket", ({ accountID, username }) => {

            socket.accountID = accountID;
            socket.username = username;
            socket.connectedGroupID = null;

            if (socket.accountID && socket.username) {
                socket.emit("connectionResponse", {
                    "response": "OK"
                });
                for (let [accountID, globalSocket] of io.of("/").sockets) {
                    if (globalSocket.accountID) {
                        friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID).then((isFriend) => {
                            if (isFriend) {
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

        socket.on("getOnlineFriends", async () => {
            //this notifies the socket of all friends currently online
            if(socket.accountID){
            const friends = [];
            const friendshipPromises = [];
            //grab all connections as globalsocket
            for (let [accountID, globalSocket] of io.of("/").sockets) {
                //add only valid friendships to the array
                if (socket.accountID && globalSocket.accountID) {
                    const friendshipPromise = friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID).then((isFriend) => {
                        if (isFriend) {
                            if (globalSocket.accountID != socket.accountID) {

                                friends.push(globalSocket.accountID);

                            }
                        }
                    });
                    friendshipPromises.push(friendshipPromise);
                }
            }
            await Promise.all(friendshipPromises);

            socket.emit("onlineFriends", friends);
        }
        })


        //if chat already connected, just get history
        //connect with chatID (should have from friendships)
        socket.on("connectChat", ({ chatID }) => {
            if(socket.accountID){
                if(!String(chatID).includes(String(socket.accountID))){
                    socket.emit("error", {
                        "error": "ChatID not valid"
                    });
                    return;
                }
                if(String(chatID).length != 8){


                }

            //join chat if not already joined
            if (!socket.rooms.has(chatID)) {
                isValid = chatData.isValidChatID(chatID, socket.accountID)
                    if (isValid) {
                        socket.join(chatID);
                    }
                    else {
                        socket.emit("error", {
                            "error": "ChatID not valid"
                        });
                    }

                

            }
            if (socket.rooms.has(chatID)) {
                socket.emit("connectChatResponse", {
                    "response": "OK"
                });
            }
        }
        });

        socket.on("getMessages", ({ chatID }) => {
            if(socket.accountID){

            if (socket.rooms.has(chatID)) {

                //grab top 10 message history for this chat
                chatData.getMessageHistory(chatID, 10).then(messages => {
                    socket.emit("messageHistory", messages);
                });

            }
            else {
                socket.emit("error", {
                    "error": "Fail - Socket is not connected to the chat specified."
                });
            }
        }
        });
        //request top X messages from database
        socket.on("moreMessages", ({ chatID, num }) => {
            if(socket.accountID){

            if (socket.rooms.has(chatID)) {

                //grab top 10 message history for this chat
                chatData.getMessageHistory(chatID, num).then(messages => {
                    socket.emit("messageHistory", messages);
                });

            }
            else {
                socket.emit("error", {
                    "error": "Fail - Socket is not connected to the chat specified."
                });
            }
        }
        });

        socket.on("sendMessage", ({ chatID, message }) => {
            if(socket.accountID){

            if(message.length > 50){
                socket.emit("error", {
                    "error": "Fail - Message too long."
                });
                return;
            }
            let timestamp = new Date().getTime();

            if (socket.rooms.has(chatID)) {
                socket.to(chatID).emit("messageResponse", {
                    message,
                    from: socket.accountID,
                    timestamp: timestamp,
                });
                chatData.saveMessage(message, socket.accountID, timestamp, chatID);
            }
            else {
                socket.emit("error", {
                    "error": "Fail - Socket is not connected to the chat specified."
                });
            }
        }
        });

        socket.on('disconnect', () => {
            if(socket.accountID){

            for (let [accountID, globalSocket] of io.of("/").sockets) {
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
        }
        });

        //group sockets

        socket.on("connectGroup", async ({ groupID }) => {
            if(socket.accountID){

            //checks two things:
            //1. is this a real group ID? and
            //2. is this account a member of the group?

   

            const isValidGroupID = await chatData.isValidGroupID(groupID, socket.accountID);

            if (isValidGroupID) {

                socket.emit("connectGroupResponse", {
                    "response": "Joined successfully"
                })

                //checks if group is already connected, and disconnects it if so
                if (socket.connectedGroupID) {
                    socket.emit("disconnectGroup");
                }

                socket.connectedGroupID = groupID;
            }
            else{
                socket.emit("error", {
                    "error": "GroupID not valid or user not in group."
                });
            }
        }
    });

                socket.on("connectChannel", async ({ channelID }) => {
                    if(socket.accountID){

                    if (channelID) {
                        if (!socket.rooms.has(channelID)) {
                            try {
                                const validChannel = await chatData.isValidChannelID(channelID, socket.connectedGroupID, socket.accountID);
                                if (validChannel) {
                                    socket.join(channelID);
                                    socket.emit("connectChannelResponse", {
                                        "response": "OK"
                                    });
                                } else {
                                    socket.emit("error", {
                                        "error": "Channel not valid or user does not have permission to view."
                                    });
                                }
                            } catch (err) {
                                socket.emit("connectChannelResponse", {
                                    "response": "Error joining channel"
                                });
                            }
                        }
                        else {
                            socket.emit("connectChannelResponse", {
                                "response": "Channel already connected."
                            });
                        }
                    }
                }
                });



                socket.on("getChannelMessages", ({ channelID }) => {
                    if(socket.accountID){

                    if (socket.rooms.has(channelID)) {

                        //grab top 10 message history for this chat
                        chatData.getChannelMessageHistory(channelID, 10).then(messages => {
                            socket.emit("messageHistory", messages);
                        });

                    }
                    else {
                        socket.emit("error", {
                            "error": "Fail - Socket is not connected to the chat specified."
                        });
                    }
                }
                });
                //request top X messages from database
                socket.on("moreChannelMessages", ({ channelID, num }) => {
                    if(socket.accountID){

                    if (socket.rooms.has(channelID)) {

                        //grab top 10 message history for this chat
                        chatData.getChannelMessageHistory(channelID, num).then(messages => {
                            socket.emit("messageHistory", messages);
                        });

                    }
                    else {
                        socket.emit("error", {
                            "error": "Fail - Socket is not connected to the chat specified."
                        });
                    }
                }
                });

                socket.on("sendChannelMessage", ({ channelID, message }) => {
                    if(socket.accountID){

                    if(message.length > 50){
                        socket.emit("error", {
                            "error": "Fail - Message too long."
                        });
                        return;
                    }
                    let timestamp = new Date().getTime();

                    if (socket.rooms.has(channelID)) {
                        socket.to(channelID).emit("channelMessageResponse", {
                            message,
                            from: socket.accountID,
                            username: socket.username,
                            timestamp: timestamp,
                        });
                        chatData.saveChannelMessage(message, socket.accountID, timestamp, channelID);
                    }
                    else {
                        socket.emit("error", {
                            "error": "Fail - Socket is not connected to the channel specified."
                        });
                    }
                }
                });


                //VOIP Channels

                socket.on('getCurrentUsers', async ({ channelID }) => {
                    if(socket.accountID){

                    
                    const currentUsers = [];
                    let roomSockets = io.sockets.adapter.rooms.get(channelID);

                    if (roomSockets) {
                        let socketArray = Array.from(roomSockets);

                        for (let socketID of socketArray) {
                            let rSocket = io.sockets.sockets.get(socketID);
                            if (rSocket && rSocket.username && rSocket.peerID) {
                                let user = {
                                    username: rSocket.username,
                                    peerID: rSocket.peerID,
                                    image: rSocket.image
                                };
                                currentUsers.push(user);
                            }
                        }

                    }
                    socket.emit("currentUsers", (currentUsers));

                }

                });

                socket.on('callResponse', ({ socketID, myPeerID }) => {
                    if(socket.accountID){

                    
                    socket.to(socketID).emit("callAnswered", {
                        peerID: myPeerID
                    });
                }
                });

                socket.on('joinVC', ({ channelID, peerID, image }) => {
                    if(socket.accountID){

                    socket.peerID = peerID;
                    socket.image = image;

                   
                    // //checking if socket is already in room.
                    if (!socket.rooms.has(channelID)) {

                        socket.join(channelID);
                        



                        socket.emit("updateVCStatus", {
                            "response": "joined channel"
                        });
                        //announce to all members of voice chat of the user joining and ask them to connect
                        socket.to(channelID).emit("userJoinVC", {
                            socketID: socket.id,
                            peerID: socket.peerID,
                            username: socket.username,
                            image: socket.image,
                        });

                    }
                    else {
                        socket.emit("error", {
                            "error": "VC already connected."
                        });
                    }
                }
                });

                socket.on('leaveVC', ({ channelID }) => {
                    if(socket.accountID){

                   
                    if (socket.rooms.has(channelID)) {
                        socket.to(channelID).emit("userLeftVC", {
                            peerID: socket.peerID
                        });
                        socket.leave(channelID);
                        socket.emit("updateVCStatus", {
                            "response": "left channel"
                        });

                    } 
                }
                });

                socket.on('switchVC', ({ channelID, newChannelID }) => {
                    if(socket.accountID){

                    if (socket.rooms.has(channelID)) {
                        isValidID = chatData.isValidChannelID(newChannelID)
                        if (isValidID) {
                            hasAccess = chatData.hasAccessToChannel(channelID, socket.accountID);
                            if (hasAccess) {
                                socket.leave(channelID);
                                socket.emit("updateVCStatus", {
                                    "response": "left channel"
                                });
                                socket.join(newChannelID);
                                socket.emit("updateVCStatus", {
                                    "response": "joined channel"
                                });
                                //announce to all members of voice chat of the user joining and ask them to connect
                                socket.to(newChannelID).emit("userJoinVC", {
                                    peerID: socket.accountID
                                });
                            }
                        }
                        else {
                            socket.emit("error", {
                                "error": "channelID not valid"
                            });
                        }
                    }
                    else {
                        socket.emit("error", {
                            "error": "VC not connected."
                        });
                    }
                }
                });

        socket.on("disconnectGroup", () => {
            socket.connectedGroupID = null;
        });


    
    });

}

module.exports = {
    initialiseSockets
}