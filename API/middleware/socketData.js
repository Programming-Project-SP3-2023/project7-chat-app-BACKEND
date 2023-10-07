//this whole file is going to be redone, ignore it.
const ids = [];
const sessions = [];

function getRandomID(){
    let nextId;
    do{
        nextId = Math.floor(1000+Math.random() * 9000);
    } while(ids.includes(nextId));
    ids.push(nextId);
    return nextId;
}
//gets unique chatid for 1-1 chat between users.
function getChatID(user1, user2){
    //sort userids so we can get a consistent name
    const [firstId, secondId] = [user1, user2].sort((a, b) => a - b);    
    return `chat-${firstId}-${secondId}`;
}

function findSession(sessionID){

}

module.exports = {
    ids,
    getRandomID,
    getChatID,
    findSession,

  };