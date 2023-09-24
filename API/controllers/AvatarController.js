const sql = require('mssql');
const fs = require('fs');
require ('dotenv').config();


const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    server: process.env.DB_HOST,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};
// Upload an avatar
const uploadAvatar = async (req, res) => {
    try {
        // account id from req with token data
        const userId = req.user.AccountID;

        // get the base64 for avatar from req
        const avatarData = req.body.avatarData;

        // Insert the new avatar data into the Avatars table
        const pool = await sql.connect(sqlConfig);
        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('avatarData', sql.NVarChar, avatarData)
            .query('UPDATE Avatars SET AvatarData = @avatarData WHERE AccountID = @userId');

        res.status(200).json({ message: 'Avatar uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const sql = require('mssql');

const getAvatar = async (req, res) => {
    try {
        const userId = req.user.AccountID;
        const pool = await sql.connect(sqlConfig);
        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT AvatarData FROM Avatars WHERE AccountID = @userId');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Avatar not found' });
        }

        res.status(200).json({ avatarData: result.recordset[0].AvatarData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
module.exports={
    uploadAvatar,

    getAvatar
};