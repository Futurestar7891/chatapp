// index.js
const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const { connectDB, setupSocketIO } = require("./connection");
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "500mb" }));

// Setup Socket.IO
const io = setupSocketIO(server);

// Import Routes
const userRoutes = require("./routes/user");
const messageRoutes = require("./routes/message")(io);

// Use Routes
app.use("/api", userRoutes);
app.use("/api", messageRoutes);

// Start server after DB connection
connectDB()
  .then(() => {
    server.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.error(`❌ Database connection failed: ${error}`);
    process.exit(1); // Exit process if DB connection fails
  });

// Export io for potential use in other modules (optional)
module.exports = { io };
