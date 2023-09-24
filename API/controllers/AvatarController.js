const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require ('dotenv').config();


const tempAvatarDir = path.join(__dirname, 'avatarTemp'); 
if (!fs.existsSync(tempAvatarDir)) {
    fs.mkdirSync(tempAvatarDir);
}
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
        //get account id from the request which included token data
        const userId = req.user.AccountID;

        // get the base64-encoded avatar data from the request
        const avatarData = req.body.avatarData;
        const imageBuffer = Buffer.from(avatarData, 'base64');

        // make a filename for the avatar (using the user's ID)
        const avatarFilename = `${userId}_avatar.png`;
        //filepath for temp files
        const temporaryAvatarPath = path.join(tempAvatarDir, avatarFilename);

        // Write the decoded image data to the temporary file
        fs.writeFileSync(temporaryAvatarPath, imageBuffer);


        //insert avatar
        const pool = await sql.connect(sqlConfig);
        const result = await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('avatarData', sql.NVarChar, temporaryAvatarPath)
            .query('UPDATE Avatars SET AvatarData = @avatarData WHERE AccountID = @userId');

        // Remove the temporary file after it has been updated in the database
        fs.unlinkSync(temporaryAvatarPath);

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