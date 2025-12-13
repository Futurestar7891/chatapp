import { Server } from "socket.io";
import Message from "../Models/Message.js";
import Chat from "../Models/Chat.js";
import User from "../Models/User.js";
import dotenv from "dotenv"
import mongoose from "mongoose";
import { buildChatList } from "../utils/chatListBuilder.js";

dotenv.config();

export const connectSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      // origin: "https://chatapp-latest.vercel.app",
      origin: "http://localhost:5173",
      credentials: true,
    },
    perMessageDeflate: true, // Compress WebSocket messages
    transports: ["polling", "websocket"], // Faster than polling
    pingTimeout: 30000, // Keep connections alive
  });

  const onlineUsers = new Map();
  app.set("io", io);
  app.set("onlineUsers", onlineUsers);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // USER ONLINE
    socket.on("user-online", async (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online-users", [...onlineUsers.keys()]);

      // SEND ANY UNDELIVERED MESSAGES
      const undelivered = await Message.find({
        receiver: userId,
        deletedFor: { $ne: userId },
        deliveredAt: null,
      });

    if (undelivered.length > 0) {
      for (const msg of undelivered) {
        const receiverBlockedSender = await User.exists({
          _id: userId,
          blockedUsers: msg.sender._id.toString(),
        });

        if (receiverBlockedSender) continue;

        // 1️⃣ Mark delivered FIRST
        msg.deliveredAt = new Date();
        await msg.save({ validateBeforeSave: false });

        // 2️⃣ Populate AFTER save
        const populatedMessage = await Message.findById(msg._id)
          .populate("sender", "_id name avatar")
          .lean();

        // 3️⃣ Send to receiver
        io.to(socket.id).emit("receiver-new-message", populatedMessage);
        const senderSocket = onlineUsers.get(msg.sender._id.toString());
          if (senderSocket) {
            io.to(senderSocket).emit("message-delivered-update", populatedMessage);
          }
      }
    }

    });
    // MESSAGE DELIVERED
    socket.on("message-delivered", async (messageId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(messageId)) return;

        // 1️⃣ Fetch raw message
        const msg = await Message.findById(messageId);
        if (!msg || msg.deliveredAt) return;

        // 2️⃣ Save first
        msg.deliveredAt = new Date();
        await msg.save({ validateBeforeSave: false });

        // 3️⃣ Populate AFTER save
        const populatedMessage = await Message.findById(msg._id)
          .populate("sender", "_id name avatar")
          .lean();

        // 4️⃣ Notify sender
        const senderSocket = onlineUsers.get(msg.sender.toString());
        if (senderSocket) {
          io.to(senderSocket).emit("message-delivered-update", populatedMessage);
        }
      } catch (err) {
        console.log("message-delivered error:", err);
      }
    });


socket.on("message-seen", async (messageId) => {
  try {
    console.log(messageId);
    if (!mongoose.Types.ObjectId.isValid(messageId)) return;

    
    // 1️⃣ Fetch raw message
    const msg = await Message.findById(messageId);
    if (!msg || msg.seenAt) return;

    // 2️⃣ Save FIRST
    msg.seenAt = new Date();
    await msg.save({ validateBeforeSave: false });

    // 3️⃣ Populate AFTER save
    const populatedMessage = await Message.findById(msg._id)
      .populate("sender", "_id name avatar")
      .lean();

    const senderId = populatedMessage.sender._id.toString();
    const receiverId = populatedMessage.receiver.toString();

    // 4️⃣ Notify sender
    const senderSocket = onlineUsers.get(senderId);
    if (senderSocket) {
      io.to(senderSocket).emit("message-seen-update", populatedMessage);
    }

    // 5️⃣ Reset unread count in DB
    const chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (chat) {
      chat.unreadCount.set(receiverId, 0);
      await chat.save();
    }

    // 6️⃣ Update receiver chatlist
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      const receiverChatList = await buildChatList(receiverId);
      io.to(receiverSocket).emit("chatlist-updated", receiverChatList);
    }
  } catch (error) {
    console.log("message-seen error:", error);
  }
});



    socket.on("disconnect", () => {
      for (const [uid, sid] of onlineUsers) {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
        }
      }
      io.emit("online-users", [...onlineUsers.keys()]);
    });
  });
};
