const express = require('express');
const router = express.Router();

//Upload avatar
router.post('/upload', avatarController.uploadAvatar);


//Change avatar
router.put('/change', avatarController.changeAvatar);

//Get avatar
router.get('/:userId', avatarController.getAvatar);
modile.exports = router;