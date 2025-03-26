const User = require("../../models/user"); // Assuming you have a User model

// Fetch Privacy Settings
const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("privacySettings BlockedUsers Contacts") // Use 'Contacts' as per schema
      .populate({
        path: "BlockedUsers.userId", // Populate blocked users' details
        select: "Name Photo Mobile",
      })
      .populate({
        path: "Contacts.userId", // Populate userId within each contact
        select: "Name Photo Mobile", // Fields to include from referenced User
      });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Format contacts to include both referenced user data and subdocument data
    const formattedContacts = user.Contacts.map((contact) => ({
      userId: contact.userId._id, // The ID of the referenced user
      name: contact.userId.Name, // From populated User
      photo: contact.userId.Photo, // From populated User
      mobile: contact.userId.Mobile, // From populated User
      contactName: contact.contactname, // From subdocument
      contactMobile: contact.contactmobile, // From subdocument
      contactEmail: contact.contactemail, // From subdocument
    }));

    res.status(200).json({
      success: true,
      userId: userId, // Add the user's own ID
      settings: user.privacySettings,
      blockedUsers: user.BlockedUsers,
      contacts: formattedContacts, // Return formatted contacts
    });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Update Privacy Settings
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileVisibility, lastSeenVisibility, bioVisibility } = req.body;

    // Validate input
    if (!profileVisibility || !lastSeenVisibility || !bioVisibility) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    // Validate enum values
    const validOptions = ["public", "contacts", "private"];
    if (
      !validOptions.includes(profileVisibility) ||
      !validOptions.includes(lastSeenVisibility) ||
      !validOptions.includes(bioVisibility)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid visibility option." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        privacySettings: {
          profileVisibility,
          lastSeenVisibility,
          bioVisibility,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Privacy settings updated.",
      settings: updatedUser.privacySettings,
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  getPrivacySettings,
  updatePrivacySettings,
};
