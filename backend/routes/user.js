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
const { signup } = require("../controllers/userForms/usersignup");
const { login, logout } = require("../controllers/userForms/userlogin");
const {
  changePassword,
  sendOtp,
  validateOtp,
  resetPassword,
} = require("../controllers/userProfile/useredit");
const {
  updateProfile,
  validateProfileOtp,
  blockUser,
  unblockUser,
  deleteAccount,
} = require("../controllers/userProfile/manageprofile");
const {
  fetchContacts,
  addContact,
  searchContact,
  
} = require("../controllers/userInfo/usercontact");
const { getUserInfo } = require("../controllers/userInfo/userinfo");
const{ getPrivacySettings,
  updatePrivacySettings}=require("../controllers/userInfo/privacysetting");

// User authentication routes
router.post("/userinfo", authenticateToken, getUserInfo);
//userForms Routes
router.post("/signup", signupvalidation, signup);
router.post("/login", loginvalidation, login); 
router.post("/logout", logout);

//userPrifile/useredit routes
router.post(
  "/change-password",
  authenticateToken,
  changePasswordValidation,
  changePassword
);
router.post("/send-otp", sendOtp); 
router.post("/validate-otp", validateOtp);
router.post("/reset-password", resetPasswordValidation, resetPassword);

//userPrifile/manageprofile routes
router.post(
  "/update-profile",
  authenticateToken,
  editprofilevalidation,
  updateProfile
);
router.post("/validateprofileotp", authenticateToken, validateProfileOtp);
router.post("/block-user", authenticateToken, blockUser);
router.post("/unblock-user", authenticateToken, unblockUser);
router.delete("/delete-account", authenticateToken, deleteAccount);

//userINfo/usercontacts routes
router.post("/add-contact", authenticateToken, addContact);
// router.post("", authenticateToken, searchContact);
router.post("/search-contact", authenticateToken, fetchContacts);

//userInfo/privacysetting routes
router.get(
  "/privacy-settings",
  authenticateToken,
  getPrivacySettings
);
router.put(
  "/privacy-settings",
   authenticateToken,
  updatePrivacySettings
);






module.exports = router; // Simple export, no io needed here
