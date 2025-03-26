const mongoose = require("mongoose");
const { Server } = require("socket.io");
const UserSchema = require("./models/user");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Error in connecting database:", error);
    throw error;
  }
};

const updateUserStatus = async (userId, status) => {
  try {
    const user = await UserSchema.findById(userId);
    if (user) {
      user.status = status;
      user.lastSeen = status === "offline" ? new Date() : null;
      await user.save();
      console.log(`✅ User ${userId} status updated to ${status}`);
      return true;
    } else {
      console.error(`❌ User ${userId} not found`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating user ${userId} status:`, error);
    return false;
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

    socket.on("setOnline", async (userId) => {
      if (userId) {
        socket.userId = userId;
        await updateUserStatus(userId, "online");
        console.log(`User ${userId} is now online`);
        socket.broadcast.emit("userStatusChanged", {
          userId,
          status: "online",
        });
      }
    });

    socket.on("logout", async (userId) => {
      console.log("enterd in logut connection");
      if (userId && socket.userId === userId) {
        console.log("entered in the logout event");
        await updateUserStatus(userId, "offline");
        console.log(`User ${userId} logged out and is now offline`);
        socket.broadcast.emit("userStatusChanged", {
          userId,
          status: "offline",
        });
        socket.disconnect(); // Disconnect only on explicit logout
      }
    });

    socket.on("disconnect", async () => {
      const userId = socket.userId;
      if (userId) {
        await updateUserStatus(userId, "offline");
        console.log(`User ${userId} disconnected and is now offline`);
        socket.broadcast.emit("userStatusChanged", {
          userId,
          status: "offline",
        });
      }
    });

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    });
  });

  return io;
};

module.exports = { connectDB, setupSocketIO };
