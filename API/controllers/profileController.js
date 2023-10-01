const express = require('express');
const router = express.Router();
const sql = require('mssql');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlConfig = require('../config/sqlConfig');

var jsonParser = bodyParser.json();

const authenticateToken = require('../middleware/authenticateToken');

// Update password
const updatePassword = async (req, res, next) => {
    try {
        // Get ID from the token
        const userId = req.user.AccountID;
        // Get current pw and new pw from the req body
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        // Connect to db
        const pool = await sql.connect(sqlConfig);
        // Query db to get hashed pw based on user ID
        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT PasswordHash FROM Logins WHERE AccountID = @userId');
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const storedPasswordHash = result.recordset[0].PasswordHash;

        // Compare hashed current password with the db hash
        const isPasswordValid = await bcrypt.compare(currentPassword, storedPasswordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password with the new hashed password
        await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('hashedNewPassword', sql.NVarChar, hashedNewPassword)
            .query('UPDATE Logins SET PasswordHash = @hashedNewPassword WHERE AccountID = @userId');

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//Edit displayname
const editDisplayname = async (req, res, next) =>{
    try{
        //get id from token
        const userId = req.user.AccountID;

        //get new name from request
        const newDisplayName = req.body.newDisplayName;

        //db connection
        const pool = await sql.connect(sqlConfig);
        await pool
        .request()
        .input(('userId', sql.Int, userId))
        .input('newDisplayName', sql.NVarChar, newDisplayName)
        .query ('UPDATE Accounts SET DisplayName = @newDisplayName WHERE AccountID = @userId');
        res.status(200).json({message: 'Display name updated successfully'});
    }catch (error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
    }


    const getUserInfo = async(req, res, next)=>{
        try{
            //get id from token
            const userId = req.user.AccountID;
            //dbconnect
            const pool = await sql.connect(sqlConfig);
            //query db to get user info
            const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Email, DisplayName, Dob FROM Accounts WHERE AccountID = @userId');

            if (result.recordset.length === 0 ){
                return res.status(404).json({message: 'user not found'});
            }
            //get user info from query result
            const userInfo = {
                email: result.recordset[0].Email,
                displayName: result.recordset[0].DisplayName,
                dob: result.recordset[0].Dob,
            };
            res.status(200).json(userInfo);
        }catch(error){
            console.error(error);
            res.status(500).json({message: 'Server error'});
        }
    };

module.exports ={
    updatePassword,
    editDisplayname,
    getUserInfo,
};