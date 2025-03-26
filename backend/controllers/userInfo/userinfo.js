// controllers/userinfo.js
const UserSchema = require("../../models/user");

const getUserInfo = async (req, res) => {
  try {
    const senderId = req.user.id; // Alice (qwer12)
    const { receiverId } = req.body; // Bob (qwer22)

    const sender = await UserSchema.findById(senderId);
    const receiver = await UserSchema.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "Sender or receiver does not exist",
      });
    }

    const isBlockedBySender = sender.BlockedUsers.some((entry) =>
      entry.userId.equals(receiverId)
    );

    const contactEntry = sender.Contacts.find(
      (contact) => contact.contactmobile === receiver.Mobile
    );
    const displayName = contactEntry ? contactEntry.contactname : receiver.Name;

    res.status(200).json({
      success: true,
      data: {
        Name: displayName,
        Email: receiver.Email,
        Mobile: receiver.Mobile,
        Bio: receiver.Bio,
        Photo: receiver.Photo,
        status: receiver.status, // Should be Bob’s status
        lastSeen: receiver.lastSeen,
        isBlocked: isBlockedBySender,
      },
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getUserInfo };
