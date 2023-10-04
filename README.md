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

    { 
        "requesterID": "4",
        "requesteeID": "5",
        "JWT Token": "TokenString"
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

    { 
        "currentUserID": "5",
        "requesterID": "4",
        "JWT Token": "TokenString"
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

    { 
        "currentUserID": "5",
        "requesterID": "4",
        "JWT Token": "TokenString"
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

    { 
        "currentUserID": "5",
        "status": "Pending",  <-- for active friendships, status will be "Active" -->
        "JWT Token": "TokenString"
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
