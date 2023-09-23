const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlConfig = require('../config');

var jsonparser = bodyParser.json();

//send a friend request
router.post('/', jsonparser, (req, res, next) => {
    //take in the requester and Requestee's Account ID
    const friendship = {
        Requester: req.body.requester,
        requestee: req.body.requestee,
        Status: "pending"
    }

    //submit the friendship to the database
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            //check DB for an existing friendrequest
            var result = await sql.query`Select * FROM Friendships
                                           Where RequesterID = ${friendship.Requester}
                                           AND AddresseeID = ${friendship.requestee}
                                           
                                           OR RequesterID = ${friendship.requestee} 
                                           AND AddresseeID = ${friendship.Requester}`
            
            //if there isn't an existing friend request, add friendship into the database as pending
            if(result.recordsets == 0){
                result = await sql.query`INSERT INTO Friendships (RequesterID, AddresseeID, Status)
                                         Values (${friendship.Requester}, ${friendship.requestee}, 'Pending')`
                res.status(200).json({
                    Message: "OK"
                });
            } else {
                res.status(400).json({
                    Message: "Friendship already exists"
                })
            }
        })
    } catch{
        res.status(400).json({
            Message: "Server Error"
        })
    }
});

module.exports = router;