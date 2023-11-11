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
        console.log("Connection established. Awaiting username.");

        socket.on("connectSocket", ({ accountID, username }) => {

            socket.accountID = accountID;
            socket.username = username;
            socket.connectedGroupID = null;

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

        socket.on("getOnlineFriends", async () => {
            //this notifies the socket of all friends currently online
            const friends = [];
            const friendshipPromises = [];
            //grab all connections as globalsocket
            for (let [accountID, globalSocket] of io.of("/").sockets) {
                //add only valid friendships to the array
                console.log(socket.accountID + " and " + globalSocket.accountID)
                if (socket.accountID && globalSocket.accountID) {
                    console.log("Checking friends for getonline friends");
                    const friendshipPromise = friendshipController.isActiveFriend(socket.accountID, globalSocket.accountID).then((isFriend) => {
                        console.log(isFriend);
                        if (isFriend) {
                            console.log("was true, running")
                            if (globalSocket.accountID != socket.accountID) {
                                console.log("socket not me, running")

                                friends.push(globalSocket.accountID);

                            }
                        }
                    });
                    friendshipPromises.push(friendshipPromise);
                }
            }
            await Promise.all(friendshipPromises);
            console.log("emitting friends: ");
            for (i = 0; i < friends.length; i++) {
                console.log(friends[i]);
            }
            socket.emit("onlineFriends", friends);
        })


        //if chat already connected, just get history
        //connect with chatID (should have from friendships)
        socket.on("connectChat", ({ chatID }) => {
            //join chat if not already joined
            console.log("checking chatid" + chatID);
            if (!socket.rooms.has(chatID)) {
                isValidID = chatData.isValidChatID(chatID, socket.accountID)
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
            if (socket.rooms.has(chatID)) {
                socket.emit("connectChatResponse", {
                    "response": "OK"
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
            let timestamp = new Date().getTime();

            if (socket.rooms.has(chatID)) {
                socket.to(chatID).emit("messageResponse", {
                    message,
                    from: socket.username,
                    timestamp: timestamp,
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

        //group sockets

        socket.on("connectGroup", async ({ groupID }) => {

            //checks two things:
            //1. is this a real group ID? and
            //2. is this account a member of the group?

            //testing!!!!!!!
            //groupID = 3;
            console.log(groupID)

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


                socket.on("connectChannel", async ({ channelID }) => {
                    if (channelID) {
                        console.log("received connection req for " + channelID)
                        console.log("groupID is " + socket.connectedGroupID)
                        if (!socket.rooms.has(channelID)) {
                            try {
                                const validChannel = await chatData.isValidChannelID(channelID, socket.connectedGroupID, socket.accountID);
                                console.log(validChannel)
                                if (validChannel) {
                                    console.log("socket not already in group room, joining room");
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
                });



                socket.on("getChannelMessages", ({ channelID }) => {
                    console.log("checking messages for " + channelID)
                    if (socket.rooms.has(channelID)) {
                        console.log("socket in room, grabbing history");

                        //grab top 10 message history for this chat
                        chatData.getChannelMessageHistory(channelID, 10).then(messages => {
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
                socket.on("moreChannelMessages", ({ channelID, num }) => {
                    if (socket.rooms.has(channelID)) {
                        console.log("socket in room, grabbing history");

                        //grab top 10 message history for this chat
                        chatData.getChannelMessageHistory(channelID, num).then(messages => {
                            console.log(messages);
                            socket.emit("channelMessageHistory", messages);
                        });

                    }
                    else {
                        socket.emit("error", {
                            "error": "Fail - Socket is not connected to the chat specified."
                        });
                    }
                });

                socket.on("sendChannelMessage", ({ channelID, message }) => {
                    let timestamp = new Date().getTime();

                    if (socket.rooms.has(channelID)) {
                        socket.to(channelID).emit("channelMessageResponse", {
                            message,
                            from: socket.username,
                            timestamp: timestamp,
                        });
                        chatData.saveChannelMessage(message, socket.accountID, timestamp, channelID);
                    }
                    else {
                        socket.emit("error", {
                            "error": "Fail - Socket is not connected to the channel specified."
                        });
                    }
                });


                //VOIP Channels

                socket.on('getCurrentUsers', async ({ channelID }) => {
                    console.log("getting users in channel " + channelID);
                    console.log(io.sockets.adapter.rooms.get(channelID))
                    const currentUsers = [];
                    let roomSockets = io.sockets.adapter.rooms.get(channelID);

                    if (roomSockets) {
                        let socketArray = Array.from(roomSockets);

                        for (let socketID of socketArray) {
                            let rSocket = io.sockets.sockets.get(socketID);
                            console.log(rSocket.username);
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
                    console.log(currentUsers);
                    socket.emit("currentUsers", (currentUsers));



                });

                socket.on('callResponse', ({ socketID, myPeerID }) => {
                    console.log("got call response, redirecting peerID to other party");
                    console.log(myPeerID);
                    socket.to(socketID).emit("callAnswered", {
                        peerID: myPeerID
                    });
                });

                socket.on('joinVC', ({ channelID, peerID, image }) => {
                    socket.peerID = peerID;
                    socket.image = image;

                    console.log(socket.id);

                    // console.log(socket.rooms);
                    // console.log(socket.accountID);
                    // console.log(channelID);
                    // //checking if socket is already in room.
                    if (!socket.rooms.has(channelID)) {
                        //     isValidID = chatData.isValidChannelID(channelID)
                        //     if (isValidID) {
                        //         hasAccess = chatData.hasAccessToChannel(channelID, socket.accountID);
                        //         if (hasAccess) {
                        socket.join(channelID);
                        console.log("joined channel");
                        console.log(channelID);



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
                        //         }
                        //     }
                        //     else {
                        //         socket.emit("error", {
                        //             "error": "channelID not valid"
                        //         });
                        //     }
                    }
                    else {
                        socket.emit("error", {
                            "error": "VC already connected."
                        });
                    }
                });

                socket.on('leaveVC', ({ channelID }) => {
                    console.log("Leaving: " + channelID);
                    console.log(socket.rooms);
                    if (socket.rooms.has(channelID)) {
                        socket.to(channelID).emit("userLeftVC", {
                            peerID: socket.peerID
                        });
                        socket.leave(channelID);
                        socket.emit("updateVCStatus", {
                            "response": "left channel"
                        });

                    } else {
                        console.log("room not found");
                    }
                });

                socket.on('switchVC', ({ channelID, newChannelID }) => {
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
                });




            }
            else {
                socket.emit("error", {
                    "error": "Invalid Group ID or permissions insufficient"
                })
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