import Chat from "../Models/Chat.js";
import Contact from "../Models/Contact.js";
import User from "../Models/User.js";
import { buildChatList } from "../utils/chatListBuilder.js";

export const getChatList = async (req, res) => {
  try {
    const userId = req.user.id;

    // ⭐ Use the shared function
    const formattedChats = await buildChatList(userId);

    return res.status(200).json({
      success: true,
      chats: formattedChats,
    });
  } catch (error) {
    console.error("Chat list error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};





export const getContactList = async (req, res) => {
  try {
    const userId = req.user.id;
    const keyword = (req.query.keyword || "").toLowerCase();

    // 1️⃣ Fetch saved contacts
    const contacts = await Contact.find({ userId })
      .populate(
        "contactId",
        "_id name mobile email avatar bio statusVisibility"
      )
      .lean();

    let savedUsers = contacts.map((c) => ({
      savedName: c.savedName,
      user: c.contactId,
    }));

    // 2️⃣ Search filtering
    if (keyword.trim()) {
      savedUsers = savedUsers.filter((c) => {
        return (
          c.savedName.toLowerCase().includes(keyword) ||
          c.user.mobile.includes(keyword) ||
          c.user.email?.toLowerCase().includes(keyword)
        );
      });
    }

    // 3️⃣ If saved contacts found → return
    if (savedUsers.length > 0) {
      const formatted = await Promise.all(
        savedUsers.map(async (c) => {
          const heHasSavedMe = await Contact.exists({
            userId: c.user._id.toString(),
            contactId: userId,
          });

          return {
            user: {
              _id: c.user._id.toString(),
              name: c.savedName,
              mobile: c.user.mobile,
              email: c.user.email,
              avatar: c.user.avatar,
              bio: c.user.bio,

              // ⭐ Privacy fields
              heHasSavedMe,
              statusVisibility: c.user.statusVisibility,
            },

            lastMessage: null,
            unreadCount: 0,
            updatedAt: null,
          };
        })
      );

      return res.json({
        success: true,
        contacts: formatted,
        source: "saved",
      });
    }

    // 4️⃣ Search globally
    const searchedUsers = await User.find({
      _id: { $ne: userId },
      $or: [
        { mobile: keyword },
        { email: { $regex: `^${keyword}$`, $options: "i" } },
      ],
    }).select("_id name mobile email avatar bio statusVisibility");

    const formattedGlobal = await Promise.all(
      searchedUsers.map(async (u) => {
        const heHasSavedMe = await Contact.exists({
          userId: u._id.toString(),
          contactId: userId,
        });

        return {
          user: {
            _id: u._id.toString(),
            name: u.name,
            mobile: u.mobile,
            email: u.email,
            avatar: u.avatar,
            bio: u.bio,

            heHasSavedMe,
            statusVisibility: u.statusVisibility,
          },
          lastMessage: null,
          unreadCount: 0,
          updatedAt: null,
        };
      })
    );

    return res.json({
      success: true,
      contacts: formattedGlobal,
      source: "global",
    });
  } catch (error) {
    console.error("Get Contact List Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




