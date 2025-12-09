import { Server } from "socket.io";
import Message from "../Models/Message.js";
import Chat from "../Models/Chat.js";
import User from "../Models/User.js";
import dotenv from "dotenv"

dotenv.config({});

export const connectSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: "http://chatapp-latest.vercel.app",
      credentials: true,
    },
    perMessageDeflate: true, // Compress WebSocket messages
    transports: ["websocket"], // Faster than polling
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
            blockedUsers: msg.sender,
          });

          if (receiverBlockedSender) {
            // receiver blocked sender AFTER message sent → do NOT deliver
            continue;
          }

          // send to receiver
          io.to(socket.id).emit("new-message", {
            chatId: msg.chatId,
            message: msg,
          });

          // mark delivered
          msg.deliveredAt = new Date();
          await msg.save({ validateBeforeSave: false });

          // notify sender
          const senderSocket = onlineUsers.get(msg.sender.toString());
          if (senderSocket) {
            io.to(senderSocket).emit("message-delivered-update", msg);
          }
        }
      }
    });

    // MESSAGE DELIVERED
    // MESSAGE DELIVERED
    socket.on("message-delivered", async (messageId) => {
      const msg = await Message.findById(messageId);
      if (!msg || msg.deliveredAt) return;

      msg.deliveredAt = new Date();
      await msg.save({ validateBeforeSave: false });

      const senderSocket = onlineUsers.get(msg.sender.toString());
      if (senderSocket)
        io.to(senderSocket).emit("message-delivered-update", msg);
    });

    // MESSAGE SEEN
    socket.on("message-seen", async (messageId) => {
      const msg = await Message.findById(messageId);
      if (!msg || msg.seenAt) return;

      msg.seenAt = new Date();
      await msg.save();

      // RESET unreadCount for receiver
      const chat = await Chat.findById(msg.chatId);
      if (chat) {
        chat.unreadCount.set(msg.receiver.toString(), 0);
        await chat.save();
      }

      // send seen event to sender
      const senderSocket = onlineUsers.get(msg.sender.toString());
      if (senderSocket) io.to(senderSocket).emit("message-seen-update", msg);
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
