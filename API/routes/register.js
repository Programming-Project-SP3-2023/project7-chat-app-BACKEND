const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlConfig = require('../config');
const crypto = require('crypto'); // Import the crypto module
const { sendVerificationEmail } = require('../middleware/emailRegister.js'); // Import the email registration middleware

var jsonParser = bodyParser.json()

router.post('/', jsonParser, (req, res, next) =>{
    
    //encrypt the users password
    const saltRounds = 10;
    // Generate a 64-character hex value for EmailToken
    const emailToken = crypto.randomBytes(32).toString('hex');

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
        password: req.body.password,
        isVerified: false,
        emailToken: emailToken,
        tokenCreationDateTime: new Date()
    }

    if(user.name.length <= 0 || user.email.length <= 0 ||
       user.dateOfBirth.length.length < 10 || user.username.length <= 0 ||
       user.password.length <= 0){
        return res.status(400).json({
            Message: "Error: Incorrectly entered data, please try"
        });
    }

    if(user.name == null || user.email == null  || user.dateOfBirth == null 
        || user.username == null || user.password == null){
            console.dir(user);
        //return error if username isn't unique
        return res.status(401).json({
            Message: "Error: Null Value"
        });
    };

    // submit user to the database
    sql.connect(sqlConfig.returnServerConfig()).then(async function(){
        //check if username  is unique
        var result = await sql.query`SELECT * FROM Logins
                                     WHERE username = ${user.username}`

        if(result.rowsAffected != 0){
            //return error if username isn't unique
            return res.status(409).json({
                Message: "Username is taken"
            });
        }

        //check if email  is unique
        result = await sql.query`SELECT * FROM Accounts
                                     WHERE email = ${user.email}`

        if(result.rowsAffected != 0){
            //return error if email isn't unique
            return res.status(409).json({
                Message: "Email is taken"
            });
        }

        if(result.rowsAffected == 0){
            //insert new user into the database
            result = await sql.query`INSERT INTO Accounts (Email, DisplayName, Dob, Avatar, IsVerified, EmailToken, TokenCreationDateTime) 
            VALUES (${user.email}, ${user.name}, ${user.dateOfBirth}, 'NULL', ${user.isVerified}, ${user.emailToken}, ${user.tokenCreationDateTime})`

            //select the accountID of the new user
            const AccountID = await sql.query`SELECT TOP 1 * FROM Accounts ORDER BY AccountID DESC`

            //insert login details into the database
            result = await sql.query`INSERT INTO Logins (AccountID, Username, PasswordHash) 
            VALUES (${AccountID.recordset[0].AccountID}, ${user.username}, ${hashedPassword})`

            // After successfully inserting the user into the database, send the verification email
            sendVerificationEmail(user.email, user.emailToken);
            
            //return OK if no issues occured
            res.status(200).json({
                Message: "OK"
            })
        } else {

        }
    })
});

module.exports = router;