const sql = require("mssql");
const sqlConfig = require("../config");

// Verifies that the specified user is the admin of the group.
async function  isUserGroupAdmin(accountID, groupId){
    return new Promise(async (resolve, reject) => {
      const pool = await sql.connect(sqlConfig.returnServerConfig());
        //Check if user is the admin of the group
        const isAdminQuery = `
        SELECT 1
        FROM GroupMembers
        WHERE GroupID = @groupId
        AND AccountID = @userAccountId
        AND Role = 'Admin'`;
  
        const isAdminResult = await pool
          .request()
          .input("groupId", sql.Int, groupId)
          .input("userAccountId", sql.Int, accountID)
          .query(isAdminQuery);
  
        //If user is not an admin, return error
        if (isAdminResult.rowsAffected[0] !== 1) {
          resolve(false);
          return;
        } else {
          resolve(true);
          return;
        }
    });
}

// Verifies that the user is a group member
async function isUserGroupMember(accountID, groupId){
    return new Promise(async (resolve, reject) => {
        const pool = await sql.connect(sqlConfig.returnServerConfig());
  
        const memberExistsQuery = `
        SELECT 1
        FROM GroupMembers
        WHERE AccountID = @accountId
        AND GroupID = @groupId
        `;
        const memberExistsResult = await pool
        .request()
        .input("accountId", sql.Int, accountID)
        .input("groupId", sql.Int, groupId)
        .query(memberExistsQuery);
    
        if (memberExistsResult.rowsAffected[0] != 0) {
            resolve(true);
            return;
        } else {
            resolve(false);
            return
        }
    });
}
  
// verifies if the use is already apart of the channel
async function isUserChannelMember(AccountID, GroupID, ChannelID){
    return new Promise(async (resolve, reject) => {
        const pool = await sql.connect(sqlConfig.returnServerConfig());

        //get the users MemberID
        const query = `
        SELECT GroupMembers.MemberID, GroupMembers.GroupID, GroupMembers.AccountID, ChannelMembers.MemberID
        FROM GroupMembers
        INNER JOIN ChannelMembers ON GroupMembers.MemberID=ChannelMembers.MemberID
        WHERE AccountID = @AccountID
        AND GroupID = @GroupID
        `
        const result = await pool
        .request()
        .input("AccountID", sql.Int, AccountID)
        .input("GroupID", sql.Int, GroupID)
        .query(query);

        if (result.rowsAffected[0] != 0) {
        resolve(true);
        return;
        } else {
        resolve(false);
        return
        }
    });
}

// Verifies that the channel exists.
async function  isChannelValid(groupId, channelId){
    return new Promise(async (resolve, reject) => {
      const pool = await sql.connect(sqlConfig.returnServerConfig());
        //Check if user is the admin of the group
        const query = `
        SELECT 1
        FROM Channels
        WHERE GroupID = @groupId
        AND ChannelID = @channelId`;
  
        const result = await pool
          .request()
          .input("GroupID", sql.Int, groupId)
          .input("ChannelID", sql.Int, channelId)
          .query(query);
  
        //If user is not an admin, return error
        if (result.rowsAffected[0] !== 1) {
          resolve(false);
          return;
        } else {
          resolve(true);
          return;
        }
    });
  }


async function getMemberId(groupId, userIdToAdd){
    return new Promise(async (resolve, reject) => {

        const pool = await sql.connect(sqlConfig.returnServerConfig());

        // get the memberId for the given userIdToAdd within the current group
        const getMemberIdQuery = `
        SELECT MemberID
        FROM GroupMembers
        WHERE GroupID = @groupId
        AND AccountID = @userIdToAdd
        `;

        const getMemberIdResult = await pool
        .request()
        .input("groupId", sql.Int, groupId)
        .input("userIdToAdd", sql.Int, userIdToAdd)
        .query(getMemberIdQuery);

        console.log(getMemberIdResult);

        const memberId = getMemberIdResult.recordset[0].MemberID;

        console.log(memberId);

        resolve(memberId);
    });
}
  

module.exports = {
    isUserGroupAdmin,
    isUserGroupMember,
    isUserChannelMember,
    isChannelValid,
    getMemberId
}