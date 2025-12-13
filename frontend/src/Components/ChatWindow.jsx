import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";

import { ChatContext } from "../Context/ChatContext";
import { AuthContext } from "../Context/AuthContext";
import Styles from "../Modules/ChatWindow.module.css";
import { composeMessage } from "../utils/message";
import ChatWindowHeaderCard from "../Cards/ChatWindowHeaderCard";
import ChatWindowMessageCard from "../Cards/ChatWindowMessageCard";
import ChatWindowInputCard from "../Cards/ChatWindowInputCard";

function ChatWindow() {
  const { user } = useContext(AuthContext);
  const { replyToMessage, setReplyToMessage } = useContext(ChatContext);

  const {
    socket,
    receiverId,
    receiverData,
    onlineUsers,
    setReceiverId,
    setReceiverData,
    messages,
    setMessages,
    setChatList,
  } = useContext(ChatContext);

  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const containerRef = React.useRef(null);
  const messageEndRef = React.useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);


   const handleInputChange = useCallback((text) => {
     setInput(text);
   }, []);

   const handleSendMessage = useCallback(() => {
     if (!input.trim() && selectedFiles.length === 0) return;

     composeMessage({
       setChatList,
       receiverId,
       user,
       text: input,
       attachments: selectedFiles,
       setMessages,
       replyToMessage,
     });

     setInput("");
     setSelectedFiles([]);
     setReplyToMessage(null);
   }, [
     input,
     selectedFiles,
     receiverId,
     user,
     replyToMessage,
     setChatList,
     setMessages,
     setReplyToMessage, // ✅ ADD THIS
   ]);

  // -----------------------------
  // ⭐ FILTER MESSAGES FOR THIS CHAT
  // -----------------------------
 const chatMessages = useMemo(() => {
   if (!receiverId || !user?._id) return [];
   return messages.filter(
     (m) =>
       (m.sender._id === receiverId && m.receiver === user._id) ||
       (m.sender._id === user._id && m.receiver === receiverId)
   );
 }, [messages, receiverId, user]);


  console.log(chatMessages);
  // -----------------------------
  // ⭐ SCROLL HELPERS
  // -----------------------------
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const isUserNearBottom = () => {
    const container = containerRef.current;
    if (!container) return true;

    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distance < 120; // threshold
  };

  // -----------------------------
  // ⭐ AUTO SCROLL ONLY WHEN AT BOTTOM
  // -----------------------------
  useEffect(() => {
    if (isUserNearBottom()) {
      scrollToBottom();
    }
  }, [chatMessages]);

  // -----------------------------
  // ⭐ WHEN OPENING CHAT → ALWAYS SCROLL DOWN
  // -----------------------------
  useEffect(() => {
    scrollToBottom();
  }, [receiverId]);

  // -----------------------------
  // ⭐ SHOW / HIDE DOWN ARROW
  // -----------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom = isUserNearBottom();
      setShowScrollDown(!atBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  //listen for delivered or seen message
  useEffect(() => {
    if (!socket) return;

    const deliveredListener = (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, deliveredAt: msg.deliveredAt } : m
        )
      );
    };

    const seenListener = (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, seenAt: msg.seenAt } : m))
      );
    };

    socket.on("message-delivered-update", deliveredListener);
    socket.on("message-seen-update", seenListener);

    return () => {
      socket.off("message-delivered-update", deliveredListener);
      socket.off("message-seen-update", seenListener);
    };
  }, [socket]);

  // -----------------------------
  // ⭐ AUTO SEEN MESSAGES
  // -----------------------------

  useEffect(() => {
    if (!socket || !receiverId || !user?._id) return;

    chatMessages.forEach((msg) => {
      // receiver is current user
      if (msg.sender._id !== user._id && !msg.seenAt) {
        socket.emit("message-seen", msg._id);
      }
    });
  }, [chatMessages, receiverId, socket, user?._id]);

  // -----------------------------
  // ⭐ NO CHAT SELECTED
  // -----------------------------
  if (!receiverId || !receiverData) {
    return (
      <div className={Styles.EmptyChatWindowContainer}>
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

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
      <div ref={containerRef} className={Styles.ChatWindowMessageCardContainer}>
        {chatMessages.length ? (
          chatMessages.map((msg) => (
            <ChatWindowMessageCard key={msg._id} data={msg} userId={user._id} />
          ))
        ) : (
          <p className={Styles.EmptyText}>Start a conversation</p>
        )}

        {/* Invisible element → scrolls to bottom */}
        <div ref={messageEndRef} />
      </div>

      {/* SCROLL DOWN BUTTON */}
      {showScrollDown && (
        <button className={Styles.ScrollDownBtn} onClick={scrollToBottom}>
          ↓
        </button>
      )}

      {/* INPUT BAR */}
      <ChatWindowInputCard
        value={input}
        onChange={handleInputChange}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default React.memo(ChatWindow);
