const express = require('express');
const router = express.Router();
const sql = require('mssql');
const sqlConfig = require('../config');
const authenticateToken = require('../middleware/authenticateToken');
const channelController = require('../controllers/channelController')

//Create a channel within a grp
router.post('/groups/:groupId/channels', authenticateToken, channelController.createChannel);
router.delete('/groups/:groupId/channels/:channelId', authenticateToken, channelController.deleteChannel);
router.post('/groups/:groupId/channels/:channelId/members', authenticateToken, channelController.addMember);
router.delete('/groups/:groupId/channels/:channelId/members/:userId', authenticateToken, channelController.removeMember);
router.get('/groups/:groupId/channels', authenticateToken, channelController.channelList);
router.get('/groups/:groupId/channels/:channelId', authenticateToken, channelController.channelInfo);
router.put('/groups/:groupId/channels/:channelId/name', authenticateToken, channelController.updateChannelName);



module.exports = router;