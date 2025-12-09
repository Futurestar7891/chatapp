import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      // 🚀 OPTIMIZATION 1: Index chatId (MOST IMPORTANT!)
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // 🚀 OPTIMIZATION 2: Index sender for undelivered messages
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // 🚀 OPTIMIZATION 3: Index receiver for undelivered messages
      index: true,
    },

    text: { type: String, default: "" },
    filename: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "file"],
      default: null,
    },
    mediaSize: Number,

    sentAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date, default: null },
    seenAt: { type: Date, default: null },

    isDeletedForEveryone: { type: Boolean, default: false },

    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// 🚀 OPTIMIZATION 4: COMPOUND INDEX - Most important for loading messages!
// This makes loading chat messages SUPER fast
messageSchema.index({ chatId: 1, createdAt: -1 });

// 🚀 OPTIMIZATION 5: Index for undelivered messages (Socket.IO needs this!)
messageSchema.index({ receiver: 1, deliveredAt: 1 });

// 🚀 OPTIMIZATION 6: Index for seen messages
messageSchema.index({ sender: 1, seenAt: 1 });

// 🚀 OPTIMIZATION 7: Index for auto-delete old messages (optional cleanup)
messageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
); // 30 days

export default mongoose.model("Message", messageSchema);
