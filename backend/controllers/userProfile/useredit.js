const { validationResult } = require("express-validator");
const UserSchema = require("../../models/user");
const { hash, compare } = require("bcryptjs");
const { sendEmail } = require("../../middleware");

const sendOtp = async (req, res) => {
  const { emailOrMobile } = req.body;
  const errorobject = {};

  if (!emailOrMobile) {
    errorobject.emailOrMobile = "Email or mobile is required";
    return res.status(400).json({
      success: false,
      error: errorobject,
    });
  }

  try {
    const user = await UserSchema.findOne({
      $or: [{ Email: emailOrMobile }, { Mobile: emailOrMobile }],
    });

    if (!user) {
      errorobject.emailOrMobile = "User not found";
      return res.status(404).json({
        success: false,
        error: errorobject,
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    user.otp = otp;
    user.otpExpiry = Date.now() + 300000; // 5 minutes expiry
    await user.save();

    if (emailOrMobile.includes("@")) {
      await sendEmail(emailOrMobile, otp);
    } else {
      return res.status(400).json({
        success: false,
        error: { emailOrMobile: "Mobile OTP not supported" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: { general: "Failed to send OTP. Please try again." },
    });
  }
};

const validateOtp = async (req, res) => {
  const { emailOrMobile, otp } = req.body;
  const errorobject = {};

  if (!emailOrMobile) {
    errorobject.emailOrMobile = "Email or mobile is required";
  }
  if (!otp) {
    errorobject.otp = "OTP is required";
  }

  if (Object.keys(errorobject).length > 0) {
    return res.status(400).json({
      success: false,
      error: errorobject,
    });
  }

  try {
    const user = await UserSchema.findOne({
      $or: [{ Email: emailOrMobile }, { Mobile: emailOrMobile }],
    });

    if (!user) {
      errorobject.emailOrMobile = "User not found";
      return res.status(404).json({
        success: false,
        error: errorobject,
      });
    }

    if (user.otp !== otp) {
      errorobject.otp = "Invalid OTP";
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    if (user.otpExpiry < Date.now()) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      errorobject.otp = "OTP has expired";
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    // Clear OTP after successful validation
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP validated successfully",
    });
  } catch (error) {
    console.error("Error validating OTP:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: { general: "Failed to validate OTP. Please try again." },
    });
  }
};

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
      errorobject.emailOrMobile = "User not found";
      return res.status(404).json({
        success: false,
        error: errorobject,
      });
    }

    if (newPassword !== confirmPassword) {
      errorobject.confirmPassword = "Passwords do not match";
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    const hashedPassword = await hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: { general: "Failed to reset password. Please try again." },
    });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const errors = validationResult(req);
  const errorobject = {};

  if (!errors.isEmpty()) {
    errors.array().forEach((object) => {
      errorobject[object.path] = object.msg;
    });
    return res.status(400).json({ success: false, error: errorobject });
  }

  try {
    const user = await UserSchema.findById(req.user.id);
    if (!user) {
      errorobject.general = "User not found";
      return res.status(404).json({
        success: false,
        error: errorobject,
      });
    }

    const isPasswordValid = await compare(oldPassword, user.Password);
    if (!isPasswordValid) {
      errorobject.oldPassword = "Incorrect old password";
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    if (newPassword === oldPassword) {
      errorobject.newPassword = "New password cannot be same as old password";
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    const hashedPassword = await hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred",
      error: { general: "Failed to change password. Please try again." },
    });
  }
};
module.exports = { changePassword, sendOtp, validateOtp, resetPassword };
