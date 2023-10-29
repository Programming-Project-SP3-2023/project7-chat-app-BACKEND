const sql = require('mssql');
const fs = require('fs');
require ('dotenv').config();
const sqlConfig = require('../config');

// Upload an avatar
const uploadAvatar = async (req, res) => {
    try {
        console.dir('Upload avatar route reached.'); // TODO - delete
        // account id from req with token data
        const userId = req.user.AccountID;

        // get the base64 for avatar from req
        const avatarData = req.body.avatarData;

        // Check if the user already has an avatar
        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const existingAvatarResult = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT Avatar FROM Accounts WHERE AccountID = @userId');

        if (existingAvatarResult.recordset.length === 0) {
            // If no existing avatar, insert a new one
            const insertResult = await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('avatarData', sql.NVarChar, avatarData)
                .query('UPDATE Accounts SET Avatar = avatarData WHERE AccountID = @userId');
        } else {
            // If there's an existing avatar, update it
            const updateResult = await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('avatarData', sql.NVarChar, avatarData)
                .query('UPDATE Accounts SET Avatar = @avatarData WHERE AccountID = @userId');
        }

        res.status(200).json({ message: 'Avatar uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const uploadGroupAvatar = async(req, res)=>{
    try{
        const groupId = req.body.groupId;
        //get data from req
        const avatarData = req.body.avatarData;
        const pool = await sql.connect(sqlConfig.returnServerConfig());
        //check if there is an existing avatar
        const existingAvatarResult = await pool
        .request()
        .input('groupId', sql.Int, groupId)
        .query('SELECT GroupAvatar FROM Groups WHERE GroupID = @groupId');

        if (existingAvatarResult.recordset.length === 0) {
            // If no existing avatar, insert a new one
            const insertResult = await pool
                .request()
                .input('groupId', sql.Int, groupId)
                .input('avatarData', sql.NVarChar, avatarData)
                .query('UPDATE Groups SET GroupAvatar = @avatarData WHERE GroupID = @groupId');
        } else {
            // If there's an existing avatar, update it
            const updateResult = await pool
                .request()
                .input('groupId', sql.Int, groupId)
                .input('avatarData', sql.NVarChar, avatarData)
                .query('UPDATE Groups SET GroupAvatar = @avatarData WHERE GroupID = @groupId');
        }

        res.status(200).json({ message: 'Group avatar uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAvatar = async (req, res) => {
    try {
        const userId = req.user.AccountID;
        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT Avatar FROM Accounts WHERE AccountID = @userId');

        if (result.recordset.length === 0) {
            return res.status(204).json({ message: 'Avatar not found' });

        }

        res.status(200).json({ avatarData: result.recordset[0].Avatar });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
module.exports={
    uploadAvatar,
    getAvatar,
    uploadGroupAvatar,
};