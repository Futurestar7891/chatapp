import Chat from "../Models/Chat.js";
import Contact from "../Models/Contact.js";
import User from "../Models/User.js";
import Message from "../Models/Message.js";

export const getChatList = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Fetch block lists
    const me = await User.findById(userId)
      .select("blockedUsers blockedBy")
      .lean();

    const myBlockedUsers = me.blockedUsers || [];
    const myBlockedBy = me.blockedBy || [];

    // 2️⃣ Fetch user's saved contacts
    const contacts = await Contact.find({ userId }).lean();

    // 👉 Create a map: { contactId -> savedName }
    const savedNameMap = {};
    const isContactMap = {};
    contacts.forEach((c) => {
      savedNameMap[c.contactId.toString()] = c.savedName;
      isContactMap[c.contactId.toString()] = true;
    });

    // 3️⃣ Fetch chats
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email avatar mobile bio")
      .populate("lastMessage.messageId")
      .sort({ updatedAt: -1 })
      .lean();

    // 4️⃣ Format chats
    const formattedChats = chats.map((chat) => {
      const otherUser = chat.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      const otherId = otherUser._id.toString();
      //
       const lastMessage = chat.lastMessage.find(
         (lm) => lm.userId.toString() === userId
       );

      // ⭐ If contact saved → replace name
      const displayName = savedNameMap[otherId] || otherUser.name;

      const cleanUser = {
        _id: otherId,
        name: displayName,
        email: otherUser.email,
        mobile: otherUser.mobile,
        avatar: otherUser.avatar,
        bio: otherUser.bio,
        isContact: Boolean(isContactMap[otherId]),
        blockedByMe: myBlockedUsers.some((p) => p.toString() === otherId),
        blockedMe: myBlockedBy.some((p) => p.toString() === otherId),
      };

      return {
        user: cleanUser,
        lastMessage: lastMessage?.messageId || null,
        unreadCount: chat.unreadCount?.[userId] || 0,
        updatedAt: chat.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      chats: formattedChats,
    });
  } catch (error) {
    console.error("Chat list error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getContactList = async (req, res) => {
  try {
    const userId = req.user.id;
    const keyword = (req.query.keyword || "").toLowerCase();

    // Fetch block lists
    const me = await User.findById(userId)
      .select("blockedUsers blockedBy")
      .lean();

    const myBlockedUsers = me.blockedUsers || [];
    const myBlockedBy = me.blockedBy || [];

    // 1️⃣ Fetch saved contacts WITH savedName
    const contacts = await Contact.find({ userId })
      .populate("contactId", "_id name mobile email avatar bio")
      .lean();

    let savedUsers = contacts.map((c) => ({
      savedName: c.savedName,
      user: c.contactId,
    }));

    // 2️⃣ Filter saved contacts using savedName FIRST
    if (keyword.trim()) {
      savedUsers = savedUsers.filter((c) => {
        return (
          c.savedName.toLowerCase().includes(keyword) ||
          c.user.mobile.includes(keyword) ||
          (c.user.email && c.user.email.toLowerCase().includes(keyword))
        );
      });
    }

    // 3️⃣ If saved contacts found → return them
    if (savedUsers.length > 0) {
      const formatted = savedUsers.map((c) => ({
        user: {
          _id: c.user._id.toString(),
          name: c.savedName, // ⭐ USE SAVED NAME
          mobile: c.user.mobile,
          email: c.user.email,
          avatar: c.user.avatar,
          bio: c.user.bio,

          blockedByMe: myBlockedUsers.some(
            (p) => p.toString() === c.user._id.toString()
          ),
          blockedMe: myBlockedBy.some(
            (p) => p.toString() === c.user._id.toString()
          ),
        },

        lastMessage: null,
        unreadCount: 0,
        updatedAt: null,
      }));

      return res.json({
        success: true,
        contacts: formatted,
        source: "saved",
      });
    }

    // 4️⃣ If no saved contacts match → Search globally
    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { mobile: keyword },
        { email: { $regex: `^${keyword}$`, $options: "i" } },
      ],
    }).select("_id name mobile email avatar bio");

    const formattedGlobal = users.map((u) => ({
      user: {
        _id: u._id.toString(),
        name: u.name, // ⭐ Real name because not saved
        mobile: u.mobile,
        email: u.email,
        avatar: u.avatar,
        bio: u.bio,

        blockedByMe: myBlockedUsers.some(
          (p) => p.toString() === u._id.toString()
        ),
        blockedMe: myBlockedBy.some((p) => p.toString() === u._id.toString()),
      },
      lastMessage: null,
      unreadCount: 0,
      updatedAt: null,
    }));

    return res.json({
      success: true,
      contacts: formattedGlobal,
      source: "global",
    });
  } catch (error) {
    console.error("Get Contact List Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




export const markChatSeen = async (req, res) => {
  const userId = req.user.id; // who is reading
  const receiverId = req.params.id; // whose chat he opened

  try {
    const chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (chat) {
      chat.unreadCount.set(userId, 0); // reset unread for THIS viewer
      await chat.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("markChatSeen error:", err);
    return res.status(500).json({ success: false });
  }
};

