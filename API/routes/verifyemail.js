const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const { sendVerificationEmail } = require('../middleware/emailRegister.js');
const crypto = require('crypto'); // Import the crypto module
const moment = require('moment'); // Import the moment.js library

router.get('/', async (req, res) => {
    const emailToken = req.query.emailToken;

    // Connect to the database using SQL configuration
    try {
        await sql.connect(sqlConfig.returnServerConfig());

        // Find the user with the given emailToken
        const userResult = await sql.query`SELECT Email, TokenCreationDateTime FROM Accounts
                                             WHERE EmailToken = ${emailToken}`;
        
        if (userResult.recordset.length > 0) {
            const tokenCreationDateTime = userResult.recordset[0].TokenCreationDateTime;
            const currentTime = new Date();
            const twentyFourHoursAgo = moment(currentTime).subtract(24, 'hours').toDate();

            // Check if 24 hours have passed. If so, resend a new token via email and advise user. 
            if (moment(tokenCreationDateTime).isBefore(twentyFourHoursAgo)) {

                // generate a new email verification token for the user
                const newEmailToken = crypto.randomBytes(32).toString('hex');

                const result = await sql.query`UPDATE Accounts
                                           SET IsVerified = 0, EmailToken = ${newEmailToken}, TokenCreationDateTime = ${currentTime}
                                           WHERE Email = ${userResult.recordset[0].Email}`;

                if (result.rowsAffected[0] > 0) {
                // After successfully the user in the database, send the verification email
                sendVerificationEmail(userResult.recordset[0].Email, newEmailToken);
                return res.status(200).json({
                    Message: 'Email verification failed. Token has expired. Check your email for a new link to verify your account.',
                    Status: 'NotVerified'
                });
                } else {
                    return res.status(200).json({
                        Message: 'Something went wrong. Please try again or contact an administrator!',
                        Status: 'NotVerified'
                    });
                }
            }

            // Update the user's IsVerified and clear the email token
            const resultIsVerified = await sql.query`UPDATE Accounts
                                           SET IsVerified = 1, EmailToken = NULL, TokenCreationDateTime = NULL
                                           WHERE EmailToken = ${emailToken}`;

            if (resultIsVerified.rowsAffected[0] > 0) {
                // The user's email has been verified
                return res.status(200).json({
                    Message: 'Email verification successful.',
                    Status: 'Verified'
                });
            }
        }

        // No matching user found for the provided emailToken
        return res.status(200).json({
            Message: 'Email verification failed. Invalid email token.',
            Status: 'NotVerified'
        });
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

