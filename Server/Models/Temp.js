import mongoose from "mongoose";

const tempSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      // 🚀 OPTIMIZATION 1: Add index for faster OTP lookup by email
      index: true,
    },

    mobile: {
      type: String,
      trim: true,
      // 🚀 OPTIMIZATION 2: Add index for faster OTP lookup by mobile
      index: true,
    },

    password: {
      type: String,
    },

    otp: {
      type: String,
      required: true,
    },

    otpExpiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Auto delete temp user after 10 minutes (index TTL)
// 🚀 OPTIMIZATION 3: Keep your existing TTL index (this is good!)
tempSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

// 🚀 OPTIMIZATION 4: Add compound index for email+OTP (common query)
tempSchema.index({ email: 1, otp: 1 });

// 🚀 OPTIMIZATION 5: Add compound index for mobile+OTP (common query)
tempSchema.index({ mobile: 1, otp: 1 });

export default mongoose.model("Temp", tempSchema);
