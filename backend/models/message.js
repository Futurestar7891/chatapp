const mongoose = require("mongoose");
const UserSchema = require("./user");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { userRoomMap } = require("../utils/socketMap");

const MessageSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
        default: "",
      },
      files: [
        {
          name: { type: String, required: true },
          type: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
      sentTime: {
        type: Date,
        required: true,
      },
      receivedTime: {
        type: Date,
        default: null,
      },
      seenTime:{
         type: Date,
        default: null,
      },
      blockedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
  ],
});

MessageSchema.statics.sendMessage = async function (
  io,
  senderId,
  receiverId,
  message
) {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      throw new Error("Invalid sender or receiver ID");
    }

    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const sender = await UserSchema.findById(senderId);
    if (!sender) {
      throw new Error(`Sender with ID ${senderId} not found`);
    }

    const receiver = await UserSchema.findById(receiverId);
    if (!receiver) {
      throw new Error(`Receiver with ID ${receiverId} not found`);
    }

    // Check if receiver has blocked sender
    const isBlockedByReceiver = receiver.BlockedUsers.some((blocked) =>
      blocked.userId.equals(senderId)
    );

    let conversation = await this.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    const uploadedFiles = [];
    if (message.files && message.files.length > 0) {
      for (const file of message.files) {
        const url = await uploadToCloudinary(file, { folder: "chat_files" });
        uploadedFiles.push({
          name: file.name,
          type: file.type,
          url,
        });
      }
    }

    const newMessage = {
      senderId: senderObjectId,
      receiverId: receiverObjectId,
      text: message.text || "",
      files: uploadedFiles,
      sentTime: new Date(message.sentTime || Date.now()),
      receivedTime: null,
      seentTime:null,
      blockedId: isBlockedByReceiver ? senderObjectId : null, // Set blockedId if blocked by receiver
    };

    if (!conversation) {
      conversation = new this({
        participants: [senderObjectId, receiverObjectId],
        messages: [newMessage],
      });
    } else {
      conversation.messages.push(newMessage);
    }

    await conversation.save();

    // Fetch the updated conversation with the saved message
    conversation = await this.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });
    const savedMessage =
      conversation.messages[conversation.messages.length - 1];

    // Function to update ChatList
    const updateChatList = async (userId, otherUserId, timestamp) => {
      const user = await UserSchema.findById(userId);
      if (user) {
        const chatEntry = user.ChatList.find((chat) =>
          chat.userId.equals(otherUserId)
        );
        if (chatEntry) {
          chatEntry.lastMessageTime = timestamp;
        } else {
          user.ChatList.push({
            userId: otherUserId,
            lastMessageTime: timestamp,
          });
        }
        await user.save();
      }
    };

    // Update sender's ChatList with sentTime (always, even if blocked)
    await updateChatList(senderId, receiverId, savedMessage.sentTime);

    // Only update receiver's ChatList if not blocked
    if (!isBlockedByReceiver) {
      const reciverRoom = userRoomMap.get(receiverId);
      const RoomId=[senderId,receiverId].sort().join("-");

      if(reciverRoom===RoomId){
        savedMessage.seenTime = new Date();
      }
      savedMessage.receivedTime = new Date();
      await conversation.save();
      await updateChatList(receiverId, senderId, savedMessage.receivedTime);
    }


    if (!isBlockedByReceiver) {
      const roomId = [senderId, receiverId].sort().join("-");
      io.to(roomId).emit("receiveMessage", {
        ...savedMessage._doc,
        sentTime: savedMessage.sentTime.toISOString(),
        receivedTime: savedMessage.receivedTime
          ? savedMessage.receivedTime.toISOString()
          : null,
        seenTime: savedMessage.seenTime
          ? savedMessage.seenTime.toISOString()
          : null,
      });
      console.log(`Emitted message to room ${roomId}`);
    } else {
      console.log("Message not emitted: Receiver has blocked sender");
    }

    return {
      success: true,
      messages: conversation.messages,
    };
  } catch (error) {
    console.error("Error sending message:", error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
