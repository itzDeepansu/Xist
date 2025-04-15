"use client";
import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

export default function VideoCall({ socket, userPhoneNumber, toPhoneNumber }) {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerPhone, setCallerPhone] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [calling, setCalling] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // Get media stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      });

    // Receive an incoming call
    socket.on("receive-call", (data) => {
      setReceivingCall(true);
      setCallerPhone(data.from);
      setCallerSignal(data.signal);
    });

    // Handle call being rejected
    socket.on("call-rejected", () => {
      setCalling(false);
      setCallAccepted(false);
      alert("Call was rejected");
    });

    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, [socket, userPhoneNumber]);

  const callUser = (toPhone) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("call-user", {
        signal: data,
        to: toPhone,
        from: userPhoneNumber,
      });
      setCalling(true);
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    // Avoid duplicate listeners
    socket.off("call-answered");
    socket.on("call-answered", (data) => {
      setCallAccepted(true);
      peer.signal(data.signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answer-call", {
        signal: data,
        to: callerPhone,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream", remoteStream);
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    peer.signal(callerSignal);

    connectionRef.current = peer;
  };

  const rejectCall = () => {
    socket.emit("reject-call", {
      to: callerPhone,
    });
    setReceivingCall(false);
    setCallAccepted(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebRTC Video Call</h1>

      <div className="flex gap-6 mb-6">
        <div className="flex flex-col items-center">
          <p className="mb-2">My Video</p>
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            className="w-80 h-60 border rounded bg-black"
          />
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-2">User Video</p>
          <video
            ref={userVideo}
            autoPlay
            playsInline
            className="w-80 h-60 border rounded bg-black"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          className={`${
            callAccepted ? "bg-red-500" : "bg-blue-400"
          } text-white px-4 py-2 rounded`}
          disabled={calling}
          onClick={() => callUser(toPhoneNumber)}
        >
          Call {toPhoneNumber}
        </button>

        {receivingCall && !callAccepted && (
          <div className="flex gap-4 items-center">
            <p className="text-gray-800">
              Incoming call from <strong>{callerPhone}</strong>
            </p>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => answerCall()}
            >
              Answer
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={rejectCall}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
