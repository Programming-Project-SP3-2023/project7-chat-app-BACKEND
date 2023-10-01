const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticateToken = require('../middleware/authenticateToken');

//routes for account options
router.put('/update-password', profileController.updatePassword);
router.put('/edit-displayname', profileController.editDisplayname);
router.get('/user-info', authenticateToken, profileController.getUserInfo);

module.exports = router;