import express from "express"
import { isAuthenticate } from "../Middleware/isAuthenticate.js";
import { addContact, blockAction, changePassword, forgotPassword, logout, resetPassword, sendEmailUpdateOtp, signIn, signUp,updateAvatar,updateProfileInfo,verifyEmailUpdateOtp,verifyForgotOtp,verifySignUpOtp} from "../Controllers/userControllers.js";

const router=express.Router();

router.post("/signup",signUp);
router.post("/verify-signup-otp", verifySignUpOtp);
router.post("/signin",signIn);
router.post("/forgot-password",forgotPassword);
router.post("/verify-forgot-otp",verifyForgotOtp);
router.post("/reset-password",resetPassword);
router.post("/send-email-update-otp",isAuthenticate,sendEmailUpdateOtp)
router.post("/verify-email-update-otp",isAuthenticate,verifyEmailUpdateOtp)
router.post("/update-profile-info",isAuthenticate,updateProfileInfo);
router.post("/update-avatar",isAuthenticate,updateAvatar);
router.post("/change-password",isAuthenticate,changePassword);
router.post("/logout",isAuthenticate,logout);
router.post("/block-action",isAuthenticate,blockAction);
router.post("/add-contact",isAuthenticate,addContact);


export default router;