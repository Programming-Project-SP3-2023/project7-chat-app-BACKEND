const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authenticateToken');

//get accounts list
router.get('/accounts', authenticateToken, adminController.getAccounts);


//update user details
router.put('/update', authenticateToken, adminController.updateAccount);


//update user password
router.put('/upload', authenticateToken, adminController.changePassword);
module.exports = router;
