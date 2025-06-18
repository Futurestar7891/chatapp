const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message=require("./models/message");
const UserSchema=require("./models/user");
const {userRoomMap,userSocketMap}=require("./utils/socketMap");

 

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
    // console.log(`New client connected: ${socket.id}`);

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
      // console.log(`Emitted online users: ${onlineUsers.join(", ")}`);
    } catch (error) {
      socket.disconnect(true);
      return;
    }
socket.on("joinRoom", async ({ roomId }) => {
  socket.join(roomId);
  userRoomMap.set(socket.userId, roomId);
  // console.log(userRoomMap);
  // console.log(`User ${socket.userId} joined room ${roomId}`);

  // Split roomId to get both user IDs
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

      // Update seenTime for all those messages
      await Message.updateMany(
        {
          senderId: senderId,
          receiverId: receiverId,
          seenTime: null,
        },
        { $set: { seenTime } }
      );

      // 2. Notify the sender that their messages are seen
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
      socket.leave(roomId);
      userRoomMap.delete(socket.userId);
      // console.log(`User ${socket.userId} left room ${roomId}`);

    });

    socket.on("disconnect", async () => {
      // console.log(`Client disconnected: ${socket.id}`);
      if (socket.userId) {
        const roomId = userRoomMap.get(socket.userId);
        if (roomId) {
          socket.leave(roomId);
          userRoomMap.delete(socket.userId);
          // console.log(
          //   `User ${socket.userId} left room ${roomId} on disconnect`
          // );
        }

        try {
          await UserSchema.findByIdAndUpdate(socket.userId, {
            lastSeen: new Date(),
          });
          // console.log(`Updated lastSeen for user ${socket.userId}`);
        } catch (err) {
          console.error(
            `Error updating lastSeen for user ${socket.userId}:`,
            err
          );
        }

        userSocketMap.delete(socket.userId);
        const onlineUsers = Array.from(userSocketMap.keys());
        io.emit("onlineUsers", onlineUsers);
        // console.log(`Emitted online users`);
      }
    });
  });

  return io;
};

module.exports = { connectDB, setupSocketIO,
    getSocketMap: () => userSocketMap, 
  getRoomMap: () => userRoomMap       
}
