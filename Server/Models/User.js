import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      // 🚀 OPTIMIZATION 1: Add index for name search
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Already has unique index (good!)
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Already has unique index (good!)
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "Hare Krishna Hare Ram",
    },

    // ⭐ Users I BLOCKED
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ⭐ Users who BLOCKED ME
    blockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    statusVisibility: {
      type: String,
      enum: ["onlyme", "contacts", "anyone"],
      default: "contacts",
      index: true, // for fast privacy lookup
    },
  },
  { timestamps: true }
);

// 🚀 OPTIMIZATION 2: Add compound index for blocked users queries
userSchema.index({ blockedUsers: 1 });
userSchema.index({ blockedBy: 1 });

// 🚀 OPTIMIZATION 3: Add index for createdAt (for sorting users by join date)
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);
