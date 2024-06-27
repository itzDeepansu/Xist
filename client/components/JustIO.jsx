import React, { useEffect , useMemo } from "react";
import {io} from "socket.io-client"

const JustIO = ({ profile }) => {
    const socket = useMemo(
        () =>
          io("http://localhost:5174", {
            transports: ["websocket"],
            upgrade: false,
          }),
        []
      );
  useEffect(() => {
    socket.on("connect", () => {
      console.log(`User Connect ${socket.id}`);
      socket.emit("sendSocketID", { phoneNumber: user, socketID: socket.id });
    });
    return () => {
      socket.disconnect();
    };
  }, [profile]);
  return <div></div>;
};

export default JustIO;
