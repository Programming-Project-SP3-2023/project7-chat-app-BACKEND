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
        const { groupName, creatorAccountId, channelType, visibility } = req.body;

        // Check if the creator is an admin of the group
        const isAdminQuery = `
            SELECT 1
            FROM GroupMembers
            WHERE GroupID = @groupId
            AND AccountID = @creatorAccountId
            AND Role = 'Admin'
        `;

        const pool = await sql.connect(sqlConfig.returnServerConfig());
        const isAdminResult = await pool
            .request()
            .input('groupId', sql.Int, groupId)
            .input('creatorAccountId', sql.Int, creatorAccountId)
            .query(isAdminQuery);

        if (isAdminResult.rowsAffected[0] !== 1) {
            return res.status(403).json({ message: 'You do not have permission to create a channel in this group' });
        }

        // Proceed with creating the channel
        const createChannelQuery = `
            INSERT INTO Channels (GroupID, ChannelType, Visibility)
            VALUES (@groupId, @channelType, @visibility)
        `;

        await pool
            .request()
            .input('groupId', sql.Int, groupId)
            .input('channelType', sql.VarChar(50), channelType)
            .input('visibility', sql.VarChar(50), visibility)
            .query(createChannelQuery);

        return res.status(201).json({ message: 'Channel created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};



//Delete a channel
const deleteChannel = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//Add member to channel
const addMember = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//Remove member from a channel
const removeMember = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//List all channels within a grp
const channelList = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//Get specific channel info
const channelInfo = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
module.exports={channelInfo, channelList, deleteChannel, createChannel, addMember, removeMember}