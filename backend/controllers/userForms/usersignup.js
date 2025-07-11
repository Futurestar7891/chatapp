const { validationResult } = require("express-validator");
const UserSchema = require("../../models/user");
const { hash } = require("bcryptjs");
const { uploadToCloudinary } = require("../../utils/cloudinary");

const signup = async (req, res) => {
  try {
    // Extract data from the request body
    const { Name, Email, Mobile, Password, Photo } = req.body;
    const errorobject = {};

    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((object) => {
        errorobject[object.path] = object.msg;
      });
      console.log(errorobject);
      return res.status(400).json({
        success: false,
        error: errorobject,
      });
    }

    // Check if user already exists
    const existingUser = await UserSchema.findOne({
      $or: [{ Mobile }, { Email }],
    });

    if (existingUser) {
      if (existingUser.Email === Email) {
        errorobject.Email = "Email already in use";
      }
      if (existingUser.Mobile === Mobile) {
        errorobject.Mobile = "Mobile number already in use";
      }
      return res.status(409).json({
        success: false,
        error: errorobject,
      });
    }

    // Hash the password
    const hashpassword = await hash(Password, 10);

    let uploadedPhotoUrl = "";
    if (Photo) {
      try {
        uploadedPhotoUrl = await uploadToCloudinary(Photo, {
          folder: "user_photos",
        });
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        errorobject.Photo = "Failed to upload profile photo";
        return res.status(400).json({
          success: false,
          error: errorobject,
        });
      }
    }

    // Create a new user
    const newUser = await UserSchema.create({
      Email,
      Name,
      Mobile,
      Password: hashpassword,
      Photo: uploadedPhotoUrl,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.Name,
        email: newUser.Email,
        photo: newUser.Photo,
      },
    });
  } catch (error) {
    console.error("Unexpected error in signup route:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

module.exports = { signup };
