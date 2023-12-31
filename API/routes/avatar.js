const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/AvatarController');
const authenticateToken = require('../middleware/authenticateToken');


//Upload avatar
router.post('/upload', authenticateToken, avatarController.uploadAvatar);

//Get avatar
router.get('/:userId', authenticateToken, avatarController.getAvatar);
router.post('/upload-group-avatar', authenticateToken, avatarController.uploadGroupAvatar);
module.exports = router;