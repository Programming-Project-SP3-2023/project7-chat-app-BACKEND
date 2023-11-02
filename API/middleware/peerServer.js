const express = require("express");
const { ExpressPeerServer } = require("peer");

const peerServer = ExpressPeerServer(server, {
	path: "/myapp",
});