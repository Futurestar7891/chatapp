import Chat from "../Models/Chat.js";
import Message from "../Models/Message.js";
import User from "../Models/User.js";
import { buildChatList } from "../utils/chatListBuilder.js";

const clearReplyReferences = async (messageId) => {
  const repliedMessages = await Message.find(
    { "replyTo._id": messageId },
    { _id: 1 }
  ).lean();

  if (!repliedMessages.length) return [];

  await Message.updateMany(
    { "replyTo._id": messageId },
    { $set: { replyTo: null } }
  );

  return repliedMessages.map((m) => m._id.toString());
};



export const getMessages = async (req, res) => {
  const userId = req.user.id;
  const receiverId = req.params.id;

  try {
    const chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (!chat) {
      return res.json({ success: true, messages: [] });
    }

    const messages = await Message.find({
      chatId: chat._id,
      deletedFor: { $ne: userId }, 
    }).populate("sender","_id name avatar").sort({ createdAt: 1 });

    return res.json({ success: true, messages });
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


export const sendMessage = async (req, res) => {
  const userId = req.user.id; // sender
  const { receiverId, text, mediaUrl, mediaType, filename, replyTo } = req.body;

  try {
    // 1️⃣ Check if receiver blocked the sender
    const receiver = await User.findById(receiverId).select("blockedUsers");
    const isBlocked = receiver.blockedUsers?.includes(userId);

    // 2️⃣ Find or create chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, receiverId],
        unreadCount: { [receiverId]: 0, [userId]: 0 },
        lastMessage: [
          { userId, messageId: null },
          { userId: receiverId, messageId: null },
        ],
      });
    }

    // 3️⃣ CREATE MESSAGE (store replyTo as ID)
    const message = await Message.create({
      chatId: chat._id,
      sender: userId,
      receiver: receiverId,
      text: text || "",
      filename,
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || null,
      replyTo: replyTo || null,
      deletedFor: isBlocked ? [receiverId] : [],
    });

    // 4️⃣ Populate sender before sending to frontend
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "_id name avatar")
      .lean();

    // 5️⃣ Update chat.lastMessage
    chat.lastMessage = chat.lastMessage.map((lm) =>
      lm.userId.toString() === userId ||
      (!isBlocked && lm.userId.toString() === receiverId)
        ? { ...lm, messageId: message._id }
        : lm
    );

    // 6️⃣ Update unread count ONLY if not blocked
    if (!isBlocked) {
      chat.unreadCount.set(
        receiverId,
        (chat.unreadCount.get(receiverId) || 0) + 1
      );
    }

    await chat.save();

    // 7️⃣ Build chatlists (same function for both)
    const senderChatList = await buildChatList(userId);
    const receiverChatList = await buildChatList(receiverId);

    // 8️⃣ Send events
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const receiverSocket = onlineUsers.get(receiverId);

    if (!isBlocked && receiverSocket) {
      // Send message to receiver
      io.to(receiverSocket).emit("receiver-new-message", 
        populatedMessage
      );

      // Send updated chatlist to receiver
      io.to(receiverSocket).emit("chatlist-updated", receiverChatList);
    }

    // 9️⃣ Return data to sender
    return res.json({
      success: true,
      message: populatedMessage,
      chatlist: senderChatList,
      chatId: chat._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteForMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false });
    }

    const chatId = message.chatId;

    // Find new last visible message for THIS user
    const newLastMsg = await Message.findOne({
      chatId,
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Update lastMessage only for this user
    await Chat.updateOne(
      { _id: chatId, "lastMessage.userId": userId },
      {
        $set: {
          "lastMessage.$.messageId": newLastMsg?._id || null,
        },
      }
    );

    // 🔥 Build updated chatlist
    const updatedChatList = await buildChatList(userId);

    // Emit
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const socketId = onlineUsers.get(userId);

    if (socketId) {
      io.to(socketId).emit("deleted-message", messageId);
      io.to(socketId).emit("chatlist-updated", updatedChatList);
    }

    return res.json({ success: true, messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};



export const deleteForEveryone = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false });

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false });
    }

    // Mark deleted for both
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: {
        deletedFor: { $each: [message.sender, message.receiver] },
      },
    });

    
    const repliedMessageIds = await clearReplyReferences(messageId);

    const chatId = message.chatId;
    const users = [
      message.sender.toString(),
      message.receiver.toString(),
    ];

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    for (const uid of users) {
      const lastVisible = await Message.findOne({
        chatId,
        deletedFor: { $ne: uid },
      })
        .sort({ createdAt: -1 })
        .lean();

      await Chat.updateOne(
        { _id: chatId, "lastMessage.userId": uid },
        {
          $set: {
            "lastMessage.$.messageId": lastVisible?._id || null,
          },
        }
      );

      const socketId = onlineUsers.get(uid);
     if (socketId) {
       io.to(socketId).emit("deleted-message", messageId );

       if (repliedMessageIds.length) {
         io.to(socketId).emit("reply-references-cleared",
           repliedMessageIds,);
       }

       const updatedChatList = await buildChatList(uid);
       io.to(socketId).emit("chatlist-updated", updatedChatList);
     }

    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};


