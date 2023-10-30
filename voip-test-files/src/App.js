import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';

function App() {
  // const io = require('socket.io');
  //connect to socket server
  const socket = io('http://localhost:4000', { autoConnect: false });

  socket.connect() //you should receive a connected message with 'awaiting username'

  const accountID = Math.floor(Math.random() * 10);
  const username = "skoot";
  socket.emit("connectSocket", {accountID, username}); //this should return an OK response to the following listener:

  socket.on("connectionResponse", (connectionResponse) => {
    console.log(connectionResponse);
  });


  socket.on("userJoinVC", (peerID) => {
    console.log("test");
    console.log("connected peer: " + peerID);

    //will receive a peerID whenever someone joins a channel you are in
    //from here you can call the peerID to join them to the VC
  });

  socket.on("error", () => {
    console.log("error");
  })

  const [peerId, setPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState([]);
  //other users Peer IDs
  const remoteAudioRefs = useRef({});
  const remoteAudioRef = useRef(null);
  //current user
  const peerInstance = useRef(null);
  const peer = new Peer();

  // join a VC
  const joinVC = (ChannelID) => {
    console.log(ChannelID);
    //joins you to the VC, server will check if you have access and will throw error if it fails
    socket.emit("joinVC", ChannelID);
  }

  useEffect(() => {
    // const peerOptions = {
    //     host: "echo.matthewrosin.com",
    //     port: 4000,
    //     path: "/myapp"
    // }
    

    peer.on('open', (id) => {
      setPeerId(accountID)
    });

    //listen for peers that are calling the user
    peer.on('call', (call) => {
      var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      const remotePeerId = call.peer;
      setRemotePeers((prevPeers) => [...prevPeers, remotePeerId]);

      getUserMedia({ video: false, audio: true }, (mediaStream) => {
        call.answer(mediaStream)
        call.on('stream', function(remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream
          remoteAudioRef.current.play();
          remoteAudioRefs.current[call.remotePeerId] = remoteAudioRef;
        });
      });
    })

    peerInstance.current = peer;
  }, [])

  //call peers
  const call = (remotePeerId) => {

    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    setRemotePeers((prevPeers) => [...prevPeers, remotePeerId]);

    getUserMedia({ video: false, audio: true }, (mediaStream) => {
      const call = peerInstance.current.call(remotePeerId, mediaStream)

      call.on('stream', (remoteStream) => {
        remoteAudioRef.current.srcObject = remoteStream
        remoteAudioRef.current.play();
        remoteAudioRefs.current[remotePeerId] = remoteAudioRef;
      });
    });
  }

  //display peer ID + remote peer ID field and call button
  return (
    <div className="App">
      <h1>Current user id is {accountID}</h1>

      <button onClick={() => joinVC(3)}>Join Room 1</button>
      
      <div>
        <audio ref={remoteAudioRef} />
      </div>
      <div>
        {remotePeers.map((remotePeerId) => (
          <div key={remotePeerId}>
            <h2>Remote Peer ID: {remotePeerId}</h2>
            <audio
              ref={(el) => (remoteAudioRefs.current[remotePeerId] = el)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;