// /* eslint-disable react-hooks/set-state-in-effect */
// /* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { connectSocket, disconnectSocket } from "../utils/socket";
import { AuthContext } from "./AuthContext";
import { getChatList, markChatSeen } from "../utils/chat";
import { getMessages } from "../utils/message";

// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { isLoggedIn, user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatList, setChatList] = useState([]);
   const [messages, setMessages] = useState([]);

const [receiverId, setReceiverId] = useState(
  sessionStorage.getItem("receiverId") || null
);

const [receiverData, setReceiverData] = useState(() => {
  const saved = sessionStorage.getItem("receiverData");
  return saved ? JSON.parse(saved) : null;
});

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

  //for sent and delivered status
  useEffect(() => {
    if (!socket || !user) return;

    // 🔥 new message
socket.on("new-message", async ({ message }) => {
  // Mark delivered if receiver
  if (message.sender !== user._id) {
    socket.emit("message-delivered", message._id);
  }

  // Add the message to global messages
  setMessages((prev) => [...prev, message]);

  // ⭐ INSTANT chatList update (receiver side)
  setChatList((prev) =>
    prev.map((chat) =>
      chat.user._id === message.sender
        ? {
            ...chat,
            lastMessage: message,
            unreadCount: chat.unreadCount + 1,
            updatedAt: message.createdAt,
          }
        : chat
    )
  );

  // ⭐ Background refresh (slow but accurate)
  const updated = await getChatList();
  setChatList(updated);
});



    // delivered update for sender
    socket.on("message-delivered-update", (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, deliveredAt: msg.deliveredAt } : m
        )
      );
    });

    // seen update for sender
    socket.on("message-seen-update", (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, seenAt: msg.seenAt } : m))
      );
    });

    return () => {
      socket.off("new-message");
      socket.off("message-delivered-update");
      socket.off("message-seen-update");
    };
  }, [socket, user]);
//end
  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await getChatList();
        setChatList(response);
      } catch (err) {
        console.error("Chat list fetch failed:", err);
      }
    };
    fetchChats();
  }, []);

useEffect(() => {
  if (!receiverId) return;

  const markSeen = async () => {
           const response=await markChatSeen(receiverId);
        
           if(response.success){
             try {
               const updatedList = await getChatList();
               setChatList(updatedList);
             } catch (err) {
               console.error("Error refreshing chat list:", err);
             }
           }
  };

  markSeen();
}, [receiverId]);

 
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
  }, [receiverId]);


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
        setMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};


