const express = require("express");
const { ExpressPeerServer } = require("peer");
const http = require("http");

const app = express();

app.get("/", (req, res, next) => res.send("Hello world!"));

const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
	debug: true,
	path: "/myapp",
});

app.use("/peerjs", peerServer);

server.listen(9000);