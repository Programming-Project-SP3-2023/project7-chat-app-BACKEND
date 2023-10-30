import { Peer } from "peerjs";

const peerOptions = {
    host: "localhost",
    port: 4000,
    path: "/myapp"
}

//create the peer
const peer = new Peer("1234", peerOptions);

//connect to another peer
navigator.mediaDevices.getUserMedia(
	{ video: false, audio: true },
	(stream) => {
		const call = peer.call("another-peers-id", stream);
		call.on("stream", (remoteStream) => {
			// Show stream in some <video> element.
		});
	},
	(err) => {
		console.error("Failed to get local stream", err);
	},
);

//receive connections from another peer
peer.on("call", (call) => {
	navigator.mediaDevices.getUserMedia(
		{ video: false, audio: true },
		(stream) => {
			call.answer(stream); // Answer the call with an A/V stream.
			call.on("stream", (remoteStream) => {
				// Show stream in some <video> element.
			});
		},
		(err) => {
			console.error("Failed to get local stream", err);
		},
	);
});