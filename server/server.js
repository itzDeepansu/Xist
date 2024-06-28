require("dotenv").config();
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}
const handler = (req, res) => {
  const d = new Date()
  res.end(d.toString())
}

module.exports = allowCors(handler)

const axios = require("axios");
const io = require("socket.io")(3000, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
let sidMap = new Map();
io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  socket.on("sendSocketID", (data) => {
    // try {
    //   axios.post(`${process.env.API_URL}user/setsocketid`, {
    //     phoneNumber: data.phoneNumber,
    //     socketID: data.socketID,
    //   });
    // } catch (err) {
    //   console.log("error at setting socket id");
    // }
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
