const { validationResult } = require("express-validator");
const UserSchema = require("../../models/user");
const MessageSchema = require("../../models/message");
const mongoose = require("mongoose");

const fetchChatlist = async (req, res) => {
  const userId = req.user.id; // Sender's ID (authenticated user)
  try {
    // Find the user making the request
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

    // Fetch ChatList users sorted by lastMessageTime (latest first)
    let chatUsers = sender.ChatList.filter((chat) => chat.userId) // Ensure userId exists
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)) // Sort by timestamp
      .map((chat) => {
        const receiver = chat.userId; // The user in the chat list (receiver)
        const contactEntry = sender.Contacts.find(
          (contact) => contact.contactmobile === receiver.Mobile
        );

        // Check if sender blocked the receiver
        const isBlockedBySender = sender.BlockedUsers.some((entry) =>
          entry.userId.equals(receiver._id)
        );

        // Check if receiver blocked the sender
        const isBlockedByReceiver = receiver.BlockedUsers.some((entry) =>
          entry.userId.equals(userId)
        );

        // Determine visibility based on receiver's privacy settings
        const isSenderInReceiverContacts = receiver.Contacts.some((contact) =>
          contact.userId.equals(userId)
        );

        const canSeeProfile = () => {
          if (receiver.privacySettings.profileVisibility === "public")
            return true;
          if (receiver.privacySettings.profileVisibility === "contacts")
            return isSenderInReceiverContacts;
          if (receiver.privacySettings.profileVisibility === "private")
            return userId === receiver._id.toString(); // Only the user themselves
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
          Email: receiver.Email, // Email visibility not controlled by privacy settings here
          Mobile: receiver.Mobile,
          lastMessageTime: chat.lastMessageTime,
          status:
            canSeeLastSeen() && !isBlockedByReceiver ? receiver.status : null,
          lastSeen:
            canSeeLastSeen() && !isBlockedByReceiver ? receiver.lastSeen : null,
          isBlockedBySender, // Sender blocked receiver
          isBlockedByReceiver, // Receiver blocked sender
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

    // Determine visibility based on receiver's privacy settings
    const isSenderInReceiverContacts = receiver.Contacts.some((contact) =>
      contact.userId.equals(senderid)
    );

    const canSeeLastSeen = () => {
      if (isBlockedByReceiver) return false; // Receiver blocked sender
      if (receiver.privacySettings.lastSeenVisibility === "public") return true;
      if (receiver.privacySettings.lastSeenVisibility === "contacts")
        return isSenderInReceiverContacts;
      if (receiver.privacySettings.lastSeenVisibility === "private")
        return senderid === receiverid; // Only the user themselves
      return false;
    };

    const canSeeProfile = () => {
      if (isBlockedByReceiver) return false; // Receiver blocked sender
      if (receiver.privacySettings.profileVisibility === "public") return true;
      if (receiver.privacySettings.profileVisibility === "contacts")
        return isSenderInReceiverContacts;
      if (receiver.privacySettings.profileVisibility === "private")
        return senderid === receiverid; // Only the user themselves
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
            // Sender sees their own messages
            if (msg.senderId.equals(senderid)) return true;
            // Don't show messages where sender is blocked by receiver
            if (
              msg.blockedId &&
              msg.blockedId.equals(receiverid) &&
              msg.receiverId.equals(senderid)
            )
              return false;
            return true; // Show all other messages
          })
          .sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime))
      : [];

    return res.status(200).json({
      success: true,
      messages: filteredMessages,
      userphoto: canSeeProfile() ? receiver.Photo : null, // Privacy-filtered photo
      status: canSeeLastSeen() ? receiver.status : null,
      lastSeen: canSeeLastSeen() ? receiver.lastSeen : null,
      isBlocked: isBlockedBySender,
      isBlockedByReceiver, // Included for completeness
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
  const io = req.io; // Use io from req
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
    // console.log("here in send recive route");
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
