const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { stringify } = require('querystring');
const friendshipController = require('../controllers/friendshipController')

var jsonparser = bodyParser.json();

//send a friend request
router.post('/request', jsonparser, (req, res, next) => {
    //check if token is valid (TODO)

    //submit friend request to the controller which returns a response status.
    friendshipController.sendRequest(req.body.requesterID, req.body.requesteeID, res);

});

//Accept a friendship request
router.put('/accept', jsonparser, (req, res, next) => {
    //check if token is valid (TODO)

    //send approval request to the controller, which returns a response
    friendshipController.acceptRequest(req.body.currentUserID, req.body.requesterID, res);
});

//delete the friendship or friendship request
router.delete('/delete', jsonparser, (req, res, next) => {
    //check if token is valid (TODO)
    
    //sends the delete request to the controller which returns a response
    friendshipController.deleteFriendship(req.body.currentUserID, req.body.OtherUserID, res);
});

//return users matching entered name
router.post('/search', jsonparser, (req, res, next) => {
    //check if token is valid (TODO)

    //send search params to the controller, which returns a list in JSON
    friendshipController.search(req.body.DisplayName, res);
});

//return a list of users friends or friendrequests
router.post('/friends', jsonparser, (req, res, next) => {
    //check if token is valid (TODO)

    //send accountID to the controller, which returns a list of friendships in JSON
    friendshipController.returnFriendsList(req.body.currentUserID, req.body.status, res);
});

module.exports = router;