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
                console.log(messages);
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
    else{
        return false;
    }

        //return false in an error occurs
    } catch (err) {
        return false;
    }
}

async function isValidChannelID(channelID, accountID) {

    try {
        console.log("checking channel ID is valid now with channel " + channelID + " " + accountID);
        if(channelID){
        // sql.connect(sqlConfig.returnServerConfig()).then(async function () {
        //     const query = `SELECT ChannelID from Channels WHERE Channel = ${channelID}`;


        //     const result = await sql.query(query);

        //     if (result.rowsAffected > 0) {
        //         console.log("ChatID in db")
        //         return true;
        //     }
        //     else {
        //         // //return false if not found
        //         return false;
        //     }
        // });
        //we dont have a DB check yet
        return true;
    }
    else{
        return false;
    }

        //return false in an error occurs
    } catch (err) {
        return false;
    }
}



module.exports = {
    generateChatID,
    getMessageHistory,
    saveMessage,
    formatDate,
    isValidChatID,
    isValidChannelID,
};