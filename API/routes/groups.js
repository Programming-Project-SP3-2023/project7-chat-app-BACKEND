const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const authenticateToken = require('../middleware/authenticateToken');

const { groupInfo, addMember, removeMember, createGroup, deleteGroup, currentGroups, editGroupName } = require('../controllers/groupController');

//get all current groups the user is a member of
router.get('/current-groups', authenticateToken, currentGroups);

//get a specific group by group ID
router.get('/:groupId', authenticateToken, groupInfo);

//add a member to a group
router.post('/add-member', authenticateToken, addMember);

//remove a member from a group
router.post('/remove-member', authenticateToken, removeMember);

//create a new group
router.post('/create', authenticateToken, createGroup);

//delete a group
router.delete('/delete/:groupId', authenticateToken, deleteGroup);

//edit a group name
router.post('/edit-name/:groupId', authenticateToken, editGroupName);



module.exports = router;