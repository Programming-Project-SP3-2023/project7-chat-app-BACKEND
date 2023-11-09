const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const authenticateToken = require('../middleware/authenticateToken');

const { groupInfo, addMember, removeMember, createGroup, deleteGroup, currentGroups, editGroupName } = require('../controllers/groupController');

//get group info
router.get('/current-groups', authenticateToken, currentGroups);
router.get('/:groupId', groupInfo);
router.post('/add-member', authenticateToken, addMember);
router.post('/remove-member', authenticateToken, removeMember);
router.post('/create', authenticateToken, createGroup);
router.delete('/delete/:groupId', authenticateToken, deleteGroup);
router.post('/edit-name/:groupId', authenticateToken, editGroupName);



module.exports = router;