const sql = require('mssql');
const fs = require('fs');
const path = require('path');


const tempAvatarDir = path.join(__dirname, 'avatarTemp'); 
if (!fs.existsSync(tempAvatarDir)) {
    fs.mkdirSync(tempAvatarDir);
}
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

        // Insert the new avatar data into the Avatars table
        const sqlConfig = {
            // Your database configuration
        };

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

const getAvatar = async (req, res)=>{
    try{

    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

module.exports={
    uploadAvatar,

    getAvatar
};