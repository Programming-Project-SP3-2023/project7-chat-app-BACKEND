const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();




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
    module.exports = router;