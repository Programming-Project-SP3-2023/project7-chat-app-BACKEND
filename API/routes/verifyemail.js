const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');

router.get('/', async (req, res) => {
    const emailToken = req.query.emailToken;

    // Connect to the database using your SQL configuration
    try {
        await sql.connect(sqlConfig.returnServerConfig());

        // Find the user with the given emailToken and set IsVerified to true
        const result = await sql.query`UPDATE Accounts
                                        SET IsVerified = 1, EmailToken = NULL
                                        WHERE EmailToken = ${emailToken}`;

        if (result.rowsAffected[0] > 0) {
            // The user's email has been verified
            return res.status(200).json({
                Message: 'Email verified successfully.'
            });
        } else {
            // No matching user found for the provided emailToken
            return res.status(404).json({
                Message: 'Email verification failed. Invalid or expired email Token.'
            });
        }
    } catch (error) {
        console.error('Error verifying email:', error);
        return res.status(500).json({
            Message: 'Internal server error.'
        });
    } finally {
        sql.close();
    }
});

module.exports = router;
