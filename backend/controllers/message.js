
const { validationResult } = require("express-validator");
const UserSchema = require("../models/user");
const MessageSchema = require("../models/message");
const mongoose = require("mongoose");

const fetchChatlist=async(req,res)=>{
    const userId = req.user.id; // Extract user ID from the token
    console.log("i am enterd in fetching chats backend");
    try {
      // Find the user making the request
      const userexist = await UserSchema.findById(userId)
        .populate("ChatList.userId")
        .populate("Contacts.userId");

      if (!userexist) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Fetch ChatList users sorted by lastMessageTime (latest first)
      let chatUsers = userexist.ChatList.filter((chat) => chat.userId) // Ensure userId exists
        .sort(
          (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        ) // Sort by timestamp
        .map((chat) => {
          const contactEntry = userexist.Contacts.find(
            (contact) => contact.contactmobile === chat.userId.Mobile
          );

          return {
            _id: chat.userId._id,
            Name: contactEntry ? contactEntry.contactname : chat.userId.Name,
            Photo: chat.userId.Photo,
            Bio: chat.userId.Bio,
            Email: chat.userId.Email,
            Mobile: chat.userId.Mobile,
            lastMessageTime: chat.lastMessageTime,
          };
        });

      return res.status(200).json({
        success: true,
        users: chatUsers,
      });
    } catch (error) {
      console.error("Error in /search-user:", error.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
}



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

    console.log("entered in fetching message");

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
            // Don't show messages where sender is blocked by receiver (blockedId matches senderId)
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
      userphoto: receiver.Photo,
      isBlocked: isBlockedBySender,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const chattingRoom=async(req,res)=>{
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
}



const message=async(req,res)=>{
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
    console.log("here in send recive route");
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
}


module.exports={fetchChatlist,fetchMessage,chattingRoom,message};