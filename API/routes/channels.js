const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const authenticateToken = require('../middleware/authenticateToken');
const friendshipController = require('../controllers/channelController')

var jsonparser = bodyParser.json();

//Create a channel within a grp
router.post('/groups/:groupId/channels', authenticateToken, createChannel);
//Delete a channel within a grp
router.delete('/groups/:groupId/channels/:channelId', authenticateToken, removeChannel);
//Add members to channel
router.post('/groups/:groupId/channels/:channelId/members', authenticateToken, addMembersToChannel);
//Remove members from a channel
router.delete('/groups/:groupId/channels/:channelId/members/:userId', authenticateToken, removeUserFromChannel);
//List all channels within a group
router.get('/groups/:groupId/channels', authenticateToken, getAllChannelsForGroup);
//get specific channel information
router.get('/groups/:groupId/channels/:channelId', authenticateToken, getChannelInfo);


module.exports = router;