const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware");
const { conversationvalidation } = require("../Validatedata");
const {
  fetchChatlist,
  fetchMessage,
  chattingRoom,
  message,
  DeleteForMe,
  DeleteForEveryone,
} = require("../controllers/userMessaging/message");

router.post("/search-chatlist", authenticateToken, fetchChatlist);
router.post("/fetch-messages", conversationvalidation, fetchMessage);
router.post("/chat-list", chattingRoom);
router.post("/delete-for-me",authenticateToken,DeleteForMe);
router.post("/delete-for-everyone",authenticateToken,DeleteForEveryone);

module.exports = (io) => {
  router.post(
    "/send-receive",
    // authenticateToken, // Comment out or remove if token isn't sent by frontend
    conversationvalidation,
    (req, res, next) => {
      req.io = io; // Attach io to req
      next();
    },
    message
  );
  return router;
};
