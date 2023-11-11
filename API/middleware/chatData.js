const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');
const format = require('date-fns/format');


//gets chatid for 1-1 chat between users.
function generateChatID(user1, user2) {
    const nums = [user1, user2];
    nums.sort((a, b) => a - b);
    const result = nums.join('');

    return parseInt(result);
}

async function getMessageHistory(chatID, num) {
    return new Promise(async (resolve, reject) => {
        try {
            let messages = null;
            sql.connect(sqlConfig.returnServerConfig()).then(async function () {

                const result = await sql.query('SELECT TOP ' + num + ' * FROM Messages WHERE ChatID = \'' + chatID + '\' ORDER BY TimeSent DESC');
                messages = result.recordsets;
                resolve(messages);

            });
        }
        catch (err) {
            console.log(err.message);
            reject(err);
        }
    });

}

async function saveMessage(message, accountID, timestamp, currentChatID) {
    try {
        console.log(timestamp);
        sql.connect(sqlConfig.returnServerConfig()).then(async function () {

            //if there isn't an existing friend request, add friendship into the database as pending
            result = await sql.query`insert into messages (ChatID, MessageBody, SenderID, TimeSent)
            Values (${currentChatID}, ${message}, ${accountID}, ${timestamp})`
            if (result.recordsets.rowsAffected > 0) {
                return Promise.resolve(true)
            }
            else {
                return Promise.resolve(false)
            }

        })
    }
    catch (err) {
        console.log(err.message);
        return Promise.resolve(false);
    }
}

function formatDate(date) {
    return format(date, 'dd/MM/yyyy HH:mm');
}

async function isValidChatID(chatID, accountID) {

    try {
        console.log("checking chat ID is valid now with chatid " + chatID);
        if(chatID){
        sql.connect(sqlConfig.returnServerConfig()).then(async function () {
            const query = `SELECT FriendshipID from Friendships WHERE FriendshipID = ${chatID} AND RequesterID = ${accountID} OR AddresseeID = ${accountID}`;


            const result = await sql.query(query);

                if (result.rowsAffected > 0) {
                    console.log("ChatID in db")
                    return true;
                }
                else {
                    // //return false if not found
                    return false;
                }
            });
        }
        else {
            return false;
        }

        //return false in an error occurs
    } catch (err) {
        return false;
    }
}



async function hasAccessToChannel(channelID, accountID){
    try {
        if (channelID) {
            sql.connect(sqlConfig.returnServerConfig()).then(async function () {
                const query = `SELECT MemberID from ChannelMembers WHERE ChannelID = ${channelID} AND MemberID = ${accountID}`;


                const result = await sql.query(query);

                if (result.rowsAffected > 0) {
                    return true;
                }
                else {
                    // //return false if not found
                    return false;
                }
            });
        }
        else {
            return false;
        }

        //return false in an error occurs
    } catch (err) {
        return false;
    }
}




//group functions

async function isValidGroupID(groupID, accountID) {
    try {
        if (!groupID) {
            return false;
        }

        const connection = await sql.connect(sqlConfig.returnServerConfig());
        const query = `SELECT GroupID from Groups WHERE GroupID = ${groupID}`;
        const result = await connection.query(query);

        if (result.rowsAffected > 0) {
            console.log("groupID in db");
            const inGroup = await isInGroup(groupID, accountID);
            return inGroup;
        } else {
            return false;
        }
    } catch (err) {
        return false;
    }
}

async function isInGroup(groupID, accountID) {
    try {
        if (!groupID) {
            return false;
        }

        const connection = await sql.connect(sqlConfig.returnServerConfig());
        const query = `SELECT MemberID from GroupMembers WHERE GroupID = ${groupID} AND AccountID = ${accountID}`;
        const result = await connection.query(query);

        if (result.rowsAffected > 0) {
            console.log("account is a member of the group in db");
            return true;
        } else {
            return false;
        }
    } catch (err) {
        return false;
    }
}


async function isValidChannelID(channelID, groupID, accountID) {
    try {
        if (!channelID) {
            return false;
        }

        const connection = await sql.connect(sqlConfig.returnServerConfig());
        const query = `SELECT Channels.ChannelID FROM Channels  
        WHERE Channels.GroupID = ${groupID} AND Channels.ChannelID = ${channelID}`;
        const result = await connection.query(query);

        console.log(result.rowsAffected);

        if (result.rowsAffected > 0) {
            console.log("Channel in db");
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err)
        return false;
    }
}

async function saveChannelMessage(message, accountID, timestamp, currentChatID) {
    try {
        console.log(timestamp);
        sql.connect(sqlConfig.returnServerConfig()).then(async function () {

            //if there isn't an existing friend request, add friendship into the database as pending
            result = await sql.query`insert into channelMessages (ChannelID, MessageBody, SenderID, TimeSent)
            Values (${currentChatID}, ${message}, ${accountID}, ${timestamp})`
            if (result.recordsets.rowsAffected > 0) {
                return Promise.resolve(true)
            }
            else {
                return Promise.resolve(false)
            }

        })
    }
    catch (err) {
        console.log(err.message);
        return Promise.resolve(false);
    }
}

async function getChannelMessageHistory(channelID, num) {
    return new Promise(async (resolve, reject) => {
        try {
            let messages = null;
            sql.connect(sqlConfig.returnServerConfig()).then(async function () {

                const result = await sql.query('SELECT TOP ' + num + ' * FROM ChannelMessages WHERE ChannelID = \'' + channelID + '\' ORDER BY TimeSent DESC');
                messages = result.recordsets;
                resolve(messages);

            });
        }
        catch (err) {
            console.log(err.message);
            reject(err);
        }
    });

}

module.exports = {
    generateChatID,
    getMessageHistory,
    saveMessage,
    formatDate,
    isValidChatID,
    isValidChannelID,
    hasAccessToChannel,
    isValidGroupID,
    saveChannelMessage,
    getChannelMessageHistory

};