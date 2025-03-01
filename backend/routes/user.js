// Forms/userRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware");
const {
  signupvalidation,
  loginvalidation,
  changePasswordValidation,
  resetPasswordValidation,
  editprofilevalidation,
} = require("../Validatedata");
const { signup } = require("../controllers/usersignup");
const { login, logout } = require("../controllers/userlogin");
const {
  changePassword,
  sendOtp,
  validateOtp,
  resetPassword,
} = require("../controllers/useredit");
const { updateProfile, validateProfileOtp, blockUser, unblockUser, deleteUser } = require("../controllers/manageprofile");

// User authentication routes
router.post("/signup", signupvalidation, signup);
router.post("/login", loginvalidation, login); // Fixed typo: removed extra slash
router.post(
  "/change-password",
  authenticateToken,
  changePasswordValidation,
  changePassword
);
router.post("/send-otp", sendOtp); // Fixed typo: removed extra slashes
router.post("/validate-otp", validateOtp);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.post("/update-profile",authenticateToken,editprofilevalidation,updateProfile);
router.post("/validateprofileotp",authenticateToken,validateProfileOtp);
router.post("/block-user", authenticateToken,blockUser);
router.post("/unblock-user", authenticateToken,unblockUser);
router.delete("/delete-user", authenticateToken,deleteUser);
router.post("/logout",logout);

module.exports = router; // Simple export, no io needed here
