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
            (`UPDATE Accounts SET Email = ${req.Email}, DisplayName = ${req.DisplayName}, Dob = ${req.Dob}, Accounts = ${req.Avatar}
            Where AccountID = ${req.AccountID}`);
            
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

const adminLogin = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    

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
        
        //TODO: Check if isAdmin = 1;


        const user = result.recordset[0];
        // Compare provided password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        //Set web token with key taken from .env
        const jwtSecret = process.env.JWT_SECRET;
        const token = jwt.sign({ AccountID: user.AccountID, username: user.Username }, jwtSecret, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login Successful', token, AccountID: user.AccountID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports={
    getAccounts,
    updateAccount,
    changePassword
}