const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');

//gets chatid for 1-1 chat between users.
function generateChatID(user1, user2){
    const nums = [user1, user2];
    nums.sort((a, b) => a - b);
    const result = numbers.join('');

    return parseInt(result);
}

function getMessageHistory(chatID){
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){

            result = await sql.query('SELECT * FROM Messages WHERE ChatID == \'%' + chatID + '%\' ')
        

        });

    }
    catch(err){

    }
}

module.exports = {
    generateChatID,
  };