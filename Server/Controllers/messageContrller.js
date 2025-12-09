import Chat from "../Models/Chat.js";
import Message from "../Models/Message.js";
import User from "../Models/User.js";

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
    }).sort({ createdAt: 1 });

    return res.json({ success: true, messages });
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



export const sendMessage = async (req, res) => {
  const userId = req.user.id; // sender
  const { receiverId, text, mediaUrl, mediaType, filename } = req.body;

  try {
    // 1️⃣ Check if receiver blocked the sender
    const receiver = await User.findById(receiverId).select("blockedUsers");

    const isBlocked = receiver.blockedUsers?.some(
      (u) => u.toString() === userId
    );

    // 2️⃣ Find or create chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, receiverId],
        unreadCount: { [receiverId]: 0, [userId]: 0 },
        lastMessage: [
          { userId:userId, messageId: null },
          { userId: receiverId, messageId: null },
        ],
      });
    }

    // 3️⃣ CREATE MESSAGE
    const message = await Message.create({
      chatId: chat._id,
      sender: userId,
      receiver: receiverId,
      text: text || "",
      filename,
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || null,

      // ⭐ If blocked → receiver should not see message
      deletedFor: isBlocked ? [receiverId] : [],
    });

    // 4️⃣ UPDATE CHAT LAST MESSAGE

    
    if(!isBlocked){
       chat.lastMessage = chat.lastMessage.map((lm) =>
         lm.userId.toString() === receiverId
           ? { ...lm, messageId: message._id }
           : lm
       );
    }
    //for sender
     chat.lastMessage = chat.lastMessage.map((lm) =>
       lm.userId.toString() === userId
         ? { ...lm, messageId: message._id }
         : lm
     );
     
    
    // ⭐ If NOT BLOCKED → increase unread count
    if (!isBlocked) {
      chat.unreadCount.set(
        receiverId,
        (chat.unreadCount.get(receiverId) || 0) + 1
      );
    }

    await chat.save();

    // 5️⃣ Real-time emit ONLY IF not blocked
    if (!isBlocked) {
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("new-message", {
          chatId: chat._id,
          message,
        });
      }
    }

    return res.json({ success: true, message, chatId: chat._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


