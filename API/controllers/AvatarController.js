const sql = require('mssql');
const fs = require('fs');
require('dotenv').config();
const sqlConfig = require('../config');
const sharp = require('sharp')

// Upload an avatar
const uploadAvatar = async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig.returnServerConfig());

        // account id from req with token data
        const userId = req.user.AccountID;

        //validate that the user exists
        result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM Accounts WHERE AccountID = @userId');

        if (result.recordsets == 0) {
            return res.status(401).json({
                Message: "User doesn't exist, please try again!"
            });
        }

        //validate that the image data isn't null
        if (req.body.avatarData == null) {
            return res.status(400).json({
                Message: "AvatarData is null"
            });
        }

        // get the base64 for avatar from req
        let avatarData = req.body.avatarData;
        let b64Header;
        let avatarPrefix = avatarData.match(/^(data:image\/\w+;base64,).*$/);

        if (avatarPrefix && avatarPrefix[1]) {
            // The captured portion is in match[1]
            b64Header = avatarPrefix[1];
        }

        avatarData = avatarData.split(';base64,').pop()

        //decode to buffer
        const buffer = Buffer.from(avatarData, 'base64');

        //check size
        const size = buffer.length / 1024;


        //set compression to 100% of original quality unless size exceeds limit
        let compressionAmount;
        let targetSize = 50;

        if (size > targetSize) {
            compressionAmount = Math.round(Math.min(100, (targetSize / size) * 100));
        } else {
            compressionAmount = 100;
        }



        const compressionOptions = {
            quality: compressionAmount,
        };



        const compressedAvatar = await compressImage(avatarData, compressionOptions);

        const avatar = b64Header+compressedAvatar;

        // Check if the user already has an avatar
        const existingAvatarResult = await pool
            .request()
            .input('userId', sql.Int, userId)
            .query('SELECT Avatar FROM Accounts WHERE AccountID = @userId');

        if (existingAvatarResult.recordset.length === 0) {
            // If no existing avatar, insert a new one
            const insertResult = await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('avatarData', sql.NVarChar, avatar)
                .query('UPDATE Accounts SET Avatar = avatarData WHERE AccountID = @userId');
        } else {
            // If there's an existing avatar, update it
            const updateResult = await pool
                .request()
                .input('userId', sql.Int, userId)
                .input('avatarData', sql.NVarChar, avatar)
                .query('UPDATE Accounts SET Avatar = @avatarData WHERE AccountID = @userId');
        }

        res.status(200).json({ message: 'Avatar uploaded successfully' });






    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const uploadGroupAvatar = async (req, res) => {
    try {
        const groupId = req.body.groupId;
        //get data from req
         // get the base64 for avatar from req
         let avatarData = req.body.avatarData;
         let b64Header;
         let avatarPrefix = avatarData.match(/^(data:image\/\w+;base64,).*$/);
 
         if (avatarPrefix && avatarPrefix[1]) {
             // The captured portion is in match[1]
             b64Header = avatarPrefix[1];
         }
 
         avatarData = avatarData.split(';base64,').pop()
 
         //decode to buffer
         const buffer = Buffer.from(avatarData, 'base64');
 
         //check size
         const size = buffer.length / 1024;
  
         //set compression to 100% of original quality unless size exceeds limit
         let compressionAmount;
         let targetSize = 50;
 
         if (size > targetSize) {
             compressionAmount = Math.round(Math.min(100, (targetSize / size) * 100));
         } else {
             compressionAmount = 100;
         }
 
 
 
         const compressionOptions = {
             quality: compressionAmount,
         };
  
 
         const compressedAvatar = await compressImage(avatarData, compressionOptions);
 
         const avatar = b64Header+compressedAvatar;

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
                .input('avatarData', sql.NVarChar, avatar)
                .query('UPDATE Groups SET GroupAvatar = @avatarData WHERE GroupID = @groupId');
        } else {
            // If there's an existing avatar, update it
            const updateResult = await pool
                .request()
                .input('groupId', sql.Int, groupId)
                .input('avatarData', sql.NVarChar, avatar)
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


const compressImage = async (imageData, options) => {
    const buffer = Buffer.from(imageData, 'base64');
    console.log(buffer.length / 1024+"kb")
    const compressedBuffer = await sharp(buffer).png(options).toBuffer();
    console.log(compressedBuffer.length / 1024+"kb")
    return compressedBuffer.toString('base64');
};



module.exports = {
    uploadAvatar,
    getAvatar,
    uploadGroupAvatar,
};