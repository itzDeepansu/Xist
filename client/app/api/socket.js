// pages/api/socket.js
import { Server as ServerIO } from "socket.io";
import axios from "axios";

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log("Setting up Socket.IO server...");
    const io = new ServerIO(res.socket.server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("User Connected", socket.id);

      socket.on("sendSocketID", (data) => {
        axios.post(`${process.env.API_URL}/user/setsocketid`, {
          phoneNumber: data.phoneNumber,
          socketID: data.socketID,
        });
        res.socket.server.sidMap.set(socket.id, data.phoneNumber);
      });

      socket.on("sendMessage", (data) => {
        socket.to(data.receiver).emit("receiveMessage", data);
        console.log(data, "received");
      });

      socket.on("deleteMessage", (data) => {
        socket.to(data.receiver).emit("deleteReceiveMessage", data);
      });

      socket.on("disconnect", async () => {
        const phoneNumber = res.socket.server.sidMap.get(socket.id);

        try {
          await axios.post(`${process.env.API_URL}/user/setoffline`, {
            phoneNumber: phoneNumber,
          });
          console.log("User Disconnected", socket.id);
        } catch (error) {
          console.error("Error setting user offline:", error);
        }
        res.socket.server.sidMap.delete(socket.id);
      });
    });

    res.socket.server.io = io;
    res.socket.server.sidMap = new Map();
  } else {
    console.log("Socket.IO server already running.");
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default ioHandler;
