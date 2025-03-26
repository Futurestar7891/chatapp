const { validationResult } = require("express-validator");
const UserSchema = require("../../models/user");
const { compare } = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    const { Email, Mobile, Password } = req.body;
    // console.log(req.body);
    const errorobject = {}; // Define errorobject here

    if (!errors.isEmpty()) {
      errors.array().forEach((object) => {
        errorobject[object.path] = object.msg;
      });
      return res.status(400).json({
        error: errorobject,
      });
    }

    const userexist = await UserSchema.findOne({
      $or: [{ Mobile: Mobile }, { Email: Email }],
    });

    if (userexist) {
      const passwordmatched = await compare(Password, userexist.Password);
      if (passwordmatched) {
        const token = jsonwebtoken.sign(
          { id: userexist._id, Mobile: userexist.Mobile },
          process.env.SECRET_KEY,
          { expiresIn: "1d" }
        );
        return res.status(200).json({
          message: "The user logged in successfully",
          Token: token,
          id: userexist._id,
          Mobile: userexist.Mobile,
          Photo: userexist.Photo,
          Bio: userexist.Bio,
          Name: userexist.Name,
          Email: userexist.Email,
          blockedusers: userexist.BlockedUsers,
        });
      } else {
        errorobject.Password = "The wrong password was entered";
        return res.status(400).json({
          error: errorobject,
        });
      }
    } else {
      if (Mobile) {
        errorobject.Mobile = "This user doesn't exist";
      } else {
        errorobject.Email = "The user doesn't exist";
      }
      return res.status(400).json({
        error: errorobject,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "An error occurred during login",
    });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success:true,
     message: "Logged out successfully" });
};

module.exports = { login, logout };
