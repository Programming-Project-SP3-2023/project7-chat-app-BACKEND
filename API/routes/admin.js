const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authenticateToken');

//get accounts list
router.get('/accounts', authenticateToken, adminController.getAccounts);

//update user details
router.put('/update', authenticateToken, adminController.updateAccount);

//delete a user account
router.delete('/delete', authenticateToken, adminController.deleteAccount);

//update user password
router.put('/changePassword', authenticateToken, adminController.changePassword);

//login to the admin portal
router.post('/login', adminController.adminLogin);


module.exports = router;
