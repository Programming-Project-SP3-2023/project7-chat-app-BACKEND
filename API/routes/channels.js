const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const authenticateToken = require('../middleware/authenticateToken');
const channelController = require('../controllers/channelController')

//Create a channel within a group
router.post('/groups/:groupId/channels', authenticateToken, channelController.createChannel);

//delete a channel
router.delete('/groups/:groupId/channels/:channelId', authenticateToken, channelController.deleteChannel);

//add a member to a channel
router.post('/groups/:groupId/channels/:channelId/members', authenticateToken, channelController.addMember);

//delete a member from a channel
router.delete('/groups/:groupId/channels/:channelId/members/:userId', authenticateToken, channelController.removeMember);

//get a list of all channels from the specified group
router.get('/groups/:groupId/channels', authenticateToken, channelController.channelList);

//get the specified channel info
router.get('/groups/:groupId/channels/:channelId', authenticateToken, channelController.channelInfo);

//update a channel name
router.put('/groups/:groupId/channels/:channelId/name', authenticateToken, channelController.updateChannelName);

module.exports = router;