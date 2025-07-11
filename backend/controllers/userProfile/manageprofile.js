

const UserSchema = require("../../models/user");
const { sendEmail } = require("../../middleware"); 
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { uploadToCloudinary } = require("../../utils/cloudinary");

const updateProfile = async (req, res) => {
  const { Name, Bio, Email, Mobile, Photo } = req.body;
  const userId = req.user.id;

  const errorobject = {};
  const errors = validationResult(req);
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
    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isEmailChanged = Email && Email !== user.Email;

    if (isEmailChanged) {
      // Check if new email already exists
      const userExists = await UserSchema.findOne({ Email });
      if (userExists) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Generate and send OTP
      const otp = Math.floor(1000 + Math.random() * 9000);
      const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

      try {
        await sendEmail(Email, otp);
      } catch (emailError) {
        console.error("Error sending OTP email:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
        });
      }

      // Save only the pending email and OTP data
      user.pendingEmail = Email;
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        message:
          "OTP sent to your new email. Please verify to update your profile.",
        user: {
          Name: user.Name,
          Email: user.Email,
          Mobile: user.Mobile,
          Bio: user.Bio,
          Photo: user.Photo,
        },
      });
    }

    // If email is not changed, update all fields immediately
    let uploadedPhotoUrl = user.Photo;
    if (Photo) {
      try {
        uploadedPhotoUrl = await uploadToCloudinary(Photo, {
          folder: "user_photos",
        });
      } catch (uploadError) {
        console.error("Error uploading photo:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading profile photo",
        });
      }
    }

    const updateData = {
      Name: Name || user.Name,
      Email: Email || user.Email,
      Mobile: Mobile || user.Mobile,
      Bio: Bio || user.Bio,
      Photo: uploadedPhotoUrl,
    };

    const updatedUser = await UserSchema.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      requiresOtp: false,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const validateProfileOtp = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  try {
    
    const user = await UserSchema.findById(userId);
    console.log(
      "Validating OTP for userId:",
      userId,
      "with OTP:",
      otp,
      user.otp
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "No pending OTP verification",
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    
    
    if (isNaN(otp) || otp!== user.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Update all fields after OTP validation
    const { Name, Bio, Mobile, Photo } = req.body;
    let uploadedPhotoUrl = user.Photo;
    if (Photo) {
      try {
        uploadedPhotoUrl = await uploadToCloudinary(Photo, {
          folder: "user_photos",
        });
      } catch (uploadError) {
        console.error("Error uploading photo:", uploadError);
      }
    }

    const updateData = {
      Name: Name || user.Name,
      Email: user.pendingEmail, // Update email from pendingEmail
      Mobile: Mobile || user.Mobile,
      Bio: Bio || user.Bio,
      Photo: uploadedPhotoUrl,
    };

    Object.assign(user, updateData); // Update user object directly
    user.otp = null;
    user.otpExpiry = null;
    user.pendingEmail = null;
    await user.save();

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        Name: user.Name,
        Email: user.Email,
        Mobile: user.Mobile,
        Bio: user.Bio,
        Photo: user.Photo,
      },
    });
  } catch (error) {
    console.error("Error in validateProfileOtp:", error);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const blockUser = async (req, res) => {
  const { blockedUserId } = req.body;
  const userId = req.user.id;
  console.log("we are in block route");

  try {
    const currentUser = await UserSchema.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
      return res.status(400).json({ message: "Invalid blocked user ID" });
    }

    currentUser.BlockedUsers.push({ userId: blockedUserId });
    await currentUser.save();

    console.log("After blocking, BlockedUsers:", currentUser.BlockedUsers);

    res.status(200).json({
      message: "User blocked successfully",
      blockedarray: currentUser.BlockedUsers,
      isBlocked: true,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const unblockUser = async (req, res) => {
  const { blockedUserId } = req.body;
  const userId = req.user.id;
  console.log("we are in unblock route");

  try {
    if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
      return res.status(400).json({ message: "Invalid blocked user ID" });
    }

    const blockedUserIdObj = new mongoose.Types.ObjectId(blockedUserId);
    const result = await UserSchema.updateOne(
      { _id: userId },
      { $pull: { BlockedUsers: { userId: blockedUserIdObj } } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "User not found or already unblocked" });
    }

    const currentUser = await UserSchema.findById(userId);

    console.log("After unblocking, BlockedUsers:", currentUser.BlockedUsers);

    res.status(200).json({
      message: "User unblocked successfully",
      blockedarray: currentUser.BlockedUsers,
      isBlocked: false,
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await UserSchema.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports={updateProfile,validateProfileOtp,blockUser,unblockUser,deleteAccount};