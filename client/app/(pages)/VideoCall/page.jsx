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
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerPhone, setCallerPhone] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [calling, setCalling] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState("00:00");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const timerIntervalRef = useRef();

  // Helper to initialize a new media stream.
  const initializeStream = async () => {
    // Always request a new stream if the current one is null.
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      // Reinitialize toggle states in case they were changed in a previous call.
      setAudioEnabled(true);
      setVideoEnabled(true);
      return currentStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      return null;
    }
  };

  const notify = (fromUser) =>
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-lg w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <img
                className="h-10 w-10 rounded-full"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixqx=6GHAjsWpt9&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80"
                alt=""
              />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Incoming Call!
              </p>
              <p className="mt-1 text-sm text-gray-500">{fromUser}</p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 justify-center items-center">
          <PiPhoneCall
            className="h-[60%] w-[60%] cursor-pointer"
            onClick={() => {
              toast.dismiss(t.id);
              answerCall();
            }}
          />
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              rejectCall();
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>
    ));

  useEffect(() => {
    // On first mount, initialize stream.
    (async () => {
      const currentStream = await initializeStream();
      if (!currentStream) {
        toast.error("Unable to access media devices.");
      }
    })();

    socket.on("receive-call", (data) => {
      setReceivingCall(true);
      setCallerPhone(data.from);
      setCallerSignal(data.signal);
    });

    socket.on("call-rejected", () => {
      toast.error("Call Ended/Rejected");
      endCall();
    });

    return () => {
      socket.disconnect();
      clearInterval(timerIntervalRef.current);
    };
  }, [socket]);

  useEffect(() => {
    if (callerSignal && receivingCall && callerPhone) {
      notify(callerPhone);
    }
  }, [callerSignal]);

  useEffect(() => {
    if (callAccepted) {
      // Start call timer once the call is accepted.
      const start = Date.now();
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

  // Initiates a call by ensuring a fresh stream then creating a new Peer.
  const callUser = async (toPhone) => {
    const currentStream = await initializeStream();
    if (!currentStream) return;

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

    socket.off("call-answered");
    socket.on("call-answered", (data) => {
      setCallAccepted(true);
      peer.signal(data.signal);
    });

    connectionRef.current = peer;
  };

  // Answers a call by ensuring a fresh stream then creating a new Peer.
  const answerCall = async () => {
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

    peer.on("stream", (remoteStream) => {
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
    // Use callerPhone if available; otherwise, use toPhoneNumber
    const targetPhone = callerPhone || toPhoneNumber;
    if (targetPhone) {
      socket.emit("reject-call", { to: targetPhone });
    }
    endCall();
  };

  // End the call and reset all relevant states, video elements, and toggle states.
  const endCall = () => {
    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setReceivingCall(false);
    setCallAccepted(false);
    setCalling(false);
    setCallerSignal(null);
    setCallerPhone("");
    setStream(null);
    setAudioEnabled(true);
    setVideoEnabled(true);
    clearInterval(timerIntervalRef.current);
    setCallDuration("00:00");

    if (myVideo.current) myVideo.current.srcObject = null;
    if (userVideo.current) userVideo.current.srcObject = null;
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
          onClick={() => callUser(toPhoneNumber)}
        />
        <MdOutlineVideoCall
          className="w-8 h-8 hover:cursor-pointer"
          onClick={() => callUser(toPhoneNumber)}
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
        <CiVideoOff
          className={`hover:cursor-pointer w-8 h-8 ${
            videoEnabled ? "text-green-500" : "text-red-500"
          }`}
          onClick={toggleVideo}
        />
        <span className="text-white font-mono text-sm">{callDuration}</span>
      </div>
    </div>
  );
}
