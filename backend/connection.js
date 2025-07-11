const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./models/message");
const UserSchema = require("./models/user");
const { userRoomMap, userSocketMap } = require("./utils/socketMap");

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
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  // Track active connections
  const activeConnections = new Map();

  const updateOnlineUsers = () => {
    const onlineUsers = Array.from(activeConnections.keys());
    io.emit("onlineUsers", onlineUsers);
    console.log("Updated online users:", onlineUsers);
  };

  io.on("connection", (socket) => {
    const token = socket.handshake.query.token;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decoded.id;

      // Remove any existing connection for this user
      if (activeConnections.has(userId)) {
        const oldSocketId = activeConnections.get(userId);
        io.to(oldSocketId).disconnectSockets(true);
      }

      // Store new connection
      activeConnections.set(userId, socket.id);
      socket.userId = userId;
      userSocketMap.set(userId, socket.id);

      // Initial online users update
      updateOnlineUsers();

      // Heartbeat for connection health
      const heartbeatInterval = setInterval(() => {
        if (!socket.connected) {
          clearInterval(heartbeatInterval);
          return;
        }
        socket.emit("ping");
      }, 30000); // 30 seconds

      socket.on("pong", () => {
        // Connection is healthy
      });

      // Handle user activity updates
      socket.on("userActivity", () => {
        updateOnlineUsers();
      });

      socket.on("joinRoom", async ({ roomId }) => {
        socket.join(roomId);
        userRoomMap.set(socket.userId, roomId);

        const [user1, user2] = roomId.split("-");
        const receiverId = socket.userId;
        const senderId = user1 === receiverId ? user2 : user1;

        try {
          let conversation = await Message.findOne({
            participants: { $all: [senderId, receiverId] },
          });

          if (!conversation) return;

          const unseenMessages = conversation.messages.filter(
            (msg) =>
              String(msg.senderId) === String(senderId) &&
              String(msg.receiverId) === String(receiverId) &&
              msg.seenTime === null
          );

          if (unseenMessages.length > 0) {
            const seenTime = new Date();

            await Message.updateMany(
              {
                senderId: senderId,
                receiverId: receiverId,
                seenTime: null,
              },
              { $set: { seenTime } }
            );

            const senderSocketId = userSocketMap.get(senderId);
            if (senderSocketId) {
              io.to(senderSocketId).emit("messagesSeen", {
                senderId: senderId,
                receiverId: receiverId,
                seenTime,
              });
            }
          }
        } catch (err) {
          console.error("Error updating seenTime:", err);
        }
      });

      socket.on("leaveRoom", () => {
        const roomId = userRoomMap.get(socket.userId);
        if (roomId) {
          socket.leave(roomId);
          userRoomMap.delete(socket.userId);
        }
      });

      socket.on("disconnect", async () => {
        clearInterval(heartbeatInterval);
        activeConnections.delete(userId);
        userSocketMap.delete(userId);
        updateOnlineUsers();

        const roomId = userRoomMap.get(userId);
        if (roomId) {
          socket.leave(roomId);
          userRoomMap.delete(userId);
        }

        try {
          await UserSchema.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error(`Error updating lastSeen for user ${userId}:`, err);
        }
      });
    } catch (error) {
      console.error("Authentication error:", error);
      socket.disconnect(true);
    }
  });

  return io;
};

module.exports = {
  connectDB,
  setupSocketIO,
  getSocketMap: () => userSocketMap,
  getRoomMap: () => userRoomMap,
};
