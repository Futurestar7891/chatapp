import { connectDB } from "./Connections/Db.js";
import { connectSocket } from "./Connections/Socket.js";
import authRouter from "./Routes/authRoutes.js";
import userRouter from "./Routes/userRoutes.js";
import chatRouter from "./Routes/chatRoutes.js";
import messageRouter from "./Routes/messageRoutes.js";

import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// 🚀 OPTIMIZATION 1: Add compression (reduces response size by 70%)
import compression from "compression";

dotenv.config({});
const app = express();
app.set("trust proxy", 1);


app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// 🚀 OPTIMIZATION 2: Enable compression for all routes
app.use(compression());

app.use(express.json());
app.use(cookieParser());

// Create HTTP server
const server = http.createServer(app);

// 🔥 PASS app INTO connectSocket so app.set("io") works
connectSocket(server, app);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

// Start server
connectDB().then(() => {
  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});
