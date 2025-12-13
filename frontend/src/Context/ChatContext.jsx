// /* eslint-disable react-hooks/set-state-in-effect */
// /* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext,startTransition } from "react";
import { connectSocket, disconnectSocket } from "../utils/socket";
import { AuthContext } from "./AuthContext";
import { getChatList, } from "../utils/chat";
import { getMessages } from "../utils/message";

// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { isLoggedIn, user,computeRelationship,setUserStatus} = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatList, setChatList] = useState([]);
   const [messages, setMessages] = useState([]);
const [replyToMessage, setReplyToMessage] = useState(null);

const [receiverId, setReceiverId] = useState(
  sessionStorage.getItem("receiverId") || null
);

const [receiverData, setReceiverData] = useState(() => {
  const saved = sessionStorage.getItem("receiverData");
  return saved ? JSON.parse(saved) : null;
});

const normalizeMessage = (m) => {
  if (!m) return null;

  return {
    ...m,
    sender:
      m.sender && typeof m.sender === "object" ? m.sender : { _id: m.sender },

    replyTo: m.replyTo
      ? {
          ...m.replyTo,
          sender:
            m.replyTo.sender && typeof m.replyTo.sender === "object"
              ? m.replyTo.sender
              : { _id: m.replyTo.sender },
        }
      : null,
  };
};



  // ⚡ Connect socket
  useEffect(() => {
    if (isLoggedIn && user) {
      const newSocket = connectSocket();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        newSocket.emit("user-online", user._id);
      });

      newSocket.on("online-users", (users) => {
        setOnlineUsers(users);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      disconnectSocket();
      setOnlineUsers([]);
      setSocket(null);
    }
  }, [isLoggedIn, user]);




useEffect(() => {
  if (!socket) return;

  const handleDeletedMessage = (messageId) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  };

  socket.on("deleted-message", handleDeletedMessage);

  return () => {
    socket.off("deleted-message", handleDeletedMessage);
  };
}, [socket]);

useEffect(() => {
  if (!socket) return;

  const handleReplyReferencesCleared = (repliedMessageIds ) => {
    setMessages((prev) =>
      prev.map((msg) =>
        repliedMessageIds.includes(msg._id) ? { ...msg, replyTo: null } : msg
      )
    );
  };

  socket.on("reply-references-cleared", handleReplyReferencesCleared);

  return () => {
    socket.off("reply-references-cleared", handleReplyReferencesCleared);
  };
}, [socket]);




  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await getChatList();
        setChatList(response);
        console.log(response);
      } catch (err) {
        console.error("Chat list fetch failed:", err);
      }
    };
    fetchChats();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!socket) return;

    const handleChatListUpdated = (receiverChatList) => {
      setChatList(receiverChatList);
    };

    socket.on("chatlist-updated", handleChatListUpdated);

    return () => {
      socket.off("chatlist-updated", handleChatListUpdated);
    };
  }, [socket]);

//listen message event 
useEffect(() => {
  if (!socket) return;

  const handleReceiverMessage = (message) => {
    const normalized = normalizeMessage(message);

    if (!normalized?.sender?._id) return;
    if (receiverId === normalized.sender._id) {
      setMessages((prev) => [...prev, normalized]);
    }

    // ACK delivered (extra safety)
    socket.emit("message-delivered", message._id);
  };

  socket.on("receiver-new-message", handleReceiverMessage);

  return () => {
    socket.off("receiver-new-message", handleReceiverMessage);
  };
}, [socket, receiverId]);



 
  useEffect(() => {
    if (receiverId) sessionStorage.setItem("receiverId", receiverId);
    else sessionStorage.removeItem("receiverId");
  }, [receiverId]);

 useEffect(() => {
   if (receiverData)
     sessionStorage.setItem("receiverData", JSON.stringify(receiverData));
   else sessionStorage.removeItem("receiverData");
 }, [receiverData]);


  useEffect(() => {
    if (!receiverId) return;

    const load = async () => {
      const data = await getMessages({ receiverId });
      setMessages(data);
      console.log(data);
    };

    load();
  }, [receiverId,isLoggedIn]);


  useEffect(() => {
    if (!receiverId || !receiverData) return;

    const relation = computeRelationship(receiverId);

    let isOnline = onlineUsers.includes(receiverId);
    let show = true;
    let showAvatar = true;

    // 🔥 BLOCK LOGIC → If they blocked me, hide avatar + status
    if (relation.blockedMe) {
      show = false;
      isOnline = false;
      showAvatar = false;
    }

    // 🔥 PRIVACY RULES (THEIR visibility preference)
    if (receiverData.statusVisibility === "contacts") {
      if (!receiverData.hasSavedMe) {
        show = false;
        isOnline = false;
      }
    }

    if (receiverData.statusVisibility === "onlyme") {
      show = false;
      isOnline = false;
    }

    // 🔥 Include isContact & savedName for global use
    const finalStatus = {
      show,
      isOnline,
      showAvatar,
      blockedMe: relation.blockedMe,
      blockedByMe: relation.blockedByMe,
    };

    startTransition(() => {
      setUserStatus(finalStatus);
    });
  }, [
    receiverId,
    receiverData,
    onlineUsers,
    computeRelationship,
    setUserStatus,
  ]);


  return (
    <ChatContext.Provider
      value={{
        socket,
        onlineUsers,
        chatList,
        receiverId,
        receiverData,
        setReceiverId,
        setReceiverData,
        setChatList,
        messages,
        setMessages,
        replyToMessage,
        setReplyToMessage,
        normalizeMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};


