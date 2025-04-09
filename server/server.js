import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import axios from "axios"; // Ensure axios is imported for API calls
import dotenv from "dotenv"; // For environment variables

dotenv.config(); // Load environment variables

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
  res.send("Hello World!");
});

// Store user connections: { phoneNumber: socketId }
let users = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);
  // Register user and map their phone number to socket ID
  socket.on("sendSocketID", (data) => {
    try {
      axios
        .post(`${process.env.API_URL}/user/setonline`, {
          phoneNumber: data.phoneNumber,
        })
        .then(console.log("Successfully setOnline"));
    } catch {
      console.log("Error on setOnline");
    }

    users.set(data.phoneNumber, socket.id);
    console.log("User Registered:", data.phoneNumber, "→", socket.id);

    // Broadcast updated active users list
    io.emit("activeUsers", Array.from(users.keys())); // Send only phone numbers
  });

  // Send message to specific user (receiver's phoneNumber is used to find socketId)
  socket.on("sendMessage", (data) => {
    const receiverSocketId = users.get(data.receiver);
    console.log(`${data.sender} → Message → ${data.receiver}`);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", data);
      console.log(data);
    } else {
      console.log("Receiver is offline:", data.receiver);
    }
  });

  // Handle message deletion event
  socket.on("deleteMessage", (data) => {
    const receiverSocketId = users.get(data.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("deleteReceiveMessage", data);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", async () => {
    let disconnectedPhone = null;

    // Find the phone number associated with the disconnected socket ID
    for (let [phoneNumber, socketId] of users.entries()) {
      if (socketId === socket.id) {
        disconnectedPhone = phoneNumber;
        users.delete(phoneNumber);
        break;
      }
    }

    if (disconnectedPhone) {
      try {
        await axios.post(`${process.env.API_URL}/user/setoffline`, {
          phoneNumber: disconnectedPhone,
        });
        console.log("User Disconnected:", disconnectedPhone);
      } catch (error) {
        console.error("Error setting user offline:", error.message);
      }

      // Broadcast updated active users list
      io.emit("activeUsers", Array.from(users.keys()));
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
