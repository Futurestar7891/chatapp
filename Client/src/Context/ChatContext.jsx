// /* eslint-disable react-hooks/set-state-in-effect */
// /* eslint-disable react-refresh/only-export-components */
// import { createContext, useState, useEffect, useContext } from "react";
// import { connectSocket, disconnectSocket } from "../utils/socket";
// import { AuthContext } from "./AuthContext";
// import { getChatList, markChatSeen } from "../utils/chat";
// import { getMessages } from "../utils/message";

// export const ChatContext = createContext();

// export const ChatProvider = ({ children }) => {
//   const { isLoggedIn, user } = useContext(AuthContext);

//   const [socket, setSocket] = useState(null);
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [chatList, setChatList] = useState([]);
//    const [messages, setMessages] = useState([]);

// const [receiverId, setReceiverId] = useState(
//   sessionStorage.getItem("receiverId") || null
// );

// const [receiverData, setReceiverData] = useState(() => {
//   const saved = sessionStorage.getItem("receiverData");
//   return saved ? JSON.parse(saved) : null;
// });

//   // ⚡ Connect socket
//   useEffect(() => {
//     if (isLoggedIn && user) {
//       const newSocket = connectSocket();
//       setSocket(newSocket);

//       newSocket.on("connect", () => {
//         console.log("Socket connected:", newSocket.id);
//         newSocket.emit("user-online", user._id);
//       });

//       newSocket.on("online-users", (users) => {
//         setOnlineUsers(users);
//       });

//       return () => {
//         newSocket.disconnect();
//       };
//     } else {
//       disconnectSocket();
//       setOnlineUsers([]);
//       setSocket(null);
//     }
//   }, [isLoggedIn, user]);

//   //for sent and delivered status
//   useEffect(() => {
//     if (!socket || !user) return;

//     // 🔥 new message
// socket.on("new-message", async ({ message }) => {
//   // Mark delivered if receiver
//   if (message.sender !== user._id) {
//     socket.emit("message-delivered", message._id);
//   }

//   // Add the message to global messages
//   setMessages((prev) => [...prev, message]);

//   // ⭐ INSTANT chatList update (receiver side)
//   setChatList((prev) =>
//     prev.map((chat) =>
//       chat.user._id === message.sender
//         ? {
//             ...chat,
//             lastMessage: message,
//             unreadCount: chat.unreadCount + 1,
//             updatedAt: message.createdAt,
//           }
//         : chat
//     )
//   );

//   // ⭐ Background refresh (slow but accurate)
//   const updated = await getChatList();
//   setChatList(updated);
// });



//     // delivered update for sender
//     socket.on("message-delivered-update", (msg) => {
//       setMessages((prev) =>
//         prev.map((m) =>
//           m._id === msg._id ? { ...m, deliveredAt: msg.deliveredAt } : m
//         )
//       );
//     });

//     // seen update for sender
//     socket.on("message-seen-update", (msg) => {
//       setMessages((prev) =>
//         prev.map((m) => (m._id === msg._id ? { ...m, seenAt: msg.seenAt } : m))
//       );
//     });

//     return () => {
//       socket.off("new-message");
//       socket.off("message-delivered-update");
//       socket.off("message-seen-update");
//     };
//   }, [socket, user]);
// //end
  
//   useEffect(() => {
//     const fetchChats = async () => {
//       try {
//         const response = await getChatList();
//         setChatList(response);
//       } catch (err) {
//         console.error("Chat list fetch failed:", err);
//       }
//     };
//     fetchChats();
//   }, []);

// useEffect(() => {
//   if (!receiverId) return;

//   const markSeen = async () => {
//            const response=await markChatSeen(receiverId);
        
//            if(response.success){
//              try {
//                const updatedList = await getChatList();
//                setChatList(updatedList);
//              } catch (err) {
//                console.error("Error refreshing chat list:", err);
//              }
//            }
//   };

//   markSeen();
// }, [receiverId]);

 
//   useEffect(() => {
//     if (receiverId) sessionStorage.setItem("receiverId", receiverId);
//     else sessionStorage.removeItem("receiverId");
//   }, [receiverId]);

//  useEffect(() => {
//    if (receiverData)
//      sessionStorage.setItem("receiverData", JSON.stringify(receiverData));
//    else sessionStorage.removeItem("receiverData");
//  }, [receiverData]);


//   useEffect(() => {
//     if (!receiverId) return;

//     const load = async () => {
//       const data = await getMessages({ receiverId });
//       setMessages(data);
//       console.log(data);
//     };

//     load();
//   }, [receiverId]);


//   return (
//     <ChatContext.Provider
//       value={{
//         socket,
//         onlineUsers,
//         chatList,
//         receiverId,
//         receiverData,
//         setReceiverId,
//         setReceiverData,
//         setChatList,
//         messages,
//         setMessages
//       }}
//     >
//       {children}
//     </ChatContext.Provider>
//   );
// };


/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useMemo, useRef } from "react";
import { connectSocket, disconnectSocket } from "../utils/socket";
import { AuthContext } from "./AuthContext";
import { getChatList, markChatSeen } from "../utils/chat";
import { getMessages } from "../utils/message";

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

  // 🚀 OPTIMIZATION: Use refs to track socket events
  const socketRef = useRef(null);
  const isMountedRef = useRef(true);

  // ⚡ Connect socket
  useEffect(() => {
    isMountedRef.current = true;
    
    if (isLoggedIn && user) {
      const newSocket = connectSocket();
      setSocket(newSocket);
      socketRef.current = newSocket;

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        newSocket.emit("user-online", user._id);
      });

      newSocket.on("online-users", (users) => {
        if (isMountedRef.current) {
          setOnlineUsers(users);
        }
      });

      return () => {
        socketRef.current = null;
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
    const handleNewMessage = async ({ message }) => {
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
      // 🚀 OPTIMIZATION: Add debounce to prevent rapid API calls
      const updated = await getChatList();
      if (isMountedRef.current) {
        setChatList(updated);
      }
    };

    socket.on("new-message", handleNewMessage);

    // delivered update for sender
    const handleDeliveredUpdate = (msg) => {
      if (isMountedRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msg._id ? { ...m, deliveredAt: msg.deliveredAt } : m
          )
        );
      }
    };

    socket.on("message-delivered-update", handleDeliveredUpdate);

    // seen update for sender
    const handleSeenUpdate = (msg) => {
      if (isMountedRef.current) {
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, seenAt: msg.seenAt } : m))
        );
      }
    };

    socket.on("message-seen-update", handleSeenUpdate);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("message-delivered-update", handleDeliveredUpdate);
      socket.off("message-seen-update", handleSeenUpdate);
    };
  }, [socket, user]);
  //end
  
  useEffect(() => {
    let isActive = true;
    
    const fetchChats = async () => {
      try {
        const response = await getChatList();
        if (isActive) {
          setChatList(response);
        }
      } catch (err) {
        console.error("Chat list fetch failed:", err);
      }
    };
    
    fetchChats();
    
    return () => {
      isActive = false;
    };
  }, [receiverData]);

  // 🚨 POTENTIAL INFINITE LOOP - Add chatList dependency
  useEffect(() => {
    if (!receiverId) return;
    
    let isActive = true;

    const markSeen = async () => {
      const response = await markChatSeen(receiverId);
      
      if(response.success && isActive){
        try {
          const updatedList = await getChatList();
          if (isActive) {
            setChatList(updatedList);
          }
        } catch (err) {
          console.error("Error refreshing chat list:", err);
        }
      }
    };

    markSeen();
    
    return () => {
      isActive = false;
    };
  }, [receiverId]); // 🚨 Keep only receiverId, chatList causes loop

 
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
    
    let isActive = true;

    const load = async () => {
      const data = await getMessages({ receiverId });
      if (isActive) {
        setMessages(data);
      }
    };

    load();
    
    return () => {
      isActive = false;
    };
  }, [receiverId]);

  // 🚀 OPTIMIZATION: Memoize context value
  const contextValue = useMemo(() => ({
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
  }), [socket, onlineUsers, chatList, receiverId, receiverData, messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};