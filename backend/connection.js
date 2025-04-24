const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

 const userSocketMap = new Map();
 const userRoomMap = new Map();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Error in connecting database:", error);
    throw error;
  }
};

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });


  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    const token = socket.handshake.query.token;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decoded.id;
      socket.userId = userId;
      userSocketMap.set(userId, socket.id);

      const onlineUsers = Array.from(userSocketMap.keys());

      io.emit("onlineUsers", onlineUsers);
      console.log(`Emitted online users: ${onlineUsers.join(", ")}`);
    } catch (error) {
      socket.disconnect(true);
      return;
    }

    socket.on("joinRoom", ({ roomId}) => {
      socket.join(roomId);
      userRoomMap.set(socket.userId, roomId);
      console.log(userRoomMap);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on("leaveRoom", () => {
      const roomId = userRoomMap.get(socket.userId);
      socket.leave(roomId);
      userRoomMap.delete(socket.userId);
      console.log(`User ${socket.userId} left room ${roomId}`);

    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (socket.userId) {
        const roomId = userRoomMap.get(socket.userId);
        if (roomId) {
          socket.leave(roomId);
          userRoomMap.delete(socket.userId);
          console.log(
            `User ${socket.userId} left room ${roomId} on disconnect`
          );
        }
        userSocketMap.delete(socket.userId);
        const onlineUsers = Array.from(userSocketMap.keys());
        io.emit("onlineUsers", onlineUsers);
        console.log(`Emitted online users`);
      }
    });
  });

  return io;
};

module.exports = { connectDB, setupSocketIO, userSocketMap, userRoomMap };
