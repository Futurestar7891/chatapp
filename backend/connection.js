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

  // Track connection attempts
  const connectionAttempts = new Map();

  io.on("connection", (socket) => {
    const token = socket.handshake.query.token;
    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decoded.id;

      // Clear any previous connection attempts
      connectionAttempts.delete(userId);

      socket.userId = userId;
      userSocketMap.set(userId, socket.id);

      const onlineUsers = Array.from(userSocketMap.keys());
      io.emit("onlineUsers", onlineUsers);

      // Heartbeat to check connection status
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

        if (socket.userId) {
          const roomId = userRoomMap.get(socket.userId);
          if (roomId) {
            socket.leave(roomId);
            userRoomMap.delete(socket.userId);
          }

          try {
            await UserSchema.findByIdAndUpdate(socket.userId, {
              lastSeen: new Date(),
            });
          } catch (err) {
            console.error(`Error updating lastSeen:`, err);
          }

          // Delay removal to allow for reconnection
          setTimeout(() => {
            if (!userSocketMap.get(socket.userId)) {
              userSocketMap.delete(socket.userId);
              const onlineUsers = Array.from(userSocketMap.keys());
              io.emit("onlineUsers", onlineUsers);
            }
          }, 5000); // 5 second grace period
        }
      });

      socket.on("error", (err) => {
        console.error("Socket error:", err);
      });
    } catch (error) {
      const userId = jwt.decode(token)?.id;
      if (userId) {
        const attempts = (connectionAttempts.get(userId) || 0) + 1;
        connectionAttempts.set(userId, attempts);

        if (attempts > 3) {
          setTimeout(() => connectionAttempts.delete(userId), 60000); // Reset after 1 minute
        }
      }
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
