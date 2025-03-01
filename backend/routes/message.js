const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware");
const { conversationvalidation } = require("../Validatedata");
const {
  fetchChatlist,
  fetchMessage,
  chattingRoom,
  message,
} = require("../controllers/message");

router.post("/search-chatlist", authenticateToken, fetchChatlist);
router.post("/fetch-messages", conversationvalidation, fetchMessage);
router.post("/chat-list", chattingRoom);

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
