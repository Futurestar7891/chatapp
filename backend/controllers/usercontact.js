const { validationResult } = require("express-validator");
const UserSchema = require("../models/user");

const addContact = async (req, res) => {
  const errors = validationResult(req);
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

  const { contactemail, contactname, contactmobile } = req.body;

  try {
    const currentUserId = req.user.id;
    const currentUser = await UserSchema.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    const contactUser = await UserSchema.findOne({
      $or: [{ Email: contactemail }, { Mobile: contactmobile }],
    });

    if (!contactUser) {
      return res.status(400).json({
        success: false,
        message: "User is not registered on the chat app",
      });
    }

    if (contactUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself as a contact",
      });
    }

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

    const newContact = {
      userId: contactUser._id,
      contactemail: contactemail || contactUser.Email,
      contactmobile: contactmobile || contactUser.Mobile,
      contactname: contactname,
    };

    currentUser.Contacts.push(newContact);
    await currentUser.save();

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
      status: contact.userId.status, // Add status field
    }));

    return res.status(200).json({
      success: true,
      contacts: contactUsers,
    });
  } catch (error) {
    console.error("Error in /filter-contact:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const searchContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "Receiver ID is required" });
    }

    const currentUser = await UserSchema.findById(userId).populate(
      "Contacts.userId"
    );

    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isAlreadyAdded = currentUser.Contacts.some(
      (contact) => contact.userId?._id.toString() === receiverId
    );

    res.status(200).json({ success: true, isInContactList: isAlreadyAdded });
  } catch (error) {
    console.error("Error checking contact list:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { addContact, fetchContacts, searchContact };
