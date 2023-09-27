const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlConfig = require('../config');
const { stringify } = require('querystring');

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

//return users matching entered name
router.get('/search', jsonparser, (req, res, next) => {
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query('SELECT * FROM Accounts WHERE DisplayName LIKE \'%' + req.body.DisplayName + '%\' ')

            res.status(200).json({
                Message: "OK",
                result
            });
        });
    } catch{
        res.status(400).json({
            Message: "Server Error"
        })
    }
});

//return a list of users friends or friendrequests
router.get('/friends', jsonparser, (req, res, next) => {
    try{
        //select all users from the friendships table that match the users AccountID
        //client side provides the requested status such as pending or accepted
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query`SELECT * FROM friendships

                                           WHERE RequesterID = ${req.body.currentUserID}
                                           OR AddresseeID = ${req.body.currentUserID}`
            // console.dir();
            const resultJson = JSON.stringify(result.recordsets);

            res.status(200).json({
                Message: "OK",
                resultJson
            });
        });
    }catch{
        res.status(400).json({
            Message: "Server Error"
        })
    }
});

//update the friendship request to accepted
router.put('/accept', jsonparser, (req, res, next) => {
    try{
        //Update the a friendship to accepted that has been sent by another user.
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query`UPDATE Friendships
                                           SET Status = 'Accepted'
                                           WHERE RequesterID = ${req.body.OtherUserID}
                                           AND AddresseeID = ${req.body.currentUserID}`
            res.status(200).json({
                Message: "OK"
            });
        });

    }catch{
        res.status(400).json({
            Message: "Server Error"
        })
    }
});

//delete the friendship or friendship request
router.delete('/delete', jsonparser, (req, res, next) => {
    try{
        //Delete a friendship or friendship request that has been sent by another user.
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query`DELETE FROM Friendships
                                           WHERE RequesterID = ${req.body.otherUserID}
                                           AND AddresseeID = ${req.body.currentUserID}
                                           OR
                                           AddresseeID = ${req.body.otherUserID}
                                           AND RequesterID = ${req.body.currentUserID}`
            res.status(200).json({
                Message: "OK"
            });
        });
    }catch{
        res.status(400).json({
            Message: "Server Error"
        });
    }
});

module.exports = router;