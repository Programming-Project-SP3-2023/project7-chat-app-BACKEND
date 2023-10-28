const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();





//Add a user to a group via email
const addMember = async(req, res) =>{
    try{
        const {email, groupId} = req.body;

        //db connect
        const pool = await sql.connect(sqlConfig);

        //get acctID of user with specified email
        const getUserQuery = `
        SELECT AccountID
        FROM Accounts
        WHERE Email = @email
        `;
        const userResult = await pool
        .request()
        .input('email', sql.VarChar(50), email)
        .query(getUserQuery);
        if(userResult.recordset.length === 0){
            return res.status(404).json({message: 'User not found'});
        }
        const accountId = userResult.recordset[0].AccountID;

        //add user to group
        const addMemberQuery = `
        INSERT INTO GroupMembers (AccountID, GroupID, Role, Status)
        VALUES (@accountId, @groupId, 'Member', 'Active')
        `;
        await pool
        .request()
        .input('accountId', sql.Int, accountId)
        .input('groupId', sql.Int, groupId)
        .query(addMemberQuery);
        return res.status(200).json({message: 'User added to group successfully'});
    
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};

const removeMember = async(req, res)=>{
    try{
        const {memberId, groupId} = req.body;

        //db
        const pool = await sql.connect(sqlcConfig);
        const memberExistsQuery = `
        SELECT 1
        FROM GroupMembers
        WHERE MemberID = @memberId
        AND GroupID = @groupId
        `;
        const memberExistsResult = await pool
        .request()
        .input('memberId', sql.Int, memberId)
        .input('groupId', sql.Int, groupId)
        .query(memberExistsQuery);
        if(memberExistsResult.rowsAffected[0] !== 1){
            return res.status(404).json({ message: 'Member not found'})
        }
        //remove member
        const removeMemberQuery = `
        DELETE FROM GroupMembers
        WHERE MemberID = @memberId
        AND GroupID = @groupId
        `;
        await pool
        .request()
        .input('memberId', sql.Int, memberId)
        .input('groupId', sql.Int, groupId)
        .query(removeMemberQuery);
        
        return res.status(200).json({message: 'Member removed from the group'})
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};


//returns all group info including a members list
const groupInfo = async(req, res)=>{
    try{
        const groupId = req.params.groupId;

        // db
        const pool = await sql.connect(sqlConfig);

        // get group info
        const groupInfoQuery = `
            SELECT G.GroupName, G.GroupAvatar, GM.AccountID
            FROM Groups G
            JOIN GroupMembers GM ON G.GroupID = GM.GroupID
            WHERE G.GroupID = @groupId
        `;

        const groupInfoResult = await pool
            .request()
            .input('groupId', sql.Int, groupId)
            .query(groupInfoQuery);

        if (groupInfoResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Group not found' });

        // get group name, avatar, and member AccountIDs from the query result
        const groupInfo = {
            groupName: groupInfoResult.recordset[0].GroupName,
            groupAvatar: groupInfoResult.recordset[0].GroupAvatar,
            members: groupInfoResult.recordset.map((row) => row.AccountID),
        };

        return res.status(200).json(groupInfo);

        }
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
const deleteGroup = async (req, res) => {
    try{
        const groupId = req.params.groupId;
        const userAccountId = req.user.AccountID;
        const pool = await sql.connect(sqlConfig);

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
        .input('groupId', sql.Int, groupId)
        .input('userAccountId', sql.Int, userAccountId)
        .query(isAdminQuery);

        //If user is not an admin, return error
        if(isAdminResult.rowsAffected[0] !==1){
            return res.status(403).json ({message: 'You do not have permission to delete this group'})
        }
        //Delete group and related records in groupmembers
        const deleteGroupQuery = `
            DELETE FROM Groups WHERE GroupID = @groupId;
            DELETE FROM GroupMembers WHERE GroupID = @groupId;
        `;

        await pool
        .request()
        .input('groupId', sql.Int, groupId)
        .query(deleteGroupQuery);
        return res.status(200).json({message: 'Group deleted Successfully'});
    }catch (error){
        console.error(error);
        return res.status(500).json ({message: 'Internal Server Error'});
    }
    };
//create a new group

const createGroup = async (req, res) => {
    try {
        // Get group details from the request body
        const { groupName } = req.body;
        if (!groupName) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        // Get the creator's AccountID from the authenticated token
        const creatorAccountId = req.user.AccountID;

        // Create a new database connection pool
        const pool = await sql.connect(sqlConfig);

        // Insert a new group into the Groups table
        const groupResult = await pool
            .request()
            .input('groupName', sql.NVarChar(50), groupName)
            .query('INSERT INTO Groups (GroupName) VALUES (@groupName); SELECT SCOPE_IDENTITY() AS NewGroupID');

        const groupId = groupResult.recordset[0].NewGroupID;

        // Add the creator as an admin to the GroupMembers table
        await pool
            .request()
            .input('creatorAccountId', sql.Int, creatorAccountId)
            .input('groupId', sql.Int, groupId)
            .input('role', sql.NVarChar(50), 'Admin')
            .query('INSERT INTO GroupMembers (AccountID, GroupID, Role) VALUES (@creatorAccountId, @groupId, @role)');

        return res.status(201).json({ message: 'Group created successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};
    module.exports = {deleteGroup, createGroup, removeMember, groupInfo,

    };