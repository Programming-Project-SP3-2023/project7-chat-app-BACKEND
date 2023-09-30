const express = require('express');
const router = express.Router();
const sql = require('mssql');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlConfig = require('../config/sqlConfig');

var jsonParser = bodyParser.json();

const authenticateToken = require('../middleware/authenticateToken');

//Update password
const updatePassword = async (req, res, next) => {
    try{
        //get ID from the token
        const userId = req.user.AccountID;
        //get current pw and new pw from the req body
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        //connect to db
        const pool =  await sql.connect(sqlConfig);
        //query db to get hashed pw based on hash of provided one
        const result = await pool
        .request()
        .input('userId', sql.Int, userId)
        .query ('SELECT PasswordHash FROM Logins WHERE AccountID = @userId');
        if (result.recordset.length === 0){
            return res.status(404).json({message: 'User not found'});
        }
        const storedPasswordHash = result.recordset[0].PasswordHash;

        //Compare password with the db hash
        const isPasswordValid = await bcrypt.compare(currentPassword, storedPasswordHash);

        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid password'});
        }
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        //update pw with new hashed pw
        await pool
        .request()
        .input('userId', sql.Int, userId)
        .input ('hashedNewPassword', sql.NVarChar, hashedNewPassword)
        .query('UPDATE Logins Set PasswordHash = @hashedNewPassword WHERE AccountID = @userId');

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//Edit displayname
const editDisplayname = async (req, res, next) =>{
    //edit displayname
};


module.exports ={
    updatePassword,
    editDisplayname,
};