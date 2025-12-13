import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // Two users in chat
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Last message preview
    lastMessage: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message",
          default: null,
        },
      },
    ],

    // Unread messages for each user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    // Delete chat per user
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Archive per user
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Typing indicator per user
    typing: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

// 🚀 OPTIMIZATION 1: MOST IMPORTANT INDEX!
// Finds user's chats INSTANTLY
chatSchema.index({ participants: 1 });

// 🚀 OPTIMIZATION 2: Index for deletedFor (fast filtering)
chatSchema.index({ deletedFor: 1 });

// 🚀 OPTIMIZATION 3: Index for archivedBy (fast filtering)
chatSchema.index({ archivedBy: 1 });

// 🚀 OPTIMIZATION 4: Compound index for sorting chats by activity
chatSchema.index({ updatedAt: -1 });

export default mongoose.model("Chat", chatSchema);
