const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');


//gets chatid for 1-1 chat between users.
function generateChatID(user1, user2) {
    const nums = [user1, user2];
    nums.sort((a, b) => a - b);
    const result = numbers.join('');

    return parseInt(result);
}

function getMessageHistory(chatID) {
    try {
        sql.connect(sqlConfig.returnServerConfig()).then(async function () {

            const result = await sql.query('SELECT * FROM Messages WHERE ChatID = \'' + chatID + '\' ORDER BY TimeSent DESC');
            const messages = result.recordsets;
            console.log(messages);

            if (result.rowsAffected > 0) {
                return messages
            }
        });
        return null;
    }
    catch (err) {
        return null;
    }
}

async function saveMessage(message, accountID, timestamp, currentChatID) {
    try {
        sql.connect(sqlConfig.returnServerConfig()).then(async function () {

                //if there isn't an existing friend request, add friendship into the database as pending
            result = await sql.query`insert into messages (ChatID, MessageBody, SenderID, TimeSent)
            Values (${currentChatID}, ${message}, ${accountID}, ${timestamp})`
            if(result.recordsets.rowsAffected > 0){
                return Promise.resolve(true)
            }
            else{
                return Promise.resolve(false)
            }
            
        })
    }
    catch (err) {
        return Promise.resolve(false)
    }
}

function testFunctions(){
    //console.log(sqlConfig.returnServerConfig());
    //console.log(saveMessage("Testing Message", 1000, '2023-10-11 09:10:05.057', 10001001));
    //console.log(getMessageHistory(10001001));
}

module.exports = {
    generateChatID,
    getMessageHistory,
    saveMessage,
    testFunctions,
};