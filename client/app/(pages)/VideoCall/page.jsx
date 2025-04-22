"use client";
import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { PiPhoneCall } from "react-icons/pi";
import { MdOutlineVideoCall } from "react-icons/md";
import { BiVolumeMute } from "react-icons/bi";
import { CiVideoOff } from "react-icons/ci";
import toast from "react-hot-toast";

export default function VideoCall({ socket, userPhoneNumber, toPhoneNumber }) {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerPhone, setCallerPhone] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [calling, setCalling] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState("00:00");
  const [audioCall, setAudioCall] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const timerIntervalRef = useRef();

  // Completely reset stream when call ends
  const cleanupStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (myVideo.current) myVideo.current.srcObject = null;
    if (userVideo.current) userVideo.current.srcObject = null;
    setRemoteStream(null);
  };

  // Initialize media stream for both local and remote
  const initializeStream = async () => {
    cleanupStream();
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(currentStream);
      return currentStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      toast.error("Could not access camera or microphone", { duration: 200 });
      return null;
    }
  };

  // Centralized socket listeners & initial stream setup
  useEffect(() => {
    const setupSocketListeners = () => {
      socket.on("receive-call", (data) => {
        console.log("Receiving call from:", data.from);
        setReceivingCall(true);
        setCallerPhone(data.from);
        setCallerSignal(data.signal);
      });

      socket.on("call-rejected", () => {
        console.log("Call was rejected");
        toast.error("Call Ended/Rejected", { duration: 200 });
        endCall();
      });

      socket.on("call-answered", (data) => {
        console.log("Call was answered, processing signal");
        setCallAccepted(true);
        if (connectionRef.current) {
          connectionRef.current.signal(data.signal);
        }
      });
    };

    (async () => {
      await initializeStream();
      setupSocketListeners();
    })();

    return () => {
      ["receive-call", "call-rejected", "call-answered"].forEach((evt) => {
        socket.off(evt);
      });
      clearInterval(timerIntervalRef.current);
      cleanupStream();
      if (connectionRef.current) {
        connectionRef.current.destroy();
        connectionRef.current = null;
      }
    };
  }, [socket]);

  // Show incoming call notification
  useEffect(() => {
    if (callerSignal && receivingCall && callerPhone) {
      notify(callerPhone);
    }
  }, [callerSignal, receivingCall, callerPhone]);

  // Call duration timer
  useEffect(() => {
    if (callAccepted) {
      const start = Date.now();
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const seconds = String(elapsed % 60).padStart(2, "0");
        setCallDuration(`${minutes}:${seconds}`);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setCallDuration("00:00");
    }
  }, [callAccepted]);

  // Attach local stream to video element when ready
  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
      myVideo.current.onloadedmetadata = () => myVideo.current.play();
    }
  }, [stream]);

  // Attach remote stream to video element when ready
  useEffect(() => {
    if (remoteStream && userVideo.current) {
      userVideo.current.srcObject = remoteStream;
      userVideo.current.onloadedmetadata = () => userVideo.current.play();
    }
  }, [remoteStream]);

  const callUser = async ({toPhone, isAudio}) => {
    console.log("Initiating call to:", toPhone);
    if (isAudio) {
      setAudioCall(isAudio);
      toggleVideo();
    }
    const currentStream = await initializeStream();
    if (!currentStream) return;

    setCalling(true);

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
    });

    peer.on("signal", (data) => {
      socket.emit("call-user", {
        signal: data,
        to: toPhone,
        from: userPhoneNumber,
      });
    });

    peer.on("stream", (s) => {
      console.log("Received remote stream as caller");
      setRemoteStream(s);
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
      toast.error("Connection error", { duration: 200 });
    });

    peer.on("close", () => {
      console.log("Peer connection closed");
    });

    if (connectionRef.current) connectionRef.current.destroy();
    connectionRef.current = peer;
  };

  const answerCall = async ({ callNotification }) => {
    toast.dismiss(callNotification);
    console.log("Answering call from:", callerPhone);
    const currentStream = await initializeStream();
    if (!currentStream) return;

    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream,
    });

    peer.on("signal", (data) => {
      socket.emit("answer-call", {
        signal: data,
        to: callerPhone,
      });
    });

    peer.on("stream", (s) => {
      console.log("Received remote stream as answerer");
      setRemoteStream(s);
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
      toast.error("Connection error", { duration: 200 });
    });

    peer.on("close", () => {
      console.log("Peer connection closed");
    });

    peer.signal(callerSignal);

    if (connectionRef.current) connectionRef.current.destroy();
    connectionRef.current = peer;
  };

  const rejectCall = ({ callNotification }) => {
    toast.dismiss(callNotification);
    const targetPhone = callerPhone || toPhoneNumber;
    if (targetPhone) {
      console.log("Rejecting call to:", targetPhone);
      socket.emit("reject-call", { to: targetPhone });
    }
    endCall();
  };

  const endCall = () => {
    console.log("Ending call");
    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null;
    }
    cleanupStream();
    setReceivingCall(false);
    setCallAccepted(false);
    setCalling(false);
    setCallerSignal(null);
    setCallerPhone("");
    clearInterval(timerIntervalRef.current);
    setCallDuration("00:00");
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setAudioEnabled(track.enabled);
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setVideoEnabled(track.enabled);
      });
    }
  };
  const notify = (fromUser) => {
    const callNotification = toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img
                  className="h-10 w-10 rounded-full"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixqx=6GHAjsWpt9&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80"
                  alt="Caller Avatar"
                />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Incoming Call
                </p>
                <p className="mt-1 text-sm text-gray-500">From: {fromUser}</p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => answerCall({ callNotification })}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                  >
                    Answer
                  </button>
                  <button
                    onClick={() => rejectCall({ callNotification })}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: 8000,
      }
    );
  };

  if (!calling && !callAccepted) {
    return (
      <div
        className={
          toPhoneNumber === undefined
            ? "hidden"
            : "flex gap-4 justify-center items-center"
        }
      >
        <PiPhoneCall
          className="w-7 h-7 hover:cursor-pointer"
          onClick={() => callUser({toPhone:toPhoneNumber,isAudio : true})}
        />
        <MdOutlineVideoCall
          className="w-8 h-8 hover:cursor-pointer"
          onClick={() => callUser({toPhone:toPhoneNumber, isAudio : false})}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 bg-black flex flex-col justify-center items-center">
      {/* Remote Video */}
      <video
        ref={userVideo}
        autoPlay
        playsInline
        className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg"
      />
      {/* Local Video */}
      <video
        ref={myVideo}
        autoPlay
        muted
        playsInline
        className="max-w-[20vw] max-h-[20vh] w-auto h-auto object-contain border border-white rounded-lg fixed bottom-4 left-4"
      />
      {/* Control Buttons & Timer */}
      <div className="flex gap-4 fixed bottom-6 z-20 backdrop-blur-md bg-black/30 p-6 items-center rounded-xl shadow-lg">
        <PiPhoneCall
          className="hover:cursor-pointer w-8 h-8 text-red-600"
          onClick={rejectCall}
        />
        <BiVolumeMute
          className={`hover:cursor-pointer w-8 h-8 ${
            audioEnabled ? "text-green-500" : "text-red-500"
          }`}
          onClick={toggleAudio}
        />
        {!audioCall && (
          <CiVideoOff
            className={`hover:cursor-pointer w-8 h-8 ${
              videoEnabled ? "text-green-500" : "text-red-500"
            }`}
            onClick={toggleVideo}
          />
        )}
        <span className="text-white font-mono text-sm">{callDuration}</span>
      </div>
    </div>
  );
}
