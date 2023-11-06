import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';
import webRTCAdapter_import from "webrtc-adapter"


function App() {
  // const io = require('socket.io')+;
  //connect to socket server
  const socket = io('http://localhost:4000', { autoConnect: false });

  socket.connect() //you should receive a connected message with 'awaiting username'

  const username = "skoot";

  socket.on("connectionResponse", (connectionResponse) => {
    console.log(connectionResponse);
  });


  socket.on("userJoinVC", (peerID) => {
    console.log("test");
    console.log("connected peer: " + peerID);

    //will receive a peerID whenever someone joins a channel you are in
    //from here you can call the peerID to join them to the VC
    call(peerID);
  });

  socket.on("error", () => {
    console.log("error");
  })

  const [peerId, setPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState([]);
  const [remoteCalls, setRemoteCalls] = useState([]);
  //other users Peer IDs
  const remoteAudioRefs = useRef({});
  const remoteAudioRef = useRef(null);
  //current user
  const peerInstance = useRef(null);

  // join a VC
  const joinVC = (ChannelID, peerId) => {
    console.log(ChannelID);
    //joins you to the VC, server will check if you have access and will throw error if it fails
    socket.emit("joinVC", ChannelID);
  }

  useEffect(() => {
    const peer = new Peer();
    
    peer.on('open', (id) => {
      setPeerId(id);
    });

    //listen for peers that are calling the user
    peer.on('call', (call) => {
      var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      const remotePeerId = call.peer;
      setRemotePeers((prevPeers) => [...prevPeers, remotePeerId]);
      setRemoteCalls((prevCalls) => [...prevCalls, call]);

      getUserMedia({ video: false, audio: true }, (mediaStream) => {
        call.answer(mediaStream)
        call.on('stream', function(remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream
          remoteAudioRef.current.play();
          // remoteAudioRefs.current[call.remotePeerId] = remoteAudioRef;
        });
      });
    })

    peerInstance.current = peer;
  }, [])

  //call peers
  const call = (remotePeerId) => {
    // createDataConnection(remotePeerId);

    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    setRemotePeers((prevPeers) => [...prevPeers, remotePeerId]);

    getUserMedia({ video: false, audio: true }, (mediaStream) => {
      const call = peerInstance.current.call(remotePeerId, mediaStream);
      setRemoteCalls((prevCalls) => [...prevCalls, call]);
      
      console.log(remoteCalls);
      call.on('stream', (remoteStream) => {
        remoteAudioRef.current.srcObject = remoteStream
        remoteAudioRef.current.play();
        // remoteAudioRefs.current[remotePeerId] = remoteAudioRef;
      });
    });
  }

  const closeCalls = () => {
    console.log(remoteCalls);

    for(var i=0; i<remoteCalls.length; i++){
      remoteCalls[i].close();
    }

    remoteCalls.splice(0, remoteCalls.length);
  }

  socket.emit("connectSocket", peerId, username); //this should return an OK response to the following listener:

  //display peer ID + remote peer ID field and call button
  return (
    <div className="App">
      <h1>Current user id is {peerId}</h1>

      <button onClick={() => joinVC(3)}>Join Room 1</button>
      <button onClick={() => closeCalls()}>leave Room</button>

      
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