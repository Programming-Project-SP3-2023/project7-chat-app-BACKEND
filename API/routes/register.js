const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlConfig = require('../config');

var jsonParser = bodyParser.json()

router.post('/', jsonParser, (req, res, next) =>{
    
    //encrypt the users password
    const saltRounds = 10;
    let hashedPassword = null;
    bcrypt.genSalt(saltRounds, function(err, salt){
        bcrypt.hash(req.body.password, salt, function(err, hash){
            hashedPassword = hash;
        })
    })

    // create a user from the body content
    const user = {
        name: req.body.name,
        email: req.body.email,
        dateOfBirth: req.body.dateOfBirth,
        username: req.body.username,
        password: req.body.password
    }

    // submit user to the database
    sql.connect(sqlConfig.returnServerConfig()).then(async function(){
        //check if username is unique
        var result = await sql.query`SELECT username FROM Logins
                                       WHERE username = ${user.username}`

        if(result.rowsAffected == 0){
            //insert new user into the database
            result = await sql.query`INSERT INTO Accounts (Email, DisplayName, Dob, Avatar) 
            VALUES (${user.email}, ${user.name}, ${user.dateOfBirth}, ${user.name})`

            //select the accountID of the new user
            const AccountID = await sql.query`SELECT TOP 1 * FROM Accounts ORDER BY AccountID DESC`

            //insert login details into the database
            result = await sql.query`INSERT INTO Logins (AccountID, Username, PasswordHash) 
            VALUES (${AccountID.recordset[0].AccountID}, ${user.username}, ${hashedPassword})`
            
            //return OK if no issues occured
            res.status(200).json({
                Message: "OK"
            })
        } else {
            //return error if username isn't unique
            res.status(400).json({
                Message: "Username must be unique"
            })
        }
    })
});

module.exports = router;