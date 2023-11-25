const express = require("express");
const sql = require("mssql");
const sqlConfig = require("../config");
const groupUtils = require("../middleware/groupUtils");
const { stringify } = require("querystring");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();

// Return list of group IDs for a user
const currentGroups = async (req, res) => {
  try {
    // Account ID from req with token data
    const userId = req.user.AccountID;
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    // Get IDs for the user
    const currentGroupsQuery = `
            SELECT GroupID
            FROM GroupMembers
            WHERE AccountID = @AccountID
        `;

    const currentGroupsResult = await pool
      .request()
      .input("AccountID", sql.Int, userId)
      .query(currentGroupsQuery);

    // Get group IDs
    const groupIds = currentGroupsResult.recordset.map((row) => row.GroupID);

    return res.status(200).json({ groupIds });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Add a user to a group via email
const addMember = async (req, res) => {
  try {
    // Get data from the req
    const { email, groupId } = req.body;

    // Validate if the user is the group admin
    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, groupId) == false){
      return res.status(403).json({ message: "Unauthorized" });
    }

    //db connect
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    //get accounttID of user with specified email
    const getUserQuery = `
        SELECT AccountID
        FROM Accounts
        WHERE Email = @email
        `;
    const userResult = await pool
      .request()
      .input("email", sql.VarChar(50), email)
      .query(getUserQuery);
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const accountId = userResult.recordset[0].AccountID;

    // Check to see if the user is a member of the group
    if(await groupUtils.isUserGroupMember(accountId, groupId) == true){
      return res.status(404).json({ message: "Member already in the group" });
    }

    //add user to group
    const addMemberQuery = `
        INSERT INTO GroupMembers (AccountID, GroupID, Role)
        VALUES (@accountId, @groupId, 'Member')
        `;
    await pool
      .request()
      .input("accountId", sql.Int, accountId)
      .input("groupId", sql.Int, groupId)
      .query(addMemberQuery);
    return res
      .status(200)
      .json({ message: "User added to group successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const removeMember = async (req, res) => {
  try {
    // connect to the database
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    const { accountId, groupId } = req.body;

    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, groupId) == false){
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check to see if the user is a member of the group
    if(await groupUtils.isUserGroupMember(accountId, groupId) == false){
      return res.status(403).json({ message: "User doesn't exist in group" });
    }

    //remove member
    const removeMemberQuery = `
        DELETE FROM GroupMembers
        WHERE AccountID = @accountId
        AND GroupID = @groupId
        `;
    await pool
      .request()
      .input("accountId", sql.Int, accountId)
      .input("groupId", sql.Int, groupId)
      .query(removeMemberQuery);

    return res.status(200).json({ message: "Member removed from the group" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//returns all group info including a members list
const groupInfo = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Check to see if the user is a member of the group
    // if(await groupUtils.isUserGroupMember(req.user.accountID, groupId) == false){
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    // db
    const pool = await sql.connect(sqlConfig.returnServerConfig());
    // get group info
    const groupInfoQuery = `
            SELECT G.GroupName, G.GroupAvatar, GM.MemberID, GM.AccountID, A.DisplayName, GM.Role, A.Avatar
            FROM Groups G
            JOIN GroupMembers GM ON G.GroupID = GM.GroupID
            JOIN Accounts A ON GM.AccountID = A.AccountID
            WHERE G.GroupID = @groupId
        `;

    const groupInfoResult = await pool
      .request()
      .input("groupId", sql.Int, groupId)
      .query(groupInfoQuery);
    if (groupInfoResult.recordset.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    // get members array
    const members = [];
    groupInfoResult.recordset.forEach((record) => {
      members.push({
        MemberID: record.MemberID,
        AccountID: record.AccountID,
        MemberName: record.DisplayName,
        Role: record.Role,
        avatar: record.Avatar,
      });
    });

    // get group name, avatar, and member AccountIDs from the query result
    const groupInfo = {
      groupID: groupId,
      groupName: groupInfoResult.recordset[0].GroupName,
      groupAvatar: groupInfoResult.recordset[0].GroupAvatar,
      GroupMembers: members,
    };

    return res.status(200).json(groupInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    console.log(groupId);
    console.log(req.user.accountID);

    // if(await groupUtils.isUserGroupAdmin(req.user.accountID, groupId) == false){
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    //create a transaction to commit all removals at once
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    // delete Channel Messages
    const deleteChannelMessagesQuery =`
    DELETE FROM ChannelMessages
    WHERE ChannelID IN (
      SELECT ChannelID FROM Channels WHERE GroupID = @groupId
    );
    `;
    await transaction
    .request()
    .input("groupId", sql.Int, groupId)
    .query(deleteChannelMessagesQuery);
    // delete Channel Members
    const deleteChannelMembersQuery = `
      DELETE FROM ChannelMembers
      WHERE ChannelID IN (
        SELECT ChannelID FROM Channels WHERE GroupID = @groupId
      );
    `;
    await transaction
      .request()
      .input("groupId", sql.Int, groupId)
      .query(deleteChannelMembersQuery);

    // delete Channels
    const deleteChannelsQuery = `
      DELETE FROM Channels WHERE GroupID = @groupId;
    `;
    await transaction
      .request()
      .input("groupId", sql.Int, groupId)
      .query(deleteChannelsQuery);

    // delete Group Members
    const deleteGroupMembersQuery = `
      DELETE FROM GroupMembers WHERE GroupID = @groupId;
    `;
    await transaction
      .request()
      .input("groupId", sql.Int, groupId)
      .query(deleteGroupMembersQuery);

    // delete Group
    const deleteGroupQuery = `
      DELETE FROM Groups WHERE GroupID = @groupId;
    `;
    await transaction
      .request()
      .input("groupId", sql.Int, groupId)
      .query(deleteGroupQuery);

    // complete transaction
    await transaction.commit();

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error(error);
    if (transaction) {
      await transaction.rollback();
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//edit a group's name
const editGroupName = async (req, res) => {
  try {
    // connect to DB
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    //get data from the request
    const groupId = req.params.groupId;
    const { newGroupName } = req.body;

    // Validates if the user is an admin
    if(await groupUtils.isUserGroupAdmin(req.user.AccountID, groupId) == false){
      return res.status(403).json({ message: "Unauthorized" });
    }

    // update group name in the database
    const updateGroupNameQuery = `
      UPDATE Groups
      SET GroupName = @newGroupName
      WHERE GroupID = @groupId
    `;

    await pool
      .request()
      .input("newGroupName", sql.NVarChar(50), newGroupName)
      .input("groupId", sql.Int, groupId)
      .query(updateGroupNameQuery);

    return res.status(200).json({ message: "Group name updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const createGroup = async (req, res) => {
  try {
    // Get group details from the request body
    const { groupName, groupAvatar } = req.body;

    // verify the user in the group admin
    if (!groupName) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Get the creator's AccountID from the authenticated token
    const creatorAccountId = req.user.AccountID;

    // db connect
    const pool = await sql.connect(sqlConfig.returnServerConfig());


    const query = `
     INSERT INTO Groups (GroupName, GroupAvatar) 
     VALUES (@groupName, @groupAvatar); 
     SELECT SCOPE_IDENTITY() AS NewGroupID
   `;

    const request = pool
      .request()
      .input("groupName", sql.NVarChar(50), groupName);

    // add groupAvatar input if it's provided
    if (groupAvatar) {
      request.input("groupAvatar", sql.NVarChar, groupAvatar);
    } else {
      request.input("groupAvatar", sql.NVarChar, groupAvatar);
    }

    const groupResult = await request.query(query);

    const groupId = groupResult.recordset[0].NewGroupID;

    // Add the creator as an admin to the GroupMembers table
    await pool
      .request()
      .input("creatorAccountId", sql.Int, creatorAccountId)
      .input("groupId", sql.Int, groupId)
      .input("role", sql.NVarChar(50), "Admin")
      .query(
        "INSERT INTO GroupMembers (AccountID, GroupID, Role) VALUES (@creatorAccountId, @groupId, @role)"
      );

      //make two channels: Meetings(Voice) and General Chat (Chat)
      const createChannel = async (channelName, channelType) => {
        const createChannelQuery = `
          INSERT INTO Channels (GroupID, ChannelType, Visibility, ChannelName)
          VALUES (@groupId, @channelType, 'Public', @channelName);
          SELECT SCOPE_IDENTITY() AS NewChannelID;
        `;
  
        const channelCreationResult = await pool
          .request()
          .input("groupId", sql.Int, groupId)
          .input("channelType", sql.NVarChar(50), channelType)
          .input("channelName", sql.NVarChar(100), channelName)
          .query(createChannelQuery);
  
        return channelCreationResult.recordset[0].NewChannelID;
      };

      // Create General chat (Chat) channel
      const generalChatChannelId = await createChannel("General Chat", "Chat");

      // Create Meetings (Voice) channel
      const meetingsChannelId = await createChannel("Meetings", "Voice");
  
      return res
        .status(201)
        .json({
          message: "Group created successfully",
          groupID: groupId,
          meetingsChannelID: meetingsChannelId, 
          generalChatChannelID: generalChatChannelId, 
        });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  deleteGroup,
  createGroup,
  removeMember,
  groupInfo,
  currentGroups,
  addMember,
  editGroupName,
};
