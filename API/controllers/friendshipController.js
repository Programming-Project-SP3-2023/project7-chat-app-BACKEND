const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');

//sends a friend request
function sendRequest(requester, requestee, res){
    //take in the requester and Requestee's Account ID
    const friendship = {
        Requester: requester,
        requestee: requestee,
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
                return res.status(200).json({
                    Message: "OK"
                });
            } else {
                return res.status(400).json({
                    Message: "Friendship already exists"
                })
            }
        })
    } catch{
        return res.status(400).json({
            Message: "Server Error"
        })
    }
}

//accept a friend request
function acceptRequest(currentUserID, OtherUserID, res){
    try{
        
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query`UPDATE Friendships
                                           SET Status = 'Accepted'
                                           WHERE RequesterID = ${OtherUserID}
                                           AND AddresseeID = ${currentUserID}`
            return res.status(200).json({
                Message: "OK"
            });
        });

    }catch{
        return res.status(400).json({
            Message: "Server Error"
        })
    }
}

//delete a friendship or friendship request
function deleteFriendship(currentUserID, otherUserID, res){
    try{
        //Delete a friendship or friendship request that has been sent by another user.
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query`DELETE FROM Friendships
                                           WHERE RequesterID = ${otherUserID}
                                           AND AddresseeID = ${currentUserID}
                                           OR
                                           AddresseeID = ${otherUserID}
                                           AND RequesterID = ${currentUserID}`
            return res.status(200).json({
                Message: "OK"
            });
        });
    }catch{
        return res.status(400).json({
            Message: "Server Error"
        });
    }
}

//return a list of users matching entered name
function search(DisplayName, res){
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query('SELECT * FROM Accounts WHERE DisplayName LIKE \'%' + DisplayName + '%\' ')

            return res.status(200).json({
                Message: "OK",
                result
            });
        });
    } catch{
        return res.status(400).json({
            Message: "Server Error"
        })
    }
}

//return a list of users friends or friendrequests
function returnFriendsList(currentUserID, res){
    try{
        //select all users from the friendships table that match the users AccountID
        //client side provides the requested status such as pending or accepted
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const result = await sql.query`SELECT * FROM friendships

                                           WHERE RequesterID = ${currentUserID}
                                           OR AddresseeID = ${currentUserID}`

            return res.status(200).json({
                Message: "OK",
                result
            });
        });
    }catch{
        return res.status(400).json({
            Message: "Server Error"
        });
    }
}

module.exports = {
    sendRequest,
    acceptRequest,
    deleteFriendship,
    search,
    returnFriendsList
}

