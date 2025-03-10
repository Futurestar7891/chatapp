const { validationResult } = require("express-validator");
const UserSchema = require("../models/user");

const addContact = async (req, res) => {
  const errors = validationResult(req);
  //  console.log("in add contact");
  if (!errors.isEmpty()) {
    const errorobj = {};
    errors.array().forEach((obj) => {
      errorobj[obj.path] = obj.msg;
    });

    return res.status(400).json({
      success: false,
      error: errorobj,
    });
  }

  // Destructure the fields from the request body
  const { contactemail, contactname, contactmobile } = req.body;

  try {
    // Get the current user's ID from the token (middleware)
    const currentUserId = req.user.id;
    //  console.log(req.body);
    // Find the current user
    const currentUser = await UserSchema.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    // Find the user being added as a contact
    const contactUser = await UserSchema.findOne({
      $or: [{ Email: contactemail }, { Mobile: contactmobile }],
    });

    if (!contactUser) {
      return res.status(400).json({
        success: false,
        message: "User is not registered on the chat app",
      });
    }

    // Prevent adding oneself as a contact
    if (contactUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a contact",
      });
    }

    // Check if the contact already exists
    const isAlreadyAdded = currentUser.Contacts.some(
      (contact) =>
        contact.userId.toString() === contactUser._id.toString() ||
        contact.contactmobile === contactmobile
    );

    if (isAlreadyAdded) {
      return res.status(400).json({
        success: false,
        message: "Contact already exists in your contact list",
      });
    }

    // Create the new contact object
    const newContact = {
      userId: contactUser._id, // Add the userId for the contact
      contactemail: contactemail || contactUser.Email,
      contactmobile: contactmobile || contactUser.Mobile,
      contactname: contactname,
    };

    // Push the new contact into the user's Contacts array
    currentUser.Contacts.push(newContact);

    // Save the updated user document
    await currentUser.save();

    // Send a success response
    return res.status(200).json({
      success: true,
      message: "Contact added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding the contact",
    });
  }
};




const fetchContacts = async (req, res) => {
  const userId = req.user.id; // Extract user ID from the token
  const { keyword } = req.body;

  try {
    const userexist = await UserSchema.findById(userId).populate(
      "Contacts.userId"
    );

    if (!userexist) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const contactUsers = userexist.Contacts.filter((contact) =>
      contact.contactname.toLowerCase().includes(keyword.toLowerCase())
    ).map((contact) => ({
      _id: contact.userId._id,
      Name: contact.contactname,
      Photo: contact.userId.Photo,
      Bio: contact.userId.Bio,
      Email: contact.userId.Email,
      Mobile: contact.userId.Mobile,
    }));

    return res.status(200).json({
      success: true,
      contacts: contactUsers,
    });
  } catch (error) {
    console.error("Error in /search-contact:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const searchContact = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from the authenticated token
    const { receiverId } = req.body; // Extract receiverId from the request body

    console.log("Entered in searchContact");
    console.log("Receiver ID:", receiverId);
    console.log("Current User ID:", userId);

    if (!receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "Receiver ID is required" });
    }

    // Find the current user and populate the Contacts.userId field
    const currentUser = await UserSchema.findById(userId).populate(
      "Contacts.userId"
    );

    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // console.log("Current User Contacts:", currentUser.Contacts);

    // Check if the receiver is in the contact list
    const isAlreadyAdded = currentUser.Contacts.some((contact) => {
      console.log("Contact User ID:", contact.userId?._id.toString());
      console.log("Receiver ID:", receiverId);
      return contact.userId?._id.toString() === receiverId;
    });

    // console.log("Is Already Added:", isAlreadyAdded);

    res.status(200).json({ success: true, isInContactList: isAlreadyAdded });
  } catch (error) {
    console.error("Error checking contact list:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports={addContact,fetchContacts,searchContact};
