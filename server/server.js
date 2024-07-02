require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Auth-Token', 'Origin', 'Authorization'],
    credentials: true,
  },
});

app.use(cors());

let sidMap = new Map();
io.on('connection', (socket) => {
  console.log('User Connected', socket.id);

  socket.on('sendSocketID', (data) => {
    sidMap.set(socket.id, data.phoneNumber);
  });

  socket.on('sendMessage', (data) => {
    console.log(data.sender, '---- message ----', data.receiver);
    socket.to(data.receiver).emit('recieveMessage', data);
    console.log(data, 'recieved');
  });

  socket.on('deleteMessage', (data) => {
    socket.to(data.receiver).emit('deleteReceiveMessage', data);
  });

  socket.on('disconnect', async () => {
    const phoneNumber = sidMap.get(socket.id);

    try {
      await axios.post(`${process.env.API_URL}user/setoffline`, {
        phoneNumber: phoneNumber,
      });
      console.log('User Disconnected', socket.id);
    } catch (error) {
      console.error('Error setting user offline:');
    }
    sidMap.delete(socket.id);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
