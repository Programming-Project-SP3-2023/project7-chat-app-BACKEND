const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');
const chatData = require('../middleware/chatData');


//sends a friend request
function sendRequest(requesterID, requesteeID, res){
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            const existingFriendship = await checkForExistingFriendships(requesterID, requesteeID);

            //check DB for an existing friendship or friend request
            if(!existingFriendship){
                //if there isn't an existing friend request, add friendship into the database as pending
                result = await sql.query`INSERT INTO Friendships (FriendshipID, RequesterID, AddresseeID, Status)
                Values (${chatData.generateChatID(requesterID, requesteeID)}, ${requesterID}, ${requesteeID}, 'Pending')`

                return res.status(200).json({
                    Message: "OK"
                });
            } 

            //if friendship / friend request already exists return 401
            return res.status(401).json({
                Message: "Friendship already exists"
            });
        })
    //catch any errors
    } catch(err){
        console.dir(err);
        return res.status(400).json({
            Message: "Server Error"
        })
    }
}

//accept a friend request
async function acceptRequest(currentUserID, requesterID, res){
    try{
        const existingFriendship = await checkForExistingFriendships(currentUserID, requesterID);
        //connect to DB
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            // if friendship exists, update database and return OK code
            if(existingFriendship){
                const result = await sql.query`UPDATE Friendships
                SET Status = 'Active'
                WHERE RequesterID = ${requesterID}
                AND AddresseeID = ${currentUserID}`
                
                return res.status(200).json({
                    Message: "OK"
                });
            }

            //if friendship doesn't exists return error 
            return res.status(401).json({
                Message: "Friendship not found!"
            })
        });
    //catch any errors
    }catch(err){
        console.dir(err);
        return res.status(400).json({
            Message: "Server Error"
        })
    }
}

//delete a friendship or friendship request
async function deleteFriendship(currentUserID, otherUserID, res){
    try{
        //check if friendship exists in the database
        const existingFriendship = await checkForExistingFriendships(currentUserID, otherUserID);
 
        //check if friendship exists
        if(existingFriendship){
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
                })
            })
        } else {
            //return 401 if friendship isn't found
            return res.status(401).json({
                Message: "Friendship not found"
            })
        }
    //catch and print any errors encountered 
    }catch(err){
        console.dir(err);
        return res.status(400).json({
            Message: "Server Error"
        });
    }
}

//return a list of users matching entered name
function search(DisplayName, res){
    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            //select results similar to the input display name entered
            const result = await sql.query('SELECT AccountID, Email, DisplayName FROM Accounts WHERE DisplayName LIKE \'%' + DisplayName + '%\' ')
            
            const userList = result.recordsets;
            //return any results found
            if(result.rowsAffected > 0){
                return res.status(200).json({
                    Message: "OK",
                    userList
                });
            }
            //return 401, if no results found
            return res.status(401).json({
                Message: "No results found!"
            });

        });
    //catch any errors
    } catch{
        return res.status(400).json({
            Message: "Server Error"
        })
    }
}

//return a list of users friends or friendrequests
async function returnFriendsList(currentUserID, status, res){
    try{

        //select all users from the friendships table that match the users AccountID
        //client side provides the requested status such as pending or accepted
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            if(status == "Pending"){
                //only received friend requests.
                const result = await sql.query`SELECT Friendships.RequesterID, Accounts.DisplayName, Accounts.Email, Accounts.DoB, Accounts.Avatar
                                             FROM Friendships
                                             INNER JOIN Accounts ON Friendships.RequesterID = Accounts.AccountID
                                             WHERE Friendships.AddresseeID = ${currentUserID} AND Friendships.Status = 'Pending'`
                const friendships = result.recordsets[0];
                //return the list of users
                if(result.rowsAffected > 0){
                    return res.status(200).json({
                        Message: "OK",
                        friendships
                    });
                }


            } else {
                const friendships = []

                var result = await sql.query
                `SELECT Friendships.RequesterID, Accounts.DisplayName, Accounts.Email, Accounts.DoB, Accounts.Avatar
                FROM Friendships
                INNER JOIN Accounts ON Friendships.RequesterID = Accounts.AccountID
                WHERE Friendships.AddresseeID = ${currentUserID} AND Friendships.Status = 'Pending'`
                
                for(i=0;i<result.rowsAffected;i++){
                    friendships.push(result.recordsets[0][i])
                }
                
                result = await sql.query
                `SELECT Friendships.AddresseeID, Accounts.DisplayName, Accounts.Email, Accounts.DoB, Accounts.Avatar
                FROM Friendships
                INNER JOIN Accounts ON Friendships.AddresseeID = Accounts.AccountID
                WHERE Friendships.RequesterID = ${currentUserID} AND Friendships.Status = 'Pending'`
                
                for(i=0;i<result.rowsAffected;i++){
                    friendships.push(result.recordsets[0][i])
                }

                console.dir(friendships);

                return res.status(200).json({
                    Message: "OK",
                    friendships
                });
            }
        });
        
    //catch and print any errors
    }catch(err){
        console.dir(err);
        return res.status(400).json({
            Message: "Server Error"
        });
    }
}

//checks for an existing friendship in the database, returns true if results are found
async function checkForExistingFriendships(currentUserID, otherUserID){
    //submit the friendship to the database
    try{
        await sql.connect(sqlConfig.returnServerConfig());
            //check DB for an existing friendrequest
        const query = `Select TOP 1 * FROM Friendships
                                           Where RequesterID = ${currentUserID}
                                           AND AddresseeID = ${otherUserID}
                                           
                                           OR RequesterID = ${otherUserID} 
                                           AND AddresseeID = ${currentUserID}`

        const result = await sql.query(query);

        //if there is an existing friend request return true
        if(result.recordset.length > 0){
            return Promise.resolve(true);
        }
        // //return false if no friendship found
        return Promise.resolve(false);

    //return false in an error occurs
    } catch(err){
        console.dir(err);
        return Promise.resolve(false);
    }

}
//checks if there is an !active! friendship between two accountIDs.
async function isActiveFriend(ID1, ID2){
    try{
        await sql.connect(sqlConfig.returnServerConfig());
            //check DB for an existing friendrequest
        const query = `Select TOP 1 * FROM Friendships
                                           Where RequesterID = ${ID1}
                                           AND AddresseeID = ${ID2}
                                           AND Status = 'Active'
                                           
                                           OR RequesterID = ${ID2} 
                                           AND AddresseeID = ${ID1}
                                           AND Status = 'Active'`


        const result = await sql.query(query);

        //if there is an existing friend request return true
        if(result.recordset.length > 0){
            Promise.resolve(true);
        }
    
        // //return false if no friendship found
        return Promise.resolve(false);

    //return false in an error occurs
    } catch(err){
        console.dir(err);
        return Promise.resolve(false);
    }
}

module.exports = {
    sendRequest,
    acceptRequest,
    deleteFriendship,
    search,
    returnFriendsList,
    isActiveFriend
}

