import express from "express";
import { isAuthenticate } from "../Middleware/isAuthenticate.js";
import { getChatList, getContactList } from "../Controllers/chatControllers.js";

const router=express.Router();

router.get("/get-chat-list",isAuthenticate,getChatList);
router.get("/get-contact-list",isAuthenticate,getContactList);


export default router;