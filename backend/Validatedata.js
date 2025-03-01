const { body } = require("express-validator");

exports.signupvalidation = [
  body("Name").notEmpty().withMessage("Name is required"),

  body("Email")
    .notEmpty()
    .withMessage("The Email is required")
    .isEmail()
    .withMessage("Email is invalid"),

  body("Mobile")
    .notEmpty()
    .withMessage("The Mobile Number is required")
    .isLength({ min: 10 })
    .withMessage("Mobile number should be at least 10 digits"),

  body("Password")
    .notEmpty()
    .withMessage("The password is required")
    .isLength({ min: 5 }) // Optional: you can specify a minimum length for the password
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/) // Check for at least one uppercase letter
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/) // Check for at least one lowercase letter
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/) // Check for at least one number
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/) // Check for at least one special character
    .withMessage("Password must contain at least one special character"),
];

exports.loginvalidation = [
  // Custom validation for missing Email or Mobile
  body().custom((value, { req }) => {
    // If both Email and Mobile are empty, trigger custom error
    if (!req.body.Email && !req.body.Mobile) {
      throw new Error("Please enter either an email or mobile number");
    }
    // Otherwise, continue with the validation
    else {
      return true;
    }
  }),

  // Email validation (optional)
  body("Email")
    .optional({ checkFalsy: true }) // Email is optional, will only validate if present and not falsy
    .isEmail()
    .withMessage("Email is invalid"),

  // Mobile validation (optional)
  body("Mobile")
    .optional({ checkFalsy: true }) // Mobile is optional, will only validate if present and not falsy
    .isLength({ min: 10 })
    .withMessage("Mobile number should be at least 10 digits"),

  // Password validation
  body("Password")
    .notEmpty()
    .withMessage("Please Enter password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
];

exports.changePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Old Password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];

exports.resetPasswordValidation = [
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];

exports.conversationvalidation = [
  body("senderid").notEmpty().withMessage("sender id not valid"),
  body("receiverid").notEmpty().withMessage("receiver id not valid"),
];

exports.addcontactvalidation = [
  body().custom((value, { req }) => {
    // If both Email and Mobile are empty, trigger custom error
    if (!req.body.contactemail && !req.body.contactmobile) {
      throw new Error("Please enter either an email or mobile number");
    }
    // Otherwise, continue with the validation
    else {
      return true;
    }
  }),
  body("contactmobile")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Contact number is not valid"),

  body("contactname").notEmpty().withMessage("Please enter name"),

  body("contactemail").optional().isEmail().withMessage("Email is invalid"),

  // Custom validation to ensure at least one of contactnumber or email is provided
];

exports.addsearchvalidation = [
  body("keyword").notEmpty().withMessage("Keyword cant be empty"),
  body("Username")
    .isLength({ min: 10 })
    .withMessage("Mobile number should be at least 10 digits"),
];

exports.editprofilevalidation = [
  body("Name").optional(),

  body("Email")
    .optional({ checkFalsy: true }) // Email is optional, will only validate if present and not falsy
    .isEmail()
    .withMessage("Email is invalid"),

  // Mobile validation (optional)
  body("Mobile")
    .optional({ checkFalsy: true }) // Mobile is optional, will only validate if present and not falsy
    .isLength({ min: 10 })
    .withMessage("Mobile number should be at least 10 digits"),
];
