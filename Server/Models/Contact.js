import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // 🚀 OPTIMIZATION 1: Index userId (you always search by user)
      index: true,
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // 🚀 OPTIMIZATION 2: Index contactId too
      index: true,
    },

    savedName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// 🚀 OPTIMIZATION 3: COMPOUND INDEX - Most important!
// Makes checking "is this user in my contacts?" SUPER fast
contactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

// 🚀 OPTIMIZATION 4: Index for reverse lookup
// "Who has saved me as a contact?"
contactSchema.index({ contactId: 1 });

export default mongoose.model("Contact", contactSchema);
