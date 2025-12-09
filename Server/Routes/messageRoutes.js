import express from "express"
import { isAuthenticate } from "../Middleware/isAuthenticate.js";
import { getMessages, sendMessage } from "../Controllers/messageContrller.js";

const router=express.Router();


router.get("/:id",isAuthenticate,getMessages);
router.post("/send",isAuthenticate,sendMessage)

export default router