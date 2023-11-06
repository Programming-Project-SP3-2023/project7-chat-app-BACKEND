const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const authenticateToken = require('../middleware/authenticateToken');
const friendshipController = require('../controllers/channelController')

var jsonparser = bodyParser.json();

//Create a channel within a grp
router.post('/groups/:groupId/channels', authenticateToken, createChannel);
router.delete('/groups/:groupId/channels/:channelId', authenticateToken, removeChannel);
router.post('/groups/:groupId/channels/:channelId/members', authenticateToken, addMembersToChannel);
router.delete('/groups/:groupId/channels/:channelId/members/:userId', authenticateToken, removeUserFromChannel);
router.get('/groups/:groupId/channels', authenticateToken, getAllChannelsForGroup);
router.get('/groups/:groupId/channels/:channelId', authenticateToken, getChannelInfo);
router.put('/groups/:groupId/channels/:channelId/name', authenticateToken, updateChannelName);



module.exports = router;