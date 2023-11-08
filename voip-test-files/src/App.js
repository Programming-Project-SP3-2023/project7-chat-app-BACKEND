import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { io } from 'socket.io-client';
import webRTCAdapter_import from "webrtc-adapter"


function App() {
  // const io = require('socket.io')+;
  //connect to socket server
  const socket = io('http://localhost:4000', { autoConnect: false });

  const username = Math.random() * 100;

  socket.connect() //you should receive a connected message with 'awaiting username'

  socket.on("connectionResponse", (connectionResponse) => {
    console.log(connectionResponse);
  });

  //will receive a peerID whenever someone joins a channel you are in and calls them
  socket.on("userJoinVC", (peerID) => {
    call(peerID);
  });

  socket.on("error", () => {
    console.log("error");
  })

  socket.on("userLeftVC", (peerID) => {
    closeCall(peerID);
  })

  const [peerId, setPeerId] = useState('');
  const [remotePeers, setRemotePeers] = useState([]);
  const [remoteCalls, setRemoteCalls] = useState([]);
  //other users Peer IDs
  const remoteAudioRefs = useRef([]);
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
        console.log("hi - 1");

          const audioElement = new Audio();
          audioElement.srcObject = remoteStream;

          remoteAudioRefs.current.push(audioElement);

          // remoteAudioRef.current.srcObject = remoteStream
          // remoteAudioRef.current.play();
          // addAudioElement(remoteStream);
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
      const call = peerInstance.current.call(remotePeerId, mediaStream);
      setRemoteCalls((prevCalls) => [...prevCalls, call]);
      
      console.log(call);
      call.on('stream', (remoteStream) => {
        // console.log("hi - 2");
        // const audioElement = new Audio();
        // audioElement.srcObject = remoteStream;

        // remoteAudioRefs.current.push(audioElement);
      });
    });
  }

  //close connections with all users in the room
  const closeCalls = (ChannelID) => {
    //emit to other users that the user is leaving the channel
    socket.emit("leaveVC", ChannelID);

    //close the peer connection for each user.
    for(var i=0; i<remoteCalls.length; i++){
      remoteCalls[i].close();
    }
    //clear the remote calls array
    remoteCalls.splice(0, remoteCalls.length);
  }

  // close a connection with a specific user
  const closeCall = (peerID) => {
    console.log(peerID);
    for(var i=0; i<remoteCalls.length; i++){
      if(remoteCalls[i].peer = peerID){
        console.log("removed: " + peerID);
        remoteCalls[i].close();
        remoteCalls.splice(i, 1);
      }
    }
  }

  socket.emit("connectSocket", peerId, username); //this should return an OK response to the following listener:

  //display peer ID + remote peer ID field and call button
  return (
    <div className="App">
      <h1>Current user id is {peerId}</h1>

      <button onClick={() => joinVC(3)}>Join Room 1</button>
      <button onClick={() => closeCalls(3)}>leave Room</button>

      {remoteAudioRefs.current.map((audioElement, index) => (
        <div key={index}>
          <audio ref={audioElement} autoPlay />
        </div>
      ))}

      
      {/* <div>
        <audio ref={remoteAudioRef} />
      </div> */}
      {/* <div> */}
        {/* {remotePeers.map((remotePeerId) => (
          <div key={remotePeerId}>
            <h2>Remote Peer ID: {remotePeerId}</h2>
            <audio
              ref={(el) => (remoteAudioRefs.current[remotePeerId] = el)}
            />
          </div>
        ))} */}
        {/* {remoteAudioRefs.current.map((remoteStream, index) => {
          <div key={index}>
            <audio>
              <source src={remoteStream.src} />
            </audio>
          </div>
        })} */}
      {/* </div> */}
    </div>
  );
}

export default App;