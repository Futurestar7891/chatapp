import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({});
// 🚀 OPTIMIZATION 1: Cache the JWT_SECRET (minor but helpful)
const JWT_SECRET = process.env.JWT_SECRET;

export const isAuthenticate = (req, res, next) => {
  try {
    // 🚀 OPTIMIZATION 2: Check token in multiple places (common practice)
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 🚀 OPTIMIZATION 3: Add jwt.verify options for better performance
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"], // Specify algorithm (faster)
      maxAge: "7d", // Match your token expiry
    });

    req.user = decoded;
    next();
  } catch (error) {
    // 🚀 OPTIMIZATION 4: Better error messages for debugging
    let errorMessage = "Invalid token";

    if (error.name === "TokenExpiredError") {
      errorMessage = "Token expired";
    } else if (error.name === "JsonWebTokenError") {
      errorMessage = "Malformed token";
    }

    return res.status(401).json({ message: errorMessage });
  }
};
