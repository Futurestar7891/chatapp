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

const canSeeStatus = async (senderId, receiverId) => {
  try {
    const receiver = await UserSchema.findById(receiverId);
    if (!receiver) {
      console.error(`❌ Receiver ${receiverId} not found`);
      return false;
    }
    const isBlocked = receiver.BlockedUsers.some((entry) =>
      entry.userId.equals(senderId)
    );
    if (isBlocked) return false;
    const { privacySettings } = receiver;
    if (privacySettings.lastSeenVisibility === "public") return true;
    if (privacySettings.lastSeenVisibility === "private")
      return senderId === receiverId;
    if (privacySettings.lastSeenVisibility === "contacts") {
      return receiver.Contacts.some((contact) =>
        contact.userId.equals(senderId)
      );
    }
    return false;
  } catch (error) {
    console.error(
      `❌ Error checking status visibility for ${receiverId}:`,
      error
    );
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

    socket.on("setUserId", async (userId) => {
      socket.userId = userId;
      console.log(`User ${userId} associated with socket ${socket.id}`);
      await updateUserStatus(userId, "online");
      const rooms = Array.from(socket.rooms).filter(
        (room) => room !== socket.id
      );
      console.log(`User ${userId} is in rooms: ${rooms.join(", ")}`);
      for (const roomId of rooms) {
        const [user1, user2] = roomId.split("-");
        const otherUserId = user1 === userId ? user2 : user1;
        if (await canSeeStatus(otherUserId, userId)) {
          socket.to(roomId).emit("userStatusChanged", {
            userId,
            status: "online",
          });
          console.log(
            `Emitted online status for user ${userId} to room ${roomId}`
          );
        }
      }
    });

    socket.on("joinRoom", async (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
      if (socket.userId) {
        const [user1, user2] = roomId.split("-");
        const otherUserId = user1 === socket.userId ? user2 : user1;
        if (await canSeeStatus(otherUserId, socket.userId)) {
          socket.to(roomId).emit("userStatusChanged", {
            userId: socket.userId,
            status: "online",
          });
          console.log(
            `Emitted online status for user ${socket.userId} to room ${roomId}`
          );
        }
      }
    });

    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    });

    socket.on("logout", async (userId) => {
      console.log(`User ${userId} logged out: ${socket.id}`);
      if (socket.userId === userId) {
        await updateUserStatus(userId, "offline");
        const rooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id
        );
        console.log(`User ${userId} was in rooms: ${rooms.join(", ")}`);
        for (const roomId of rooms) {
          const [user1, user2] = roomId.split("-");
          const otherUserId = user1 === userId ? user2 : user1;
          if (await canSeeStatus(otherUserId, userId)) {
            socket.to(roomId).emit("userStatusChanged", {
              userId,
              status: "offline",
            });
            console.log(
              `Emitted offline status for user ${userId} to room ${roomId}`
            );
          }
        }
        socket.userId = null;
      }
    });

    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (socket.userId) {
        await updateUserStatus(socket.userId, "offline");
        const rooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id
        );
        console.log(`User ${socket.userId} was in rooms: ${rooms.join(", ")}`);
        for (const roomId of rooms) {
          const [user1, user2] = roomId.split("-");
          const otherUserId = user1 === socket.userId ? user2 : user1;
          if (await canSeeStatus(otherUserId, socket.userId)) {
            socket.to(roomId).emit("userStatusChanged", {
              userId: socket.userId,
              status: "offline",
            });
            console.log(
              `Emitted offline status for user ${socket.userId} to room ${roomId}`
            );
          }
        }
      }
    });
  });

  return io;
};

module.exports = { connectDB, setupSocketIO };
