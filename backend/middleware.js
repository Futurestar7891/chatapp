// middleware/authMiddleware.js
const jsonwebtoken = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const dotenv = require("dotenv");
dotenv.config();

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};



// Create a transporter object using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.PASSWORD,
  },
});

// Function to send OTP via email
const sendEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: "Your OTP for Password Reset",
    text: `Your OTP is: ${otp}`,
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP via email.");
  }
};

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to send OTP via SMS
const sendSms = async (to, otp) => {
  try {
    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log(`OTP sent to mobile: ${to}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send OTP via SMS.");
  }
};


module.exports = { authenticateToken, sendEmail, sendSms };


