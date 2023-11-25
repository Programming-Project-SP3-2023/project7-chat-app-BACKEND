const sql = require('mssql');
require ('dotenv').config();
const sqlConfig = require('../config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//returns a list of user accounts
const getAccounts = async (req, res) => {
    if(!isUserAnAdmin(req.user)){
        return res.status(401).json({
            Message: "Unauthorized"
        })
    }

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
    if(!isUserAnAdmin(req.user)){
        return res.status(401).json({
            Message: "Unauthorized"
        })
    }

    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){
            //check if email  is unique
            var result = await sql.query`SELECT * FROM Accounts
                                        WHERE email = ${req.body.Email}`

            if(result.rowsAffected > 0){
                //return error if email isn't unique
                return res.status(409).json({
                    Message: "Email is taken"
                });
            }

            //select results similar to the input display name entered
            result = await sql.query
            (`UPDATE Accounts SET Email = '${req.body.Email}', DisplayName = '${req.body.DisplayName}', Dob = '${req.body.Dob}', Avatar = '${req.body.Avatar}' Where AccountID = ${req.body.AccountID}`);
            
            const userList = result.recordsets;
            //return any results found
            if(result.rowsAffected > 0){
                return res.status(200).json({
                    Message: "OK"
                });
            } else {
                return res.status(400).json({
                    Message: "Edit Failed"
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

//Delete the user account details
const deleteAccount = async (req, res) => {
    if(!isUserAnAdmin(req.user)){
        return res.status(401).json({
            Message: "Unauthorized"
        })
    }

    try{
        sql.connect(sqlConfig.returnServerConfig()).then(async function(){

            const accountType = await sql.query
            (`SELECT AccountID, isAdmin FROM Accounts WHERE AccountID = '${req.body.AccountID}' AND isAdmin = 1`);

            if(accountType.recordset.length !== 0){
                return res.status(401).json({ message: 'You cant delete admin accounts' }); 
            }

            //select results similar to the input display name entered
            var result = await sql.query
            (`DELETE FROM Logins WHERE AccountID = '${req.body.AccountID}'`);

            //get all friendship IDs table
            result = await sql.query
            (`SELECT FriendshipID FROM Friendships
            WHERE RequesterID = ${req.body.AccountID}
            OR
            AddresseeID = ${req.body.AccountID}`);


            //delete from Messages table
            for(var i=0; i<result.rowsAffected; i++){

                result = await sql.query
                (`DELETE FROM Messages
                WHERE ChatID = ${result.recordsets[0][i].FriendshipID}`);
            }

            //delete from friendships table
            result = await sql.query
            (`DELETE FROM Friendships
            WHERE RequesterID = ${req.body.AccountID}
            OR
            AddresseeID = ${req.body.AccountID}`);

            //delete from ChannelMembers table
            result = await sql.query
            (`DELETE FROM ChannelMembers
            WHERE MemberID = ${req.body.AccountID}`);

            //delete from channelMessages table
            result = await sql.query
            (`DELETE FROM ChannelMessages
            WHERE SenderID = ${req.body.AccountID}`);

            //delete from GroupMembers table
            result = await sql.query
            (`DELETE FROM GroupMembers
            WHERE AccountID = ${req.body.AccountID}`);

            //delete from Accounts table
            result = await sql.query
            (`DELETE FROM Accounts WHERE AccountID = '${req.body.AccountID}'`);

            //return any results found
            if(result.rowsAffected > 0){
                return res.status(200).json({
                    Message: "Account Deleted"
                });
            } else {
                return res.status(400).json({
                    Message: "Account not found"
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
    //check if logged in user is an admin
    if(!isUserAnAdmin(req.user)){
        return res.status(401).json({
            Message: "Unauthorized"
        })
    }

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
            //check if user exists
            var result = await sql.query
            (`SELECT * FROM Accounts WHERE AccountID = ${req.body.AccountID}`);

            if(result.recordsets == 0){
                return res.status(401).json({
                    Message: "User doesn't exist, please try again!"
                });
            }   

            //select results similar to the input display name entered
            result = await sql.query
            (`UPDATE Logins SET PasswordHash = '${hashedPassword}' Where AccountID = '${req.body.AccountID}'`);
            
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

//handles secure login for admins only
const adminLogin = async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig.returnServerConfig());
        // Get user's info by username
        const result = await pool
            .request()
            .input('username', sql.NVarChar, username) // Corrected data type
            .query('SELECT AccountID, PasswordHash FROM Logins WHERE Username = @username');
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const user = result.recordset[0];
        
        //TODO: Check if isAdmin = 1;
        const accountType = await pool
            .request()
            .input('accountID', user.AccountID) // Corrected data type
            .query('SELECT AccountID, isAdmin FROM Accounts WHERE accountID = accountID AND isAdmin = 1');

        if(accountType.recordset.length === 0){
            return res.status(401).json({ message: 'You must be an admin to login to this site' }); 
        }
        
        // Compare provided password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        //Set web token with key taken from .env
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign({ AccountID: user.AccountID, username: user.Username, type: 'Admin' }, jwtSecret, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login Successful', token, AccountID: user.AccountID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//checks if the current user is an admin
function isUserAnAdmin(user){
    if(user.type != "Admin"){
        return resolve(false);
    } else {
        return resolve(true);
    }
}

module.exports={
    getAccounts,
    updateAccount,
    deleteAccount,
    changePassword,
    adminLogin
}