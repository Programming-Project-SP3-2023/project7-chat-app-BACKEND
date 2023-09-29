const express = require('express');
const router = express.Router();
const avatarController = require('../../controllers/avatarController.js');
const authenticateToken = require('../../middleware/authenticateToken');


//Upload avatar
router.post('/upload', authenticateToken, avatarController.uploadAvatar);

//Get avatar
router.get('/:userId', authenticateToken, avatarController.getAvatar);
module.exports = router;