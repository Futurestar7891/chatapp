import Chat from "../Models/Chat.js";
import Contact from "../Models/Contact.js";

export const buildChatList = async (userId) => {
  // Fetch MY saved contacts
  const myContacts = await Contact.find({ userId }).lean();
  const savedNameMap = {};
  const isContactMap = {};

  myContacts.forEach((c) => {
    savedNameMap[c.contactId.toString()] = c.savedName;
    isContactMap[c.contactId.toString()] = true;
  });

  // Fetch users who saved ME
  const usersWhoSavedMe = await Contact.find({ contactId: userId }).lean();
  const hasSavedMeMap = {};

  usersWhoSavedMe.forEach((c) => {
    hasSavedMeMap[c.userId.toString()] = true;
  });

  // Fetch chats
  const chats = await Chat.find({ participants: userId })
    .populate("participants", "name email avatar mobile bio statusVisibility")
    .populate("lastMessage.messageId")
    .sort({ updatedAt: -1 })
    .lean();

  const formattedChats = chats.map((chat) => {
    const otherUser = chat.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    const otherId = otherUser._id.toString();
    const displayName = savedNameMap[otherId] || otherUser.name;

    const cleanUser = {
      _id: otherId,
      name: displayName,
      email: otherUser.email,
      mobile: otherUser.mobile,
      avatar: otherUser.avatar,
      bio: otherUser.bio,
      isContact: Boolean(isContactMap[otherId]),
      hasSavedMe: Boolean(hasSavedMeMap[otherId]),
      statusVisibility: otherUser.statusVisibility,
    };

    const lastMessageEntry = chat.lastMessage?.find(
      (lm) => lm.userId.toString() === userId
    );

    return {
      chatId: chat._id,
      user: cleanUser,
      lastMessage: lastMessageEntry?.messageId || null,
      unreadCount: chat.unreadCount?.[userId] || 0,
      updatedAt: chat.updatedAt,
    };
  });

  return formattedChats;
};
