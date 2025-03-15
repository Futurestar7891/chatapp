const { validationResult } = require("express-validator");
const UserSchema = require("../models/user");
const { hash, compare } = require("bcryptjs");
const { sendEmail } = require("../middleware");

// Change Password Function
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const errorobject = {};

  // Validate inputs
  if (!oldPassword) {
    errorobject.oldPassword = "Old Password is required";
  }
  if (!newPassword) {
    errorobject.newPassword = "New Password is required";
  }
  if (!confirmPassword) {
    errorobject.confirmPassword = "Confirm Password is required";
  }
  if (newPassword !== confirmPassword) {
    errorobject.confirmPassword = "Passwords do not match";
  }

  if (!errors.isEmpty()) {
    errors.array().forEach((object) => {
      errorobject[object.path] = object.msg;
    });
    return res.status(400).json({
      success: false,
      error: errorobject,
    });
  }

  try {
    const user = await UserSchema.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const isPasswordValid = await compare(oldPassword, user.Password);
    if (!isPasswordValid) {
      errorobject.oldPassword = "Incorrect old password";
      return res.status(400).json({ success: false, error: errorobject });
    }

    if (newPassword === oldPassword) {
      errorobject.newPassword = "Password Cannot be Same as Old";
      return res.status(400).json({ success: false, error: errorobject });
    }

    const hashedPassword = await hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing the password.",
    });
  }
};

// Send OTP Route
const sendOtp = async (req, res) => {
  const { emailOrMobile } = req.body;

  if (!emailOrMobile) {
    return res.status(400).json({
      success: false,
      message: "Email or mobile number is required.",
    });
  }

  try {
    const user = await UserSchema.findOne({
      $or: [{ Email: emailOrMobile }, { Mobile: emailOrMobile }],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    user.otp = otp;
    user.otpExpiry = Date.now() + 300000; // 5 minutes expiry
    await user.save();

    if (emailOrMobile.includes("@")) {
      await sendEmail(emailOrMobile, otp);
    } else {
      // await sendSms(emailOrMobile, otp);
      return res.status(401).json({
        success: false,
        message: "Only Email service is available for forgot",
      });
    }

    return res.status(200).json({
      success: true,
      Otp: otp, // Note: In production, avoid sending OTP in response for security
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

// Validate OTP Route
const validateOtp = async (req, res) => {
  const { emailOrMobile, otp } = req.body;

  if (!emailOrMobile || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email/Mobile and OTP are required.",
    });
  }

  try {
    const user = await UserSchema.findOne({
      $or: [{ Email: emailOrMobile }, { Mobile: emailOrMobile }],
      otp: otp,
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    if (user.otpExpiry < Date.now()) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired." });
    }

    // Clear OTP after successful validation
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "OTP validated successfully." });
  } catch (error) {
    console.error("Error validating OTP:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

// Reset Password Route
const resetPassword = async (req, res) => {
  const { emailOrMobile, newPassword, confirmPassword } = req.body;
  const errors = validationResult(req);
  const errorobject = {};

  if (!errors.isEmpty()) {
    errors.array().forEach((object) => {
      errorobject[object.path] = object.msg;
    });
    return res.status(400).json({ success: false, error: errorobject });
  }

  try {
    const user = await UserSchema.findOne({
      $or: [{ Email: emailOrMobile }, { Mobile: emailOrMobile }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or OTP not validated.",
      });
    }

    if (newPassword !== confirmPassword) {
      errorobject.confirmPassword =
        "New password and confirm password do not match.";
      return res.status(400).json({ success: false, error: errorobject });
    }

    const hashedPassword = await hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting the password.",
    });
  }
};

module.exports = { changePassword, sendOtp, validateOtp, resetPassword };
