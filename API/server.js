//HTTPS
/*
const https = require('https');
const fs = require('fs');
const https_options = {
    key: fs.readFileSync("C:/Users/Administrator/Desktop/certificate/private.key"),
    cert: fs.readFileSync("C:/Users/Administrator/Desktop/certificate/certificate.crt"),
    ca: fs.readFileSync("C:/Users/Administrator/Desktop/certificate/ca_bundle.crt")
};
const app = require('./app');
const config = require('./config');
const hostname = 'echo.matthewrosin.com';
const port = 4000;

const server = https.createServer(https_options, app);
*/
//HTTP

const http = require('http');
const fs = require('fs');
const app = require('./app');
const config = require('./config');
const { ExpressPeerServer  } = require("peer");
const socketHandler = require('./middleware/socketHandler');
const port = 4000;

const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/myapp",
});

app.use("/peerjs", peerServer);

socketHandler.initialiseSockets(server);

server.listen(port);
