import express from "express";
import { isAuthenticate } from "../Middleware/isAuthenticate.js";
import { getChatList, getContactList, markChatSeen } from "../Controllers/chatControllers.js";

const router=express.Router();

router.get("/get-chat-list",isAuthenticate,getChatList);
router.get("/get-contact-list",isAuthenticate,getContactList);
router.post("/seen/:id",isAuthenticate,markChatSeen);

export default router;