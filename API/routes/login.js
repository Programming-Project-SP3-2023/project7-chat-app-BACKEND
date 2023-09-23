const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const env = require('dotenv').config();
const jwt = require('jsonwebtoken');
const sqlConfig = require('../config');

var jsonparser = bodyParser.json();

router.post('/', jsonparser, async (req, res, next) => {
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
});

module.exports = router;
