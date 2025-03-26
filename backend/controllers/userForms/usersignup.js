
const { validationResult } = require("express-validator");
const UserSchema = require("../../models/user");
const { hash } = require("bcryptjs");
const {uploadToCloudinary}=require("../../utils/cloudinary");

const signup = async(req,res)=>{
    try {
      const errorobject = {};

      // Handle validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach((object) => {
          errorobject[object.path] = object.msg;
        });
        return res.status(400).json({ error: errorobject });
      }

      // Extract data from the request body
      const { Name, Email, Mobile, Password, Photo } = req.body;
      console.log("Request Body:", { Name, Email, Mobile, Password });

      if (!Name || !Email || !Mobile || !Password) {
        return res.status(400).json({ message: "Field cannot be empty" });
      }

      // Check if user already exists
      const userexist = await UserSchema.findOne({
        $or: [{ Mobile: Mobile }, { Email: Email }],
      });

      if (userexist) {
        return res.status(400).json({ message: "The User already exists" });
      }

      // Hash the password
      const hashpassword = await hash(Password, 10);

      let uploadedPhotoUrl = "";

      if (Photo) {
        uploadedPhotoUrl = await uploadToCloudinary(Photo, {
          folder: "user_photos",
        });
      }

      // Create a new user
      const newUser = await UserSchema.create({
        Email,
        Name,
        Mobile,
        Password: hashpassword,
        Photo: uploadedPhotoUrl,
      });

      console.log("User created successfully:", newUser);
      return res.status(200).json({
        message: "User is registered successfully",
      });
    } catch (error) {
      console.error("Unexpected error in signup route:", error);
      return res.status(500).json({
        message: "An unexpected error occurred",
        error: error.message,
      });
    }
}

module.exports={signup};

