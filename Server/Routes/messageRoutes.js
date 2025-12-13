import express from "express"
import { isAuthenticate } from "../Middleware/isAuthenticate.js";
import { deleteForEveryone, deleteForMe, getMessages, sendMessage } from "../Controllers/messageContrller.js";

const router=express.Router();


router.get("/:id",isAuthenticate,getMessages);
router.post("/send",isAuthenticate,sendMessage);
router.delete("/deleteForMe/:id",isAuthenticate,deleteForMe);
router.delete("/deleteForEveryone/:id",isAuthenticate,deleteForEveryone);

export default router