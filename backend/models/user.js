const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Mobile: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
    required: true,
  },
  Photo: {
    type: String,
  },
  Bio: {
    type: String,
    default:
      "Hare Krishna Hare Krishna, Krishna Krishna Hare Hare Hare Rama Hare Rama Rama Rama Hare Hare",
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
  ChatList: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      lastMessageTime: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  BlockedUsers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  ],
  Contacts: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      contactname: {
        type: String,
        required: true,
      },
      contactmobile: {
        type: String,
      },
      contactemail: {
        type: String,
      },
    },
  ],
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  pendingEmail: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ["public", "contacts", "private"],
      default: "public",
    },
    lastSeenVisibility: {
      type: String,
      enum: ["public", "contacts", "private"],
      default: "public",
    },
    messageRequests: {
      type: String,
      enum: ["everyone", "contacts", "none"],
      default: "everyone",
    },
  },
  notifications: {
    messageNotifications: {
      type: Boolean,
      default: true,
    },
    callNotifications: {
      type: Boolean,
      default: true,
    },
    activityNotifications: {
      type: Boolean,
      default: true,
    },
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false,
    },
    secret: {
      type: String,
      default: null,
    },
  },
  role: {
    type: String,
    enum: ["user", "admin", "moderator"],
    default: "user",
  },
  devices: [
    {
      deviceId: {
        type: String,
        required: true,
      },
      deviceName: {
        type: String,
        required: true,
      },
      lastLogin: {
        type: Date,
        default: Date.now,
      },
      loggedIn: {
        type: Boolean,
        default: true,
      },
    },
  ],
  language: {
    type: String,
    default: "en",
  },
  theme: {
    type: String,
    enum: ["light", "dark", "system"],
    default: "system",
  },
  verification: {
    emailVerified: {
      type: Boolean,
      default: false,
    },
    mobileVerified: {
      type: Boolean,
      default: false,
    },
  },
  activityLog: [
    {
      action: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
  ],
  groups: [
    {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
      },
      role: {
        type: String,
        enum: ["member", "admin", "moderator"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  preferences: {
    fontSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    notificationSound: {
      type: String,
      default: "default",
    },
  },
  reports: [
    {
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      reason: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      resolved: {
        type: Boolean,
        default: false,
      },
    },
  ],
  backupEmail: {
    type: String,
    default: null,
  },
  socialLinks: {
    facebook: {
      type: String,
      default: null,
    },
    twitter: {
      type: String,
      default: null,
    },
    instagram: {
      type: String,
      default: null,
    },
    linkedin: {
      type: String,
      default: null,
    },
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
