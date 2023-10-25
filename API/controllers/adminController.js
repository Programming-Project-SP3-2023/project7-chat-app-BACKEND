const sql = require('mssql');
require ('dotenv').config();
const sqlConfig = require('../config');
const bcrypt = require('bcrypt');

//returns a list of user accounts
const getAccounts = async (req, res) => {
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            //select results similar to the input display name entered
            const result = await sql.query
            (`SELECT Accounts.AccountID, Accounts.Email, Accounts.DisplayName, Accounts.Dob, Accounts.Avatar
              FROM Accounts INNER JOIN Logins ON Accounts.AccountID = Logins.AccountID`);
            
            const userList = result.recordsets;
            //return any results found
            if(result.rowsAffected > 0){
                return res.status(200).json({
                    Message: "OK",
                    userList
                });
            }
            //return 204, if no results found
            return res.status(204).json({
                Message: "No users found!",
                userList: []
            });

        });
    //catch any errors
    } catch{
        return res.status(400).json({
            Message: "Server Error"
        })
    }
}

//update the user account details
const updateAccount = async (req, res) => {
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            //select results similar to the input display name entered
            const result = await sql.query
            (`UPDATE Accounts SET Email = ${req.Email}, DisplayName = ${req.DisplayName}, Dob = ${req.Dob}
            Where AccountID = ${req.AccountID}`);
            
            const userList = result.recordsets;
            //return any results found
            if(result.rowsAffected > 0){
                return res.status(200).json({
                    Message: "OK"
                });
            }
        });
    //catch any errors
    } catch{
        return res.status(400).json({
            Message: "Server Error"
        });
    }
}

//changes the users password
const changePassword = async (req, res) => {
    try{
        //encrypt the users password
        const saltRounds = 10;
        let hashedPassword = null;
        bcrypt.genSalt(saltRounds, function(err, salt){
            bcrypt.hash(req.body.password, salt, function(err, hash){
                hashedPassword = hash;
            })
        })

        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            //select results similar to the input display name entered
            const result = await sql.query
            (`UPDATE Logins SET password = ${hashedPassword} Where AccountID = ${req.AccountID}`);
            
            //return any results found
            if(result.rowsAffected > 0){
                return res.status(200).json({
                    Message: "OK"
                });
            } else {
                return res.status(400).json({
                    Message: "Server Error"
                })
            }
        });
    //catch any errors
    } catch{
        return res.status(400).json({
            Message: "Server Error"
        });
    }
}

module.exports={
    getAccounts,
    updateAccount,
    changePassword
}