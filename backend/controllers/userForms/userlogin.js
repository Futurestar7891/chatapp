const { validationResult } = require("express-validator");
const UserSchema = require("../../models/user");
const { compare } = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    const { Email, Mobile, Password } = req.body;
    const errorobject = {};

    if (!errors.isEmpty()) {
      errors.array().forEach((object) => {
        errorobject[object.path] = object.msg;
      });
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    const user = await UserSchema.findOne({
      $or: [{ Mobile: Mobile }, { Email: Email }],
    });

    if (!user) {
      if (Mobile) {
        errorobject.Mobile = "User with this mobile number doesn't exist";
      } else {
        errorobject.Email = "User with this email doesn't exist";
      }
      return res.status(404).json({
        success: false,
        error: errorobject,
      });
    }

    const passwordmatched = await compare(Password, user.Password);
    if (!passwordmatched) {
      errorobject.Password = "Incorrect password";
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    const token = jwt.sign(
      { id: user._id, Mobile: user.Mobile },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      Token: token,
      id: user._id,
      Mobile: user.Mobile,
      Photo: user.Photo,
      Bio: user.Bio,
      Name: user.Name,
      Email: user.Email,
      blockedusers: user.BlockedUsers,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error: { general: "Internal server error" },
    });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};


module.exports = { login, logout };
