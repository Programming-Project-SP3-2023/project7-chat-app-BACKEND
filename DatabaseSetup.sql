/****** Accounts ******/
CREATE TABLE [dbo].[Accounts](
	AccountID int NOT NULL PRIMARY KEY,
	Email varchar(50) NOT NULL,
	DisplayName varchar(50) NOT NULL,
	Dob date NOT NULL,
	Avatar varchar(max) NOT NULL,
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
	RequesterID int NOT NULL,
	AdresseeID int NOT NULL,
	Status varchar(50) NOT NULL,
	FOREIGN KEY (RequesterID) REFERENCES Accounts(AccountID),
	FOREIGN KEY (AdresseeID) REFERENCES Accounts(AccountID),
	CONSTRAINT PK_Friendships PRIMARY KEY (RequesterID, AdresseeID)
)

/****** Groups ******/
CREATE TABLE [dbo].[Groups](
	GroupID int NOT NULL PRIMARY KEY,
	GroupName varchar(50) NOT NULL,
)

/****** GroupMembers ******/
CREATE TABLE [dbo].[GroupMembers](
	MemberID int NOT NULL,
	AccountID int NOT NULL,
	GroupID int NOT NULL,
	Role varchar(50) NOT NULL,
	Status varchar(50) NOT NULL,
	FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID),
	FOREIGN KEY (GroupID) REFERENCES Groups(GroupID),
	CONSTRAINT PK_GroupMembers PRIMARY KEY (MemberID)
)

/****** Channels ******/
CREATE TABLE [dbo].[Channels](
	ChannelID int NOT NULL PRIMARY KEY,
	GroupID int NOT NULL,
	ChannelType varchar(50) NOT NULL,
	Visibility varchar(50) NOT NULL,
	FOREIGN KEY (GroupID) REFERENCES Groups(GroupID)
)

/****** Channel Members ******/
CREATE TABLE [dbo].[ChannelMembers](
	MemberID int NOT NULL,
	ChannelID int NOT NULL,
	FOREIGN KEY (MemberID) REFERENCES GroupMembers(MemberID),
	FOREIGN KEY (ChannelID) REFERENCES Channels(ChannelID),
	CONSTRAINT PK_ChannelMembers PRIMARY KEY (MemberID, ChannelID)
)