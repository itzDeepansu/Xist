import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";

const port = 3000;


const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("hello world");
});

let sidMap = new Map();
io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  socket.on("sendSocketID", (data) => {
    sidMap.set(socket.id, data.phoneNumber);
  });

  socket.on("sendMessage", (data) => {
    console.log(data.sender, "---- message ----", data.receiver);
    socket.to(data.receiver).emit("recieveMessage", data);
    console.log(data, "recieved");
  });

  socket.on("deleteMessage", (data) => {
    socket.to(data.receiver).emit("deleteReceiveMessage", data);
  });

  socket.on("disconnect", async () => {
    const phoneNumber = sidMap.get(socket.id);

    try {
      await axios.post(`${process.env.API_URL}user/setoffline`, {
        phoneNumber: phoneNumber,
      });
      console.log("User Disconnected", socket.id);
    } catch (error) {
      console.error("Error setting user offline:");
    }
    sidMap.delete(socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on ${port}`);
});
