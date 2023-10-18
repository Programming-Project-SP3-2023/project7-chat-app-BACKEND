const http = require('http');
const app = require('./app');
const config = require('./config')
const port = 4000;

const server = http.createServer(app);
const socketHandler = require('./middleware/socketHandler');

socketHandler.initialiseSockets(server);



server.listen(port);
