import Temp from "../Models/Temp.js";
import User from "../Models/User.js";
import Contact from "../Models/Contact.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOTP, sendOTP } from "../nodeMailer.js";
import { buildChatList } from "../utils/chatListBuilder.js";

const isProd = process.env.NODE_ENV === "production";

 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 const mobileRegex = /^[6-9]\d{9}$/;
 const passwordRegex =
   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const signUp = async (req, res) => {
 

  try {
    let { name, email, mobile, password, confirmpassword } = req.body;
    const errors = {};

    // ---------- VALIDATIONS ----------
    if (!name) errors.name = "Name is required";
    else if (name.trim().length < 2)
      errors.name = "Name must be at least 2 characters";

    if (!email) errors.email = "Email is required";
    else if (!emailRegex.test(email)) errors.email = "Invalid email format";

    if (!mobile) errors.mobile = "Mobile is required";
    else if (!mobileRegex.test(mobile)) errors.mobile = "Invalid mobile number";

    if (!password) errors.password = "Password is required";
    else if (!passwordRegex.test(password))
      errors.password =
        "Password must contain 8+ chars, uppercase, lowercase, number, and special character";

    if (!confirmpassword)
      errors.confirmpassword = "Confirm password is required";
    else if (password !== confirmpassword)
      errors.confirmpassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    // ---------- CHECK IF USER EXISTS ----------
const userEmail = await User.findOne({ email });
const userMobile = await User.findOne({ mobile });

if (userEmail || userMobile) {
  return res.status(400).json({
    errors: {
      email: userEmail && "User already exists with this email",
      mobile: userMobile && "User already exists with this mobile",
    },
  });
}

    // ---------- DELETE PREVIOUS TEMP DATA ----------
    await Temp.deleteOne({ email });

    // ---------- CREATE OTP ----------
    const otp = generateOTP();
    const otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 min

    // ---------- HASH PASSWORD TEMPORARILY ----------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------- SAVE TEMP USER ----------
    await Temp.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      otp,
      otpExpiresAt,
    });

    // ---------- SEND EMAIL ----------
    const sent = await sendOTP(email, otp);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "OTP could not be sent",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
};


export const verifySignUpOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const tempUser = await Temp.findOne({ email });

    if (!tempUser) {
      return res.status(400).json({
        success: false,
        message: "No signup request found or OTP expired",
      });
    }

    // Check OTP
    if (tempUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check expiry
    if (tempUser.otpExpiresAt < Date.now()) {
      await Temp.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // ---------- CREATE USER ----------
    const newUser = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      mobile: tempUser.mobile,
      password: tempUser.password, // already hashed in temp
    });

    // Remove password safely
    const user = await User.findById(newUser._id).select("-password");

    // Delete temp record
    await Temp.deleteOne({ email });

    // ---------- CREATE JWT TOKEN ----------
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES,
    });

    // ---------- SEND COOKIE ----------
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd?true:false, // true only in production (HTTPS required)
    sameSite: isProd?"none":"lax",
    maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
    path: "/",
  });

    return res.status(200).json({
      success: true,
      message: "Signup verified & logged in",
      user
    });
  } catch (error) {
    console.error("Verify signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const signIn = async (req, res) => {
  try {
    let { emailOrMobile, password } = req.body;
    const errors = {};

    // Trim
    if (typeof emailOrMobile === "string") emailOrMobile = emailOrMobile.trim();

    // ---------- VALIDATIONS (same rules as signUp) ----------
    if (!emailOrMobile) {
      errors.emailOrMobile = "Email or mobile is required";
    } else {
      // If contains @ → treat as email
      if (emailOrMobile.includes("@")) {
        if (!emailRegex.test(emailOrMobile)) {
          errors.emailOrMobile = "Invalid email format";
        }
      } else {
        if (!mobileRegex.test(emailOrMobile)) {
          errors.emailOrMobile = "Invalid mobile number";
        }
      }
    }

    if (!password) {
      errors.password = "Password is required";
    } 

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // ---------- FIND USER ----------
    let user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
    });

    if (!user) {
      return res.status(400).json({
        errors: { emailOrMobile: "User not found" },
      });
    }

    // ---------- CHECK PASSWORD ----------
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        errors: { password: "Incorrect password" },
      });
    }

    // ---------- CREATE JWT ----------
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES,
    });

    // ---------- SEND COOKIE ----------
res.cookie("token", token, {
  httpOnly: true,
  secure: isProd ? true : false, // true only in production (HTTPS required)
  sameSite: isProd ? "none" : "lax",
  maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
  path: "/",
});

user = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user
      
    });
  } catch (error) {
    console.error("SignIn error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { emailOrMobile } = req.body;

    // 1️⃣ Validate emailOrMobile exists
    if (!emailOrMobile) {
      return res.status(400).json({
        success: false,
        errors: { emailOrMobile: "Please Enter Email" },
      });
    }

    // 2️⃣ Check if it is email & valid format
    if (emailOrMobile.includes("@")) {
      if (!emailRegex.test(emailOrMobile)) {
        return res.status(400).json({
          success: false,
          errors: { emailOrMobile: "Enter a valid Email" },
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        errors: { emailOrMobile: "Only email forgot Applicable" },
      });
    }

    // 3️⃣ CHECK USER EXISTS
    const user = await User.findOne({ email: emailOrMobile });
    console.log("yes");
    if (!user) {
      return res.status(400).json({
        success: false,
        errors: { emailOrMobile: "No account found with this email" },
      });
    }
   console.log("no");
    // 4️⃣ Remove any previous temp OTP entries
    await Temp.deleteOne({ email: emailOrMobile });

    // 5️⃣ Generate & Save OTP
    const otp = generateOTP();
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;

    await Temp.create({
      email: emailOrMobile,
      otp,
      otpExpiresAt,
    });

    // 6️⃣ Send email
    const sent = await sendOTP(emailOrMobile, otp);

    if (!sent) {
      return res.status(400).json({
        success: false,
        message: "Otp could not be sent",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Otp has been sent to your email",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Technical Server Error, ${error}`,
    });
  }
};


export const verifyForgotOtp = async (req, res) => {
  try {
    const { emailOrMobile, otp } = req.body;

    const tempUser = await Temp.findOne({ email: emailOrMobile });

    if (!tempUser) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found or OTP expired",
      });
    }

    if (tempUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (tempUser.otpExpiresAt < Date.now()) {
      await Temp.deleteOne({ email: emailOrMobile });
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // ---------- GENERATE RESET TOKEN ----------
    const resetToken = jwt.sign(
      { email: emailOrMobile },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    // ---------- SET COOKIE ----------
 res.cookie("resetToken", resetToken, {
   httpOnly: true,
   secure: isProd ? true : false, // true only in production (HTTPS required)
   sameSite: isProd ? "none" : "lax",
   maxAge: 10 * 60 * 1000,
   path: "/",
 });


    return res.status(200).json({
      success: true,
      message: "OTP verified",
    });
  } catch (error) {
    console.error("Verify Forgot OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const errors = {};
    const { password, confirmpassword } = req.body;

    // --------- GET TOKEN FROM COOKIE ----------
    const resetToken = req.cookies.resetToken;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Reset token expired or missing",
      });
    }

    // ---------- VALIDATIONS ----------
    if (!password) errors.password = "Password is required";
    if (!confirmpassword)
      errors.confirmpassword = "Confirm password is required";

    if (password && !passwordRegex.test(password)) {
      errors.password =
        "Password must be at least one capital, one small, one number, one special character and 8+ characters";
    }

    if (password !== confirmpassword) {
      errors.confirmpassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // ---------- VERIFY RESET TOKEN ----------
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const email = decoded.email;

    // ---------- UPDATE PASSWORD ----------
    const hashedPassword = await bcrypt.hash(password, 10);

    const userExist = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    if (!userExist) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    // ---------- CLEAR TOKEN COOKIE ----------
    res.clearCookie("resetToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login with new password",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Technical server error",
    });
  }
};

export const sendEmailUpdateOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        errors: {email:"Email is required"},
      });
    }

    if(!emailRegex.test(newEmail)){
      return res.status(400).json({
        success: false,
        errors: { email: "email format is wrong" },
      });
    }

    // Check if new email is already used by another user
    const exists = await User.findOne({ email: newEmail });
    if (exists) {
      return res.status(400).json({
        success: false,
        errors:{email:"This email is already registered"} ,
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create/Update Temp entry
    await Temp.findOneAndUpdate(
      { email: newEmail },
      {
        email: newEmail,
        otp,
        otpExpiresAt: Date.now() + 10 * 60 * 1000, // 10 min expiry
      },
      { upsert: true, new: true }
    );

    // Send OTP email
    await sendOTP(newEmail, otp);
    return res.status(200).json({
      success: true,
      message: "OTP sent to the new email",
    });
  } catch (error) {
    console.log("Send Email Update OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while sending OTP",
    });
  }
};
export const verifyEmailUpdateOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const temp = await Temp.findOne({ email });

    if (!temp) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (temp.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (temp.otpExpiresAt < Date.now()) {
      await Temp.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // OTP verified → delete it
    await Temp.deleteOne({ email });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("Verify Email Update OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying OTP",
    });
  }
};


export const updateProfileInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, bio, currentPassword } = req.body;
    console.log(req.body);

    const errors = {};
    const user = await User.findById(userId);

    // ------------------ VALIDATIONS ------------------

    // Current Password Check
    if (!currentPassword || currentPassword.trim() === "") {
      errors.currentPassword = "Current password is required";
    } else {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) errors.currentPassword = "Incorrect current password";
    }

    // Name Validation
    if (!name || name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = "Invalid email format";
    }

    // Prevent duplicate email
    if (email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) errors.email = "Email already registered";
    }

 

    // Bio validation
    if (!bio || bio.trim() === "") {
      errors.bio = "Bio cannot be empty";
    }

    // Return field errors
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // ------------------ UPDATE USER ------------------
    user.name = name;
    user.email = email;
    user.bio = bio;

    await user.save();

    return res.json({
      success: true,
      user,
      message:"Profile Updated successfully"
    });
  } catch (error) {
    console.log("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: "No avatar URL provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    ).select("-password");

    return res.json({
      success: true,
      message: "Avatar updated successfully",
      user,
    });
  } catch (error) {
    console.log("Update Avatar Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentpassword, newpassword, confirmpassword } = req.body;
    const userId = req.user.id;

    const errors = {};
    const user = await User.findById(userId);

    // ---------------- VALIDATION ----------------

    // Current password
    if (!currentpassword || currentpassword.trim() === "")
      errors.currentpassword = "Current password is required";
    else {
      const match = await bcrypt.compare(currentpassword, user.password);
      if (!match) errors.currentpassword = "Incorrect current password";
    }

    // New password
    if (!newpassword) {
      errors.newpassword = "New password is required";
    } else if (!passwordRegex.test(newpassword)) {
      errors.newpassword =
        "Password must contain 8+ chars, uppercase, lowercase, number & special character";
    }

    // Confirm password
    if (!confirmpassword) {
      errors.confirmpassword = "Confirm password is required";
    } else if (newpassword !== confirmpassword) {
      errors.confirmpassword = "Passwords do not match";
    }

    if(currentpassword===newpassword){
      errors.newpassword="Cannot be same as current password";
    }

    // Return errors
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // -------------- UPDATE PASSWORD --------------
    const hashed = await bcrypt.hash(newpassword, 10);
    user.password = hashed;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Technical server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Clear authentication cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd ? true : false, // true only in production (HTTPS required)
      sameSite: isProd ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while logging out",
    });
  }
};

export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user + blocked data
    const user = await User.findById(userId)
      .select("statusVisibility blockedUsers blockedBy")
      .populate("blockedUsers", "name email avatar")
      .populate("blockedBy", "name email avatar");


    res.json({
      success: true,
      settings: {
        statusVisibility: user.statusVisibility,
        blockedUsers: user.blockedUsers,
        blockedBy: user.blockedBy,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId, savedName, statusVisibility } = req.body;

    let actionType = null;
    let shouldSendChatList = false; // ⭐ KEY FIX

    const user = await User.findById(userId).select(
      "statusVisibility blockedUsers blockedBy"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ⭐ 1. Privacy update (NO chatlist)
    if (statusVisibility) {
      user.statusVisibility = statusVisibility;
      actionType = "privacy_updated";
    }

    // ⭐ 2. Contact save/update (YES chatlist)
    if (receiverId && savedName) {
      const existing = await Contact.findOne({ userId, contactId: receiverId });

      if (existing) {
        existing.savedName = savedName;
        await existing.save();
        actionType = "contact_updated";
      } else {
        await Contact.create({
          userId,
          contactId: receiverId,
          savedName,
        });
        actionType = "contact_added";
      }

      shouldSendChatList = true; // ✅ ONLY HERE
    }

    // ⭐ 3. Block / Unblock (NO chatlist)
    else if (receiverId && !savedName) {
      const alreadyBlocked = user.blockedUsers.some(
        (id) => id.toString() === receiverId
      );

      if (alreadyBlocked) {
        user.blockedUsers = user.blockedUsers.filter(
          (id) => id.toString() !== receiverId
        );

        await User.findByIdAndUpdate(receiverId, {
          $pull: { blockedBy: userId },
        });

        actionType = "unblocked";
      } else {
        user.blockedUsers.push(receiverId);

        await User.findByIdAndUpdate(receiverId, {
          $addToSet: { blockedBy: userId },
        });

        actionType = "blocked";
      }
    }

    await user.save();

    // ⭐ Repopulate settings
    const populatedUser = await User.findById(userId)
      .select("statusVisibility blockedUsers blockedBy")
      .populate("blockedUsers", "name email avatar")
      .populate("blockedBy", "name email avatar");

    // ⭐ Only build chatlist when required
    let chatlist = null;
    if (shouldSendChatList) {
      chatlist = await buildChatList(userId);
    }

    return res.json({
      success: true,
      action: actionType,
      chatlist, // null unless name changed
      settings: {
        statusVisibility: populatedUser.statusVisibility,
        blockedUsers: populatedUser.blockedUsers,
        blockedBy: populatedUser.blockedBy,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


