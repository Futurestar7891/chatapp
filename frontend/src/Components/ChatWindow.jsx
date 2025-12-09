import React, { useContext, useEffect, useState, useMemo } from "react";
import { ChatContext } from "../Context/ChatContext";
import { AuthContext } from "../Context/AuthContext";
import Styles from "../Modules/ChatWindow.module.css";
import { composeMessage } from "../utils/message";
import { getChatList } from "../utils/chat";
import ChatWindowHeaderCard from "../Cards/ChatWindowHeaderCard";
import ChatWindowMessageCard from "../Cards/ChatWindowMessageCard";
import ChatWindowInputCard from "../Cards/ChatWindowInputCard";

function ChatWindow() {
  const { user } = useContext(AuthContext);
  const {
    socket,
    receiverId,
    receiverData,
    onlineUsers,
    setReceiverId,
    setReceiverData,
    messages,
    setMessages,
    setChatList
  } = useContext(ChatContext);
  
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);


  // --------------------------------------------------------
  // ⭐ FILTER MESSAGES → Only show messages with active user
  // --------------------------------------------------------
const chatMessages = useMemo(() => {
  if (!receiverId || !user?._id) return [];
return messages.filter(
  (m) =>
    (m.sender === receiverId && m.receiver === user._id) ||
    (m.sender === user._id && m.receiver === receiverId)
);

}, [messages, receiverId, user._id]);



  // --------------------------------------------------------
  // ⭐ AUTO SEEN — whenever we view chat
useEffect(() => {
  if (!socket || !receiverId) return;

  chatMessages.forEach(async (msg) => {
    if (msg.sender !== user._id && !msg.seenAt) {
      socket.emit("message-seen", msg._id);

      // ⭐ INSTANT UI UPDATE — no flicker
      setChatList((prev) =>
        prev.map((chat) =>
          chat.user._id === receiverId ? { ...chat, unreadCount: 0 } : chat
        )
      );

      // 🔄 Background refresh (optional)
      const updated = await getChatList();
      setChatList(updated);
    }
  });
}, [chatMessages, receiverId]);


  // --------------------------------------------------------
  // ⭐ If no chat opened
  // --------------------------------------------------------
  if (!receiverId || !receiverData) {
    return (
      <div className={Styles.EmptyChatWindowContainer}>
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  // Check if receiver is online
  const isOnline = onlineUsers.includes(receiverId);

  return (
    <div className={Styles.ChatWindowContainer}>
      {/* HEADER */}
      <ChatWindowHeaderCard
        name={receiverData.name}
        avatar={receiverData.avatar}
        online={isOnline}
        onBack={() => {
          setReceiverId(null);
          setReceiverData(null);
        }}
      />

      {/* MESSAGES */}
      <div className={Styles.ChatWindowMessageCardContainer}>
        {chatMessages.length ? (
          chatMessages.map((msg) => (
            <ChatWindowMessageCard key={msg._id} data={msg} userId={user._id} />
          ))
        ) : (
          <p className={Styles.EmptyText}>Start a conversation</p>
        )}
      </div>

      {/* INPUT BAR */}
      <ChatWindowInputCard
        value={input}
        onChange={setInput}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onSendMessage={() => {
          composeMessage({
            receiverId,
            userId: user._id,
            text: input,
            attachments: selectedFiles,
            setMessages,
          });

          setInput("");
          setSelectedFiles([]); 
        }}
      />
    </div>
  );
}

export default ChatWindow;
