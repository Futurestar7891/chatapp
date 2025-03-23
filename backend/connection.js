const mongoose = require("mongoose");
const { Server } = require("socket.io");
const UserSchema = require("./models/user"); // Import your User model

// MongoDB connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Error in connecting database:", error);
    throw error; // Throw error to be caught in index.js
  }
};

// Function to update user status in the database
const updateUserStatus = async (userId, status) => {
  try {
    const user = await UserSchema.findById(userId);
    if (user) {
      user.status = status;
      user.lastSeen = status === "offline" ? new Date() : null; // Set lastSeen only when offline
      await user.save();
      console.log(`✅ User ${userId} status updated to ${status}`);
    } else {
      console.error(`❌ User ${userId} not found`);
    }
  } catch (error) {
    console.error(`❌ Error updating user ${userId} status:`, error);
  }
};

// Socket.IO setup function
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

    // When a user connects, set their status to "online"
    socket.on("setOnline", async (userId) => {
      if (userId) {
        socket.userId = userId; // Store userId in the socket object
        await updateUserStatus(userId, "online");
        console.log(`User ${userId} is now online`);

        // Notify all other users about the status change
        socket.broadcast.emit("userStatusChanged", {
          userId,
          status: "online",
        });
      }
    });

    // Handle logout event
    socket.on("logout", async (userId) => {
      if (userId) {
        await updateUserStatus(userId, "offline");
        console.log(`User ${userId} is now offline`);

        // Notify all other users about the status change
        socket.broadcast.emit("userStatusChanged", {
          userId,
          status: "offline",
        });
      }
    });

    // When a user disconnects, set their status to "offline"
    socket.on("disconnect", async () => {
      const userId = socket.userId; // Retrieve userId from the socket object
      if (userId) {
        await updateUserStatus(userId, "offline");
        console.log(`User ${userId} is now offline`);

        // Notify all other users about the status change
        socket.broadcast.emit("userStatusChanged", {
          userId,
          status: "offline",
        });
      }
    });

    // Handle joining and leaving rooms
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
