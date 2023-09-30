const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

//routes for account options
router.put('/update-password', profileController.updatePassword);
router.put('/edit-displayname', profileController.editDisplayname);

module.exports = router;