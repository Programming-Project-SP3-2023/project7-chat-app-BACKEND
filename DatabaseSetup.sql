/****** Accounts ******/
CREATE TABLE [dbo].[Accounts](
	AccountID int NOT NULL IDENTITY(1000,1),
	Email varchar(50) NOT NULL,
	DisplayName varchar(50) NOT NULL,
	Dob date NOT NULL,
	Avatar varchar(max),
	PRIMARY KEY (AccountID)
)

/****** Logins ******/
CREATE TABLE [dbo].[Logins](
	AccountID int NOT NULL PRIMARY KEY,
	Username varchar(50) NOT NULL,
	PasswordHash varchar(max) NOT NULL,
	FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID)
)

/****** Friendships ******/
CREATE TABLE [dbo].[Friendships](
	FriendshipID int NOT NULL PRIMARY KEY,
	RequesterID int NOT NULL,
	AddresseeID int NOT NULL,
	Status varchar(50) NOT NULL,
	FOREIGN KEY (RequesterID) REFERENCES Accounts(AccountID),
	FOREIGN KEY (AddresseeID) REFERENCES Accounts(AccountID)
)

/****** Groups ******/
CREATE TABLE [dbo].[Groups](
    GroupID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    GroupName varchar(50) NOT NULL,
    GroupAvatar varchar(max)
);

/****** GroupMembers ******/
CREATE TABLE [dbo].[GroupMembers](
    MemberID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    AccountID int NOT NULL,
    GroupID int NOT NULL,
    Role varchar(50) NOT NULL,
    FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID),
    FOREIGN KEY (GroupID) REFERENCES Groups(GroupID)
);


/****** Channels ******/
CREATE TABLE [dbo].[Channels](
    ChannelID INT PRIMARY KEY IDENTITY(1,1),
    GroupID int NOT NULL,
    ChannelName varchar(100) NOT NULL,
    ChannelType varchar(50) NOT NULL,
    Visibility varchar(50) NOT NULL,
    FOREIGN KEY (GroupID) REFERENCES Groups(GroupID)
);


/****** Channel Members ******/
CREATE TABLE [dbo].[ChannelMembers](
    MemberID int NOT NULL,
    ChannelID int NOT NULL,
    FOREIGN KEY (MemberID) REFERENCES GroupMembers(MemberID),
    FOREIGN KEY (ChannelID) REFERENCES Channels(ChannelID),
    CONSTRAINT PK_ChannelMembers PRIMARY KEY (MemberID, ChannelID)
);
/****** Avatars ******/
CREATE TABLE [dbo].[Avatars](
	AvatarID int NOT NULL IDENTITY(1,1),
	AccountID int NOT NULL,
	AvatarData varchar(max) NOT NULL,
	PRIMARY KEY (AvatarID),
	FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID)
)
/*			Messages		*/
CREATE TABLE [dbo].[Messages](
	MessageID int NOT NULL PRIMARY KEY IDENTITY(1,1),
	ChatID int NOT NULL,
	MessageBody varchar(50),
	SenderID int NOT NULL,
	TimeSent datetime NOT NULL,
	FOREIGN KEY (ChatID) REFERENCES Friendships(FriendshipID)
)