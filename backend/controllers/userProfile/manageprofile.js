

const UserSchema = require("../../models/user");
const { sendEmail } = require("../../middleware"); 
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { uploadToCloudinary } = require("../../utils/cloudinary");

const updateProfile = async (req, res) => {
  const errorobject = {};
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((object) => {
      errorobject[object.path] = object.msg;
    });
    return res.status(400).json({
      error: errorobject,
    });
  }

  const { Name, Bio, Email, Mobile, Photo } = req.body;
  const userId = req.user.id;
  console.log(userId);

  try {
    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let uploadedPhotoUrl = "";
    if (Photo) {
     uploadedPhotoUrl = await uploadToCloudinary(Photo, {
       folder: "user_photos",
     });
    }

    const updateData = {
      Name: Name || user.Name,
      Mobile: Mobile || user.Mobile,
      Bio: Bio || "",
      Photo: uploadedPhotoUrl || user.Photo,
    };

    const updatedUser = await UserSchema.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (Email && Email !== user.Email) {
      const useralreadyexist = await UserSchema.findOne({ Email: Email });
      if (useralreadyexist) {
        return res.status(200).json({
          Otpsent: false,
          updatedUser: updateData,
          message: "The Email already exists, and other details are updated",
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000);
      const otpExpiry = Date.now() + 5 * 60 * 1000;
      await sendEmail(Email, otp);

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.pendingEmail = Email;
      await user.save();

      return res.status(200).json({
        Otpsent: true,
        updatedUser: updateData,
        message:
          "OTP sent to your new email address. Please verify to update your email.",
      });
    }

    res.status(200).json({
      Otpsent: false,
      updatedUser: updatedUser,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const validateProfileOtp = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  try {
    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.Email = user.pendingEmail;
    user.otp = null;
    user.otpExpiry = null;
    user.pendingEmail = null;
    await user.save();

    res.status(200).json({
      Email: user.Email,
      message: "Email updated successfully",
    });
  } catch (error) {
    console.error("Error validating OTP:", error);
    res.status(500).json({ message: "Internal server error" });
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