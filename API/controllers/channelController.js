const express = require("express");
const sql = require("mssql");
const sqlConfig = require("../config");
const groupUtils = require("../middleware/groupUtils");
const { stringify } = require("querystring");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();

//If visibility is public no add/remove from channel
//Add/remove are only for private channel

//Create a channel
const createChannel = async (req, res) => {
  try {
    const { groupId, channelType, visibility, channelName } = req.body;

    console.log(req.user);
    console.log(groupId);


    const pool = await sql.connect(sqlConfig.returnServerConfig());
    
    // Validates if the user is an admin
    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, groupId) == false){
      return res.status(401).json({ message: "Unauthorized" });
    }

    // create the channel
    const createChannelQuery = `
            INSERT INTO Channels (GroupID, ChannelType, Visibility, ChannelName)
            VALUES (@groupId, @channelType, @visibility, @channelName);
            SELECT SCOPE_IDENTITY() AS ChannelID;
        `;

    const createChannelResult = await pool
      .request()
      .input("groupId", sql.Int, groupId)
      .input("channelType", sql.VarChar(50), channelType)
      .input("visibility", sql.VarChar(50), visibility)
      .input("channelName", sql.VarChar(100), channelName)
      .query(createChannelQuery);

    if (
      !createChannelResult.recordset ||
      createChannelResult.recordset.length === 0
    ) {
      return res.status(500).json({ message: "Failed to create the channel" });
    }

    const channelId = createChannelResult.recordset[0].ChannelID;

    console.log("channelId....", channelId);

    return res.status(201).json({
      message: "Channel created successfully",
      channelId: channelId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Change channel name
const updateChannelName = async (req, res) => {
  try {
    const { channelId, newChannelName } = req.body;

    // Validates if the user is an admin
    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, req.params.groupId) == false){
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate that he channel exists in this group
    if(await groupUtils.isChannelValid(req.params.groupId, channelId) == false){
      return res.status(404).json({ message: "Channel doesn't exist in this group" });
    }

    const pool = await sql.connect(sqlConfig.returnServerConfig());

    // Update the channel name in the database
    const updateChannelNameQuery = `
            UPDATE Channels
            SET ChannelName = @newChannelName
            WHERE ChannelID = @channelId
        `;

    await pool
      .request()
      .input("channelId", sql.Int, channelId)
      .input("newChannelName", sql.VarChar(100), newChannelName)
      .query(updateChannelNameQuery);

    return res
      .status(200)
      .json({ message: "Channel name updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a channel
const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;

    const pool = await sql.connect(sqlConfig.returnServerConfig());

    // Validates if the user is an admin
    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, req.params.groupId) == false){
      return res.status(401).json({ message: "Unauthorized" });
    }

    // check to see if channel exists
    if(await isChannelValid(req.params.groupId, channelId) == false){
      return res.status(404).json({ message: "Channel doesn't exist" });
    }

    //delete channel messages
    const deleteChannelMessagesQuery = `DELETE FROM ChannelMessages WHERE ChannelID = @channelId`;
    await pool
      .request()
      .input("channelId", sql.Int, channelId)
      .query(deleteChannelMessagesQuery);

    //delete all channel members from the channel table
    const deleteChannelMembersQuery = `DELETE FROM ChannelMembers WHERE ChannelID = @channelId`;
    await pool
      .request()
      .input("channelId", sql.Int, channelId)
      .query(deleteChannelMembersQuery);

    // If the user is an admin of the group, delete the channel
    const deleteChannelQuery = `
            DELETE FROM Channels WHERE ChannelID = @channelId
        `;

    await pool
      .request()
      .input("channelId", sql.Int, channelId)
      .query(deleteChannelQuery);

    return res.status(200).json({ message: "Channel deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const addMember = async (req, res) => {
  try {
    const { channelId, userIdToAdd } = req.body;
    const groupId = req.params.groupId;

    // Validates if the user is an admin
    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, groupId) == false){
      return res.status(403).json({ message: "Unauthorized" });
    }
    console.log("test");

    // Check if user is already in the channel
    if(groupUtils.isUserChannelMember(userIdToAdd, groupId, channelId) == false){
      return res.status(404).json({ message: "User already exists in the channel" });
    }

    // check to see if channel exists
    if(await groupUtils.isChannelValid(req.params.groupId, channelId) == false){
      return res.status(404).json({ message: "Channel doesn't exist" });
    }

    // Check to see if the user is a member of the group
    if(await groupUtils.isUserGroupMember(userIdToAdd, groupId) == false){
      return res.status(404).json({ message: "Member not found in the group" });
    }
    
    //connect to the DB
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    // If the user has permission, add the member to the channel
    const addMemberQuery = 
    `
    INSERT INTO ChannelMembers (MemberID, ChannelID)
    VALUES (@memberId, @channelId)
    `;
    
    const memberId = await groupUtils.getMemberId(groupId, userIdToAdd);
    
    await pool
      .request()
      .input("memberId", sql.Int, memberId)
      .input("channelId", sql.Int, channelId)
      .query(addMemberQuery);

    
    return res
      .status(200)
      .json({ message: "Member added to the channel successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const removeMember = async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const userIdToRemove = req.params.userId;
    const groupId = req.params.groupId;

    // Validates if the user is an admin
    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, groupId) == false){
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if the channel exists in the group
    if(await groupUtils.isChannelValid(req.params.groupId, channelId) == false){
      return res.status(404).json({ message: "Channel doesn't exist" });
    }

    // Check if user is a channel member
    if(await groupUtils.isUserChannelMember(userIdToRemove, groupId, channelId) == false){
      return res.status(404).json({ message: "User doesn't exist in the channel" });
    }

    // Get the memberId for the given userIdToRemove within the current group
    const memberId = await groupUtils.getMemberId(groupId, userIdToRemove);

    // If the user isn't found return a 404
    if (!memberId) {
      return res.status(404).json({ message: "Member not found in the group" });
    }

    // Connect to the DB
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    // Remove the member from the channel
    const removeMemberQuery = `
            DELETE FROM ChannelMembers
            WHERE MemberID = @memberId
            AND ChannelID = @channelId
        `;

    await pool
      .request()
      .input("memberId", sql.Int, memberId)
      .input("channelId", sql.Int, channelId)
      .query(removeMemberQuery);

    return res
      .status(200)
      .json({ message: "Member removed from the channel successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//List all channels within a grp
const channelList = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check to see if the user is a member of the group
    if(await groupUtils.isUserGroupMember(req.user.AccountID, groupId) == false){
      return res.status(404).json({ message: "You are not a member of this group" });
    }

    // Query to retrieve a list of channels for the specified group
    const channelListQuery = `
            SELECT C.ChannelID, C.Visibility, C.ChannelType, C.ChannelName
            FROM Channels C
            WHERE C.GroupID = @groupId
        `;

    const pool = await sql.connect(sqlConfig.returnServerConfig());
    const channelListResult = await pool
      .request()
      .input("groupId", sql.Int, groupId)
      .query(channelListQuery);

    // Return the list of channels
    const channels = channelListResult.recordset;

    return res.status(200).json(channels);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Get specific channel info
const channelInfo = async (req, res) => {
  try {
    const { channelId } = req.params;

    // Check to see if the user is a member of the group
    if(await groupUtils.isUserGroupMember(req.user.AccountID, req.params.groupId) == false){
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Check if the channel exists in the group
    if(await groupUtils.isChannelValid(req.params.groupId, channelId) == false){
      return res.status(404).json({ message: "Channel doesn't exist" });
    }

    // query to retrieve channel information, including visibility and channel ID
    const channelInfoQuery = `
            SELECT C.ChannelID, C.Visibility, C.ChannelType, C.ChannelName
            FROM Channels C
            WHERE C.ChannelID = @channelId
        `;

    const pool = await sql.connect(sqlConfig.returnServerConfig());
    const channelInfoResult = await pool
      .request()
      .input("channelId", sql.Int, channelId)
      .query(channelInfoQuery);

    if (channelInfoResult.recordset.length === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const channel = channelInfoResult.recordset[0];

    // Check if the channel is private

    // If the channel is private, query to retrieve a list of members
    const channelMembersQuery = `
                SELECT GM.AccountID, GM.Role, A.DisplayName, A.Avatar
                FROM ChannelMembers CM
                JOIN GroupMembers GM ON CM.MemberID = GM.MemberID
                JOIN Accounts A ON GM.AccountID = A.AccountID
                WHERE CM.ChannelID = @channelId
            `;

    const channelMembersResult = await pool
      .request()
      .input("channelId", sql.Int, channelId)
      .query(channelMembersQuery);

    const members = channelMembersResult.recordset.map((member) => ({
      AccountID: member.AccountID,
      MemberName: member.DisplayName,
      MemberRole: member.Role,
      avatar: member.Avatar,
    }));

    // Add the list of members to the channel object
    channel.members = members;

    return res.status(200).json(channel);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  channelInfo,
  channelList,
  deleteChannel,
  createChannel,
  addMember,
  removeMember,
  updateChannelName,
};
