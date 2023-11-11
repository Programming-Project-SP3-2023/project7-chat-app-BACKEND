const express = require("express");
const sql = require("mssql");
const sqlConfig = require("../config");
const { stringify } = require("querystring");
const authenticateToken = require("../middleware/authenticateToken");
const router = express.Router();

//Return list of group IDs for a user

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
    const { email, groupId } = req.body;

    //db connect
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    //get acctID of user with specified email
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
    const { accountId, groupId } = req.body;

    //db
    const pool = await sql.connect(sqlConfig.returnServerConfig());
    const memberExistsQuery = `
        SELECT 1
        FROM GroupMembers
        WHERE AccountID = @accountId
        AND GroupID = @groupId
        `;
    const memberExistsResult = await pool
      .request()
      .input("accountId", sql.Int, accountId)
      .input("groupId", sql.Int, groupId)
      .query(memberExistsQuery);
    if (memberExistsResult.rowsAffected[0] !== 1) {
      return res.status(404).json({ message: "Member not found" });
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
    const userAccountId = req.user.AccountID;
    const pool = await sql.connect(sqlConfig.returnServerConfig());

    //Check if user is the admin of the group
    const isAdminQuery = `
            SELECT 1
            FROM GroupMembers
            WHERE GroupID = @groupId
            AND AccountID = @userAccountId
            AND Role = 'Admin'
        `;
    const isAdminResult = await pool
      .request()
      .input("groupId", sql.Int, groupId)
      .input("userAccountId", sql.Int, userAccountId)
      .query(isAdminQuery);

    //If user is not an admin, return error
    if (isAdminResult.rowsAffected[0] !== 1) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this group" });
    }
    //delete group and related records in groupmembers
    const deleteGroupQuery = `
            DELETE FROM Groups WHERE GroupID = @groupId;
            DELETE FROM GroupMembers WHERE GroupID = @groupId;
        `;

    await pool
      .request()
      .input("groupId", sql.Int, groupId)
      .query(deleteGroupQuery);
    return res.status(200).json({ message: "Group deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//edit a group's name
const editGroupName = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { newGroupName } = req.body;

    // check if user is the admin of the group
    const isAdminQuery = `
      SELECT 1
      FROM GroupMembers
      WHERE GroupID = @groupId
      AND AccountID = @userAccountId
      AND Role = 'Admin'
    `;
    const pool = await sql.connect(sqlConfig.returnServerConfig());
    const isAdminResult = await pool
      .request()
      .input("groupId", sql.Int, groupId)
      .input("userAccountId", sql.Int, req.user.AccountID)
      .query(isAdminQuery);

    // if user is not an admin, return an error
    if (isAdminResult.rowsAffected[0] !== 1) {
      return res.status(403).json({
        message: "You do not have permission to update this group's name",
      });
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
  
      // Create Meetings (Voice) channel
      const meetingsChannelId = await createChannel("Meetings", "Voice");
  
      // Create General chat (Chat) channel
      const generalChatChannelId = await createChannel("General Chat", "Chat");
  
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
