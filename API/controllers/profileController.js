const express = require('express');
const router = express.Router();
const sql = require('mssql');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlConfig = require('../config/sqlConfig');
const authenticateToken = require('../middleware/authenticateToken');

var jsonParser = bodyParser.json();

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
            console.error('Database connection established and results returned.');
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
        .input('userId', sql.Int, userId)
        .input('newDisplayName', sql.NVarChar, newDisplayName)
        .query ('UPDATE Accounts SET DisplayName = @newDisplayName WHERE AccountID = @userId');
        res.status(200).json({message: 'Display name updated successfully'});
    }catch (error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
    }

    //change Email
    const changeEmail = async (req, res, next) => {
        try {
            // Get ID from the token
            const userId = req.user.AccountID;
    
            // Get new email from the request
            const newEmail = req.body.newEmail;
    
            // Connect to the database
            const pool = await sql.connect(sqlConfig);
    
            // Update the email in the database
            await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('newEmail', sql.NVarChar, newEmail)
                .query('UPDATE Accounts SET Email = @newEmail WHERE AccountID = @userId');
    
            res.status(200).json({ message: 'Email updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    };
    


    const getUserInfo = async (req, res, next) => {
        try {
            // Get id from the token
            const userId = req.user.AccountID;
            // Connect to the database
            const pool = await sql.connect(sqlConfig);

            const result = await pool
                .request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT A.Email, A.DisplayName, A.Dob, L.Username
                    FROM Accounts A
                    INNER JOIN Logins L ON A.AccountID = L.AccountID
                    WHERE A.AccountID = @userId
                `);
    
            if (result.recordset.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const userInfo = {
                email: result.recordset[0].Email,
                displayName: result.recordset[0].DisplayName,
                dob: result.recordset[0].Dob,
                //add username
                username: result.recordset[0].Username, 
            };
            res.status(200).json(userInfo);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    };

module.exports ={
    updatePassword,
    editDisplayname,
    getUserInfo,
    changeEmail,
};