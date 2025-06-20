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

// Define all routes
router.post("/search-chatlist", authenticateToken, fetchChatlist);
router.post("/fetch-messages", conversationvalidation, fetchMessage);
router.post("/chat-list", chattingRoom);

// Routes that require Socket.IO
module.exports = (io) => {
  // Attach io to req for routes that need it
  router.post(
    "/send-receive",
    // authenticateToken, // Uncomment if token is required
    conversationvalidation,
    (req, res, next) => {
      req.io = io;
      next();
    },
    message
  );

  router.post(
    "/delete-for-me",
    authenticateToken,
    (req, res, next) => {
      req.io = io;
      next();
    },
    DeleteForMe
  );

  router.post(
    "/delete-for-everyone",
    authenticateToken,
    (req, res, next) => {
      req.io = io;
      next();
    },
    DeleteForEveryone
  );

  return router;
};
