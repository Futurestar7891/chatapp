const { validationResult } = require("express-validator");
const UserSchema = require("../../models/user");
const MessageSchema = require("../../models/message");
const mongoose = require("mongoose");

const fetchChatlist = async (req, res) => {
  const userId = req.user.id;
  try {
    const sender = await UserSchema.findById(userId)
      .populate(
        "ChatList.userId",
        "Name Photo Mobile Bio Email status lastSeen privacySettings BlockedUsers Contacts"
      )
      .populate("Contacts.userId");

    if (!sender) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let chatUsers = sender.ChatList.filter((chat) => chat.userId)
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
      .map((chat) => {
        const receiver = chat.userId;
        const contactEntry = sender.Contacts.find(
          (contact) => contact.contactmobile === receiver.Mobile
        );

        const isBlockedBySender = sender.BlockedUsers.some((entry) =>
          entry.userId.equals(receiver._id)
        );
        const isBlockedByReceiver = receiver.BlockedUsers.some((entry) =>
          entry.userId.equals(userId)
        );

        const isSenderInReceiverContacts = receiver.Contacts.some((contact) =>
          contact.userId.equals(userId)
        );

        const canSeeProfile = () => {
          if (receiver.privacySettings.profileVisibility === "public")
            return true;
          if (receiver.privacySettings.profileVisibility === "contacts")
            return isSenderInReceiverContacts;
          if (receiver.privacySettings.profileVisibility === "private")
            return userId === receiver._id.toString();
          return false;
        };

        const canSeeLastSeen = () => {
          if (receiver.privacySettings.lastSeenVisibility === "public")
            return true;
          if (receiver.privacySettings.lastSeenVisibility === "contacts")
            return isSenderInReceiverContacts;
          if (receiver.privacySettings.lastSeenVisibility === "private")
            return userId === receiver._id.toString();
          return false;
        };

        const canSeeBio = () => {
          if (receiver.privacySettings.bioVisibility === "public") return true;
          if (receiver.privacySettings.bioVisibility === "contacts")
            return isSenderInReceiverContacts;
          if (receiver.privacySettings.bioVisibility === "private")
            return userId === receiver._id.toString();
          return false;
        };

        return {
          _id: receiver._id,
          Name: contactEntry ? contactEntry.contactname : receiver.Name,
          Photo:
            canSeeProfile() && !isBlockedByReceiver ? receiver.Photo : null,
          Bio: canSeeBio() && !isBlockedByReceiver ? receiver.Bio : null,
          Email: receiver.Email,
          Mobile: receiver.Mobile,
          lastMessageTime: chat.lastMessageTime,
          status:
            canSeeLastSeen() && !isBlockedByReceiver ? receiver.status : null,
          lastSeen:
            canSeeLastSeen() && !isBlockedByReceiver ? receiver.lastSeen : null,
          isBlockedBySender,
          isBlockedByReceiver,
        };
      });

    return res.status(200).json({
      success: true,
      users: chatUsers,
    });
  } catch (error) {
    console.error("Error in /fetch-chatlist:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const fetchMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array() });
  }

  try {
    const { senderid, receiverid } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(senderid) ||
      !mongoose.Types.ObjectId.isValid(receiverid)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender or receiver ID",
      });
    }

    const sender = await UserSchema.findById(senderid);
    const receiver = await UserSchema.findById(receiverid);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver does not exist",
      });
    }

    const isBlockedBySender = sender.BlockedUsers.some((entry) =>
      entry.userId.equals(receiverid)
    );
    const isBlockedByReceiver = receiver.BlockedUsers.some((entry) =>
      entry.userId.equals(senderid)
    );

    const isSenderInReceiverContacts = receiver.Contacts.some((contact) =>
      contact.userId.equals(senderid)
    );

    const canSeeLastSeen = () => {
      if (isBlockedByReceiver) return false;
      if (receiver.privacySettings.lastSeenVisibility === "public") return true;
      if (receiver.privacySettings.lastSeenVisibility === "contacts")
        return isSenderInReceiverContacts;
      if (receiver.privacySettings.lastSeenVisibility === "private")
        return senderid === receiverid;
      return false;
    };

    const canSeeProfile = () => {
      if (isBlockedByReceiver) return false;
      if (receiver.privacySettings.profileVisibility === "public") return true;
      if (receiver.privacySettings.profileVisibility === "contacts")
        return isSenderInReceiverContacts;
      if (receiver.privacySettings.profileVisibility === "private")
        return senderid === receiverid;
      return false;
    };

    const canSeeBio = () => {
      if (isBlockedByReceiver) return false;
      if (receiver.privacySettings.bioVisibility === "public") return true;
      if (receiver.privacySettings.bioVisibility === "contacts")
        return isSenderInReceiverContacts;
      if (receiver.privacySettings.bioVisibility === "private")
        return senderid === receiverid;
      return false;
    };

    const conversation = await MessageSchema.findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(senderid),
          new mongoose.Types.ObjectId(receiverid),
        ],
      },
    }).populate("messages.senderId", "Name");

    const filteredMessages = conversation
      ? conversation.messages
          .filter((msg) => {
            if (msg.senderId.equals(senderid)) return true;
            if (
              msg.blockedId &&
              msg.blockedId.equals(receiverid) &&
              msg.receiverId.equals(senderid)
            )
              return false;
            return true;
          })
          .sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime))
      : [];

    return res.status(200).json({
      success: true,
      messages: filteredMessages,
      userphoto: canSeeProfile() ? receiver.Photo : null,
      status: canSeeLastSeen() ? receiver.status : null,
      lastSeen: canSeeLastSeen() ? receiver.lastSeen : null,
      bio: canSeeBio() ? receiver.Bio : null,
      isBlocked: isBlockedBySender,
      isBlockedByReceiver,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const chattingRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await UserSchema.findById(userId).select("ChatList");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      chatList: user.ChatList.map((chat) => ({
        userId: chat.userId.toString(),
        lastMessageTime: chat.lastMessageTime,
      })),
    });
  } catch (error) {
    console.error("Error fetching chat list:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat list",
      error: error.message,
    });
  }
};

const message = async (req, res) => {
  const { senderid, receiverid, message } = req.body;
  const io = req.io;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array() });
  }

  try {
    const sender = await UserSchema.findById(senderid);
    const receiver = await UserSchema.findById(receiverid);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver does not exist",
      });
    }

    const conversation = await MessageSchema.sendMessage(
      io,
      senderid,
      receiverid,
      message
    );

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      messages: conversation.messages,
    });
  } catch (error) {
    console.error("Error in /send-receive:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

module.exports = { fetchChatlist, fetchMessage, chattingRoom, message };
