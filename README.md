# project7-chat-app-BACKEND

<!---------------------- Registration ---------------------------------->
## **Registration**
Registering a new account is done by sending a POST request to:
 - Https:/localhost:4000/register

Successful registration calls will return a status code of 200.

Unsuccesful registration calls will return a status code of 401.

### Example Input:

    { 
        "name": "greg",
        "email": "greg@rmit.edu.au",
        "dateOfBirth": "1990-04-20",
        "username": "greg123",
        "password": "abc123"
    }

<br>
<br>
<!---------------------- Login ---------------------------------->


## **Login**
Submitting a login request to the backend is done by sending a POST request to:
    
    Https:/localhost:4000/login

Successful login registration will return a status code of 200 and a JWT token.

Unsuccesful login registration will return a status code of 401.

### Example Input:

    { 
        "username": "greg123",
        "password": "abc123"
    }

<br>
<br>
<!---------------------- Friendships ---------------------------------->

## **Friendships**

<!-- request -->
### Sending a friend request
Sending a friend request is called by sending a POST request to:
    
    Https:/localhost:4000/friendships/request

### Example Input:
    Headers: new Headers({
        'Authorization': 'JWT_TOKEN'
    }),
    Body: { 
        "requesterID": "4",
        "requesteeID": "5"
    }

### Response Codes
If successful, a status code of 200 will be returned.

If the friendship already exists, a status code of 401 will be returned.

If there was an error, a status code of 400 will be returned.

___

<br>

<!-- Accept -->
### Accepting a friend request
Accepting a friend request is called by sending a PUT request to:
    
    Https:/localhost:4000/friendships/accept

### Example Input:
    Headers: new Headers({
        'Authorization': 'JWT_TOKEN'
    }),
    Body: { 
        "currentUserID": "5",
        "requesterID": "4"
    }

### Response Codes
If successful, a status code of 200 will be returned.

If the friendship doesn't exist, a status code of 401 will be returned.

If there was an error, a status code of 400 will be returned.

___

<br>

<!-- Delete -->
### Deleting a friend / friendhip request
Deleting a friend or friend request is called by sending a DELETE request to:
    
    Https:/localhost:4000/friendships/delete

### Example Input:
    Headers: new Headers({
        'Authorization': 'JWT_TOKEN'
    }),
    Body: { 
        "currentUserID": "5",
        "requesterID": "4"
    }

### Response Codes
If successful, a status code of 200 will be returned.

If the friendship doesn't exist, a status code of 401 will be returned.

If there was an error, a status code of 400 will be returned.

___

<br>
<!-- Searching for friensds -->

### Searching for friends
Searching for friends is called by sending a GET request to:
    
    Https:/localhost:4000/friendships/search

### Example Input:

    { 
        "DisplayName": "name"
    }

### Response Codes
If successful, a status code of 200 will be returned and a json string containing the search results

If no users are found, a status code of 401 will be returned.

If there was an error, a status code of 400 will be returned.

___

<br>

<!-- friends List -->

### Getting a friends list / friend requests
Getting a users friendlist is called by sending a GET request to:
    
    Https:/localhost:4000/friendships/friends

### Example Input:
    Headers: new Headers({
        'Authorization': 'JWT_TOKEN'
    }),
    Body: { 
        "currentUserID": "5",
        "status": "Pending" <-- for active friendships, status will be "Active" -->
    }

### Response Codes
If successful, a status code of 200 will be returned and a json string the users friends as below:

    "userList": [
    [
        {
            "AccountID": 4,
            "Email": "matthew@rmit.edu.au",
            "DisplayName": "name"
        }
    ]

If no friendships found, a status code of 401 will be returned.

If there was an error, a status code of 400 will be returned.

___

<br>

<!---------------------- Avatars ---------------------------------->
## Avatars
<!-- upload Avatar -->
### uploading an avatar
Post request to:
    
    Https:/localhost:4000/avatar/upload

### Example Input
    Headers: new Headers({
        'Authorization': 'JWT_TOKEN'
    }),
    Body: { 
        "currentUserID": "5",
        "avatarData": "avatarData"
    }

<!-- Get Avatar -->
### Getting a avatar
    
    Https:/localhost:4000/avatar/:userId

### Example Input
    Headers: new Headers({
        'Authorization': 'JWT_TOKEN'
    }),
    Body: { 
        "AccountID": "5",
        "avatarData": "avatarData"
    }


<!---------------------- Profiles ---------------------------------->
## Profiles
<!-- update password -->
### upadting a password
PUT request to:
    
    Https:/localhost:4000/profile/update-password

### Example Input
    Body: { 
        "AccountID": "5",
        "currentPassword": "password01",
        "newPassword": "newPassword01",
    }

<!-- update display name -->
### upadting a display name
PUT request to:
    
    Https:/localhost:4000/profile/edit-displayname

### Example Input
    Body: { 
        "currentUserID": "5",
        "newDisplayName": "Bill Nye"
    }


<!-- update password -->
### get user info
GET request to:
    
    Https:/localhost:4000/profile/user-info

### Example Input
    Body: { 
        "currentUserID": "1234"
    }

### Example output
    {
        "email": "slimshaddy@gmail.com"
        "displayName": "Real Slim"
        "dob": "1972-10-17"
    }

<!---------------------- SocketIO Messages ---------------------------------->

<!-------- Connection -------->

### On chat page load, set up the connection using
const socket = io('{{SERVER_ADDRESS:4000}}', {autoConnect: false});
### Autoconnect false because we want to connect with our accountID

### Set variables inside socket as so. AccountID will be used to identify users, 
### username is just for user friendly display
socket.auth = {accountID, username};
socket.connect();

<!-------- Back end listeners and emits -------->

<!-- Friend Status (Online friends) -->

### Emit to this to Request list of currently connected friends
socket.on("getOnlineFriends", () => {
    
    })
### Returns list of friends accountIDs
socket.emit("onlineFriends", friends);



<!-- Connecting to chat -->

### Connect to chat using chatID, connects user to the correct chat channel for messaging
### ChatID should be available from the friends list POST request.
socket.on("connectChat", ({ chatID }) => {
    })
### Returns error if chat is not selected due to server error.
## Returns full chat history for relevant chatID EG:
[
  [
    {
      MessageID: 2,
      ChatID: 10001001,
      MessageBody: 'Testing Message',
      SenderID: 1000,
      TimeSent: 2023-10-11T09:10:05.057Z
    },
    {
      MessageID: 3,
      ChatID: 10001001,
      MessageBody: 'Testing Message',
      SenderID: 1000,
      TimeSent: 2023-10-11T09:10:05.057Z
    },
    {
      MessageID: 1,
      ChatID: 10001001,
      MessageBody: 'Hello!',
      SenderID: 1000,
      TimeSent: 2023-10-11T09:05:05.057Z
    }
  ]
]



<!-- Messaging to chat -->

### Emit messages with privateMessage, no need to include chatID, this is stored when you connect to one. Just send message and timestamp.
### Returns error if no chat is selected.
socket.on("privateMessage", ({ message, timestamp }) => {
    
})

## Sends message to chat channel, sends message, from:username, and timestamp
socket.to(chatID).emit("messageResponse", {

});

## Broadcasts when user is typing
socket.on("typing", (data) => socket.broadcast.emit("typingResponse", data));

## alerts all currently connected users to this socket's connection. use to update online status dynamically 
socket.broadcast.emit("userConnected", {
    userID: socket.accountID,
    username: socket.username,
});


