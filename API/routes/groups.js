const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const authenticateToken = require('../middleware/authenticateToken');

const { groupInfo, addMember, removeMember, createGroup, deleteGroup, currentGroups, } = require('../controllers/groups');

//get group info
router.get('/:groupId', groupInfo);
router.post('/add-member', authenticateToken, addMember);
router.delete('/remove-member', authenticateToken, removeMember);
router.post('/create', authenticateToken, createGroup);
router.delete('/delete/:groupId', authenticateToken, deleteGroup);
router.get('/current-groups', authenticateToken, currentGroups);

module.exports = router;