import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
} from "react";
import Message from "./Message";
import { StateContext } from "../../main";
import UserStatus from "./userStatus";
import MessageInput from "./MessageInput";
import "../../Css/Fetchmessages.css";
import { getCacheKey, getCachedData, setCachedData } from "../utils/caching";

const FetchMessages = ({ socket }) => {
  const senderId = localStorage.getItem("id");
  const [recieverphoto, setRecieverPhoto] = useState(null); // Allow null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const popupRef = useRef(null);

  const senderphoto = localStorage.getItem("Photo") || "/default-avatar.png";
  const {
    selectedUser,
    setSelectedUser,
    setMessages,
    setIsBlocked,
    showAttachmentPopup,
    setShowAttachmentPopup,
    messages,
  } = useContext(StateContext);
 console.log(selectedUser);
  const receiverId = selectedUser?._id || null;

  const fetchMessagesFromApi = useCallback(async () => {
    if (!senderId || !receiverId) return null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/fetch-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ senderid: senderId, receiverid: receiverId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        return {
          messages: data.messages || [],
          userphoto: data.userphoto, // Privacy-filtered
          status: data.status, // Privacy-filtered
          lastSeen: data.lastSeen, // Privacy-filtered
          isBlocked: data.isBlocked,
        };
      }
      throw new Error(data.message || "Failed to fetch messages");
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.message);
      return null;
    }
  }, [senderId, receiverId]);

  const handleReceiveMessage = useCallback(
    (newMessage) => {
      console.log("Received message on client:", newMessage);
      if (
        newMessage.senderId.toString() === receiverId &&
        newMessage.receiverId.toString() === senderId
      ) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === newMessage._id)) return prev;

          const updatedMessages = [...prev, newMessage].sort(
            (a, b) => new Date(a.sentTime) - new Date(b.sentTime)
          );

          const cacheKey = getCacheKey(senderId, receiverId);
          const cachedData = getCachedData(cacheKey) || {};
          setCachedData(cacheKey, {
            ...cachedData,
            messages: updatedMessages,
          });

          return updatedMessages;
        });
      }
      else {
      setMessages((prev) => {
        // Clone previous messages
        const updatedMessages = [...prev];

        // Find the latest message (last in sorted order)
        if (updatedMessages.length > 0) {
          const latestMessageIndex = updatedMessages.length - 1;
          updatedMessages[latestMessageIndex] = {
            ...updatedMessages[latestMessageIndex],
            receivedTime: newMessage.sentTime,
          };
        }

        // Sort messages after updating receivedTime
        updatedMessages.sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime));

        // Update the cache
        const cacheKey = getCacheKey(senderId, receiverId);
        const cachedData = getCachedData(cacheKey) || {};
        setCachedData(cacheKey, {
          ...cachedData,
          messages: updatedMessages,
        });

        console.log(newMessage);
        return updatedMessages;
      });
    }
    },
    [receiverId, senderId, setMessages]
  );

  useEffect(() => {
    if (!senderId || !socket) {
      setError(
        !senderId
          ? "Please log in to use the chat."
          : "Socket connection not established."
      );
      return;
    }

    const newRoomId = [senderId, receiverId].sort().join("-");

    const fetchInitialData = async () => {
      setLoading(true);

      const cacheKey = getCacheKey(senderId, receiverId);
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        setMessages(cachedData.messages || []);
        setRecieverPhoto(cachedData.userphoto || null);
        setIsBlocked(cachedData.isBlocked || false);
        setSelectedUser((prev) => ({
          ...prev,
          Photo: cachedData.userphoto,
          status: cachedData.status,
          lastSeen: cachedData.lastSeen,
        }));
      }

      const freshData = await fetchMessagesFromApi();
      if (freshData) {
        console.log(freshData);
        setMessages(freshData.messages);
        setRecieverPhoto(freshData.userphoto);
        setIsBlocked(freshData.isBlocked);
        setSelectedUser((prev) => ({
          ...prev,
          Photo: freshData.userphoto,
          status: freshData.status,
          lastSeen: freshData.lastSeen,
        }));
        setCachedData(cacheKey, {
          messages: freshData.messages,
          userphoto: freshData.userphoto,
          lastSeen: freshData.lastSeen,
          isBlocked: freshData.isBlocked,
        });
      }

      setLoading(false);
    };

    fetchInitialData();

    socket.emit("joinRoom", newRoomId);
    setCurrentRoom(newRoomId);

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userStatusChanged", ({ userId, status }) => {
      console.log(`Status update for ${userId}: ${status}`);
      if (userId === receiverId) {
        setSelectedUser((prev) => ({
          ...prev,
          status:selectedUser.status!=null?status:"offline",
          lastSeen: status === "offline" ? new Date() : prev.lastSeen,
        }));
      }
    });

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userStatusChanged");
      if (newRoomId) {
        socket.emit("leaveRoom", newRoomId);
      }
    };
  }, [
    senderId,
    receiverId,
    socket,
    fetchMessagesFromApi,
    setMessages,
    setIsBlocked,
    setSelectedUser,
    handleReceiveMessage,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowAttachmentPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowAttachmentPopup]);

  const handleAttachmentClick = useCallback(() => {
    setShowAttachmentPopup(!showAttachmentPopup);
  }, [setShowAttachmentPopup, showAttachmentPopup]);

  const renderedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const isSent =
        msg.senderId === senderId || msg.senderId?._id === senderId;
      const displayTime = isSent
        ? msg.sentTime
        : msg.receivedTime || msg.sentTime;
      return (
        <Message
          userphoto={isSent ? senderphoto : recieverphoto}
          key={msg._id || index}
          message={{ ...msg, timestamp: displayTime }}
          isSent={isSent}
        />
      );
    });
  }, [messages, senderId, recieverphoto, senderphoto]);

  return (
    <>
      {receiverId ? (
        <div className="Chatapprightdiv">
          <UserStatus />
          <div
            style={{ background: `url('/background.jpg')` }}
            className="Chatapprightdivdowndiv"
          >
            {loading && !messages.length ? (
              <div className="loader-container">
                <div className="loader"></div>
              </div>
            ) : (
              <div className="messages-container">{renderedMessages}</div>
            )}
          </div>
          <MessageInput
            socket={socket}
            handleAttachmentClick={handleAttachmentClick}
          />
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "rgb(70, 69, 69)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "black",
            fontSize: "2vw",
          }}
          className="Chatapprightdiv"
        >
          Please choose user from chatlist to start conversation
        </div>
      )}
    </>
  );
};

export default FetchMessages;
