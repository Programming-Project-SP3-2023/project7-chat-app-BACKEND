const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();


//If visibility is public no add/remove from channel
//Add/remove are only for private channel


//Create a channel
const createChannel = async (req, res) => {
    try {
        const { groupName, creatorAccountId, channelType, visibility, channelName } = req.body;

        const userId = req.user.AccountID;

        // Check if the user is an admin of the group
        const isAdminQuery = `
            SELECT 1
            FROM GroupMembers
            WHERE GroupID = (
                SELECT GroupID
                FROM Channels
                WHERE ChannelID = @channelId
            )
            AND AccountID = @userId
            AND Role = 'Admin'
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const isAdminResult = await pool
            .request()
            .input('channelId', sql.Int, channelId)
            .input('userId', sql.Int, userId)
            .query(isAdminQuery);

        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to change the channel name' });
        }

        // Proceed with creating the channel
        const createChannelQuery = `
            INSERT INTO Channels (GroupID, ChannelType, Visibility, ChannelName)
            VALUES (@groupId, @channelType, @visibility, @channelName)
        `;

        await pool
            .request()
            .input('groupId', sql.Int, groupId)
            .input('channelType', sql.VarChar(50), channelType)
            .input('visibility', sql.VarChar(50), visibility)
            .input('channelName', sql.VarChar(100), channelname)
            .query(createChannelQuery);

        return res.status(201).json({ message: 'Channel created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

//Change channel name
const updateChannelName = async(req, res) =>{
    try{
        const {channelId, newChannelName} = req.body;

        //check permissions
        const userId = req.user.AccountID;

        // Check if the user is an admin of the group
        const isAdminQuery = `
            SELECT 1
            FROM GroupMembers
            WHERE GroupID = (
                SELECT GroupID
                FROM Channels
                WHERE ChannelID = @channelId
            )
            AND AccountID = @userId
            AND Role = 'Admin'
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const isAdminResult = await pool
            .request()
            .input('channelId', sql.Int, channelId)
            .input('userId', sql.Int, userId)
            .query(isAdminQuery);

        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to change the channel name' });
        }
        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to change the channel name' });
        }
    }
};


//Delete a channel
const deleteChannel = async (req, res) => {
    try {
        //req should have channelId and userId
        const { channelId,} = req.body;

        const userId = req.user.AccountID;

        // Check if the user is an admin of the group
        const isAdminQuery = `
            SELECT 1
            FROM GroupMembers
            WHERE GroupID = (
                SELECT GroupID
                FROM Channels
                WHERE ChannelID = @channelId
            )
            AND AccountID = @userId
            AND Role = 'Admin'
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const isAdminResult = await pool
            .request()
            .input('channelId', sql.Int, channelId)
            .input('userId', sql.Int, userId)
            .query(isAdminQuery);

        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to change the channel name' });
        }
        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to delete this channel' });
        }

        // If the user is an admin, delete the channel
        const deleteChannelQuery = `
            DELETE FROM Channels WHERE ChannelID = @channelId
        `;

        await pool
            .request()
            .input('channelId', sql.Int, channelId)
            .query(deleteChannelQuery);

        return res.status(200).json({ message: 'Channel deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

//Add member to channel
const addMember = async (req, res) => {
    try {
        const { channelId} = req.body;

        const userId = req.user.AccountID;

        // Check if the user is an admin of the group
        const isAdminQuery = `
            SELECT 1
            FROM GroupMembers
            WHERE GroupID = (
                SELECT GroupID
                FROM Channels
                WHERE ChannelID = @channelId
            )
            AND AccountID = @userId
            AND Role = 'Admin'
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const isAdminResult = await pool
            .request()
            .input('channelId', sql.Int, channelId)
            .input('userId', sql.Int, userId)
            .query(isAdminQuery);

        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to change the channel name' });
        }
        if (isMemberResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to add a member to this channel' });
        }

        // If the user has permission, add member
        const addMemberQuery = `
            INSERT INTO ChannelMembers (MemberID, ChannelID)
            VALUES (@userId, @channelId)
        `;

        await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('channelId', sql.Int, channelId)
            .query(addMemberQuery);

        return res.status(200).json({ message: 'Member added to the channel successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const removeMember = async (req, res) => {
    try {
        const { channelId} = req.body; 

        const userId = req.user.AccountID;

        // Check if the user is an admin of the group
        const isAdminQuery = `
            SELECT 1
            FROM GroupMembers
            WHERE GroupID = (
                SELECT GroupID
                FROM Channels
                WHERE ChannelID = @channelId
            )
            AND AccountID = @userId
            AND Role = 'Admin'
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const isAdminResult = await pool
            .request()
            .input('channelId', sql.Int, channelId)
            .input('userId', sql.Int, userId)
            .query(isAdminQuery);

        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to change the channel name' });
        }
        if (isMemberResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to remove a member from this channel' });
        }

        // remove member from a channel
        const removeMemberQuery = `
            DELETE FROM ChannelMembers
            WHERE MemberID = @userId
            AND ChannelID = @channelId
        `;

        await pool
            .request()
            .input('userId', sql.Int, userId)
            .input('channelId', sql.Int, channelId)
            .query(removeMemberQuery);

        return res.status(200).json({ message: 'Member removed from the channel successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

//List all channels within a grp
const channelList = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Query to retrieve a list of channels for the specified group
        const channelListQuery = `
            SELECT C.ChannelID, C.Visibility, C.ChannelType
            FROM Channels C
            WHERE C.GroupID = @groupId
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const channelListResult = await pool
            .request()
            .input('groupId', sql.Int, groupId)
            .query(channelListQuery);

        // Return the list of channels
        const channels = channelListResult.recordset;

        return res.status(200).json(channels);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

//Get specific channel info
const channelInfo = async (req, res) => {
    try {
        const { channelId } = req.params;

        // query to retrieve channel information, including visibility and channel ID
        const channelInfoQuery = `
            SELECT C.ChannelID, C.Visibility, C.ChannelType
            FROM Channels C
            WHERE C.ChannelID = @channelId
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const channelInfoResult = await pool
            .request()
            .input('channelId', sql.Int, channelId)
            .query(channelInfoQuery);

        if (channelInfoResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        const channel = channelInfoResult.recordset[0];

        // Check if the channel is private
        if (channel.Visibility === 'Private') {
            // If the channel is private, query to retrieve a list of members
            const channelMembersQuery = `
                SELECT GM.AccountID, A.DisplayName
                FROM ChannelMembers CM
                JOIN GroupMembers GM ON CM.MemberID = GM.MemberID
                JOIN Accounts A ON GM.AccountID = A.AccountID
                WHERE CM.ChannelID = @channelId
            `;

            const channelMembersResult = await pool
                .request()
                .input('channelId', sql.Int, channelId)
                .query(channelMembersQuery);

            const members = channelMembersResult.recordset.map((member) => ({
                memberId: member.AccountID,
                memberName: member.DisplayName,
            }));

            // Add the list of members to the channel object
            channel.members = members;
        }

        return res.status(200).json(channel);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports={channelInfo, channelList, deleteChannel, createChannel, addMember, removeMember, updateChannelName}