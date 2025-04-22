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
  const [recieverphoto, setRecieverPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [canSeeStatus, setCanSeeStatus] = useState(false);
  const [canSeeBio, setCanSeeBio] = useState(false);
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
          userphoto: data.userphoto,
          status: data.status,
          lastSeen: data.lastSeen,
          bio: data.bio,
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
      } else {
        setMessages((prev) => {
          const updatedMessages = [...prev];
          if (updatedMessages.length > 0) {
            const latestMessageIndex = updatedMessages.length - 1;
            updatedMessages[latestMessageIndex] = {
              ...updatedMessages[latestMessageIndex],
              receivedTime: newMessage.sentTime,
            };
          }
          updatedMessages.sort(
            (a, b) => new Date(a.sentTime) - new Date(b.sentTime)
          );
          const cacheKey = getCacheKey(senderId, receiverId);
          const cachedData = getCachedData(cacheKey) || {};
          setCachedData(cacheKey, {
            ...cachedData,
            messages: updatedMessages,
          });
          console.log("Updated messages with received time:", newMessage);
          return updatedMessages;
        });
      }
    },
    [receiverId, senderId, setMessages]
  );

  useEffect(() => {
    if (!senderId || !socket || !receiverId) {
      setError(
        !senderId
          ? "Please log in to use the chat."
          : !socket
          ? "Socket connection not established."
          : "No user selected."
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
        setCanSeeStatus(!!cachedData.status);
        setCanSeeBio(!!cachedData.bio);
        setSelectedUser((prev) => ({
          ...prev,
          Photo: cachedData.userphoto,
          status: cachedData.status,
          lastSeen: cachedData.lastSeen,
          Bio: cachedData.bio,
        }));
      }

      const freshData = await fetchMessagesFromApi();
      if (freshData) {
        console.log("Fetched fresh data:", freshData);
        setMessages(freshData.messages);
        setRecieverPhoto(freshData.userphoto);
        setIsBlocked(freshData.isBlocked);
        setCanSeeStatus(!!freshData.status);
        setCanSeeBio(!!freshData.bio);
        setSelectedUser((prev) => ({
          ...prev,
          Photo: freshData.userphoto,
          status: freshData.status,
          lastSeen: freshData.lastSeen,
          Bio: freshData.bio,
        }));
        setCachedData(cacheKey, {
          messages: freshData.messages,
          userphoto: freshData.userphoto,
          lastSeen: freshData.lastSeen,
          isBlocked: freshData.isBlocked,
          status: freshData.status,
          bio: freshData.bio,
        });
      }

      setLoading(false);
    };

    fetchInitialData();

    const joinRoom = () => {
      if (socket.connected) {
        socket.emit("joinRoom", newRoomId);
        console.log(`Joined room: ${newRoomId}`);
        setCurrentRoom(newRoomId);
      } else {
        console.warn("Socket not connected, waiting to join room:", newRoomId);
      }
    };

    const onConnect = () => {
      console.log("Socket connected:", socket.id);
      joinRoom();
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setCurrentRoom(null);
    };

    const onStatusChange = ({ userId, status }) => {
      console.log(
        `FetchMessages received status update for user ${userId}: ${status}`
      );
      if (userId === receiverId && canSeeStatus) {
        console.log(`Updating status for ${userId} to ${status}`);
        setSelectedUser((prev) => ({
          ...prev,
          status: status,
          lastSeen: status === "offline" ? new Date() : prev.lastSeen,
        }));
      } else if (userId === receiverId) {
        console.log(
          `Status update ignored for ${userId}: not allowed to see status`
        );
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userStatusChanged", onStatusChange);

    joinRoom();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userStatusChanged", onStatusChange);
      if (newRoomId && socket.connected) {
        socket.emit("leaveRoom", newRoomId);
        console.log(`Left room: ${newRoomId}`);
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
    canSeeStatus,
    canSeeBio,
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
