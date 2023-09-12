const express = require('express');
const router = express.Router();
const sql = require('mssql');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

var jsonParser = bodyParser.json()

router.post('/', jsonParser, (req, res, next) =>{
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
    console.log(user);

    const sqlConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
        server: process.env.DB_HOST,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options:{
            Encrypt: true,
            trustServerCertificate: true
        }
    }

    // submit user to the database
    sql.connect(sqlConfig).then(async function(){
        const result = await sql.query`INSERT INTO Accounts (Email, DisplayName, Dob) 
                                VALUES (${user.email}, ${user.name}, ${user.dateOfBirth})`
        console.dir(result);

        const AccountID = await sql.query`SELECT TOP 1 * FROM Accounts ORDER BY AccountID DESC`
        

        const result2 = await sql.query`INSERT INTO Logins (AccountID, Username, PassswordHash) 
        VALUES (${AccountID.recordset[0].AccountID}, ${user.username}, ${user.password})`
        console.dir(result2);
    })

    res.status(200).json({
        Message: "OK"
    })
});

module.exports = router;