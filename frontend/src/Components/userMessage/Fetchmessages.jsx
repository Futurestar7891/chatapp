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

const FetchMessages = ({ socket }) => {
  const senderId = localStorage.getItem("id");
  const [recieverphoto, setRecieverPhoto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const popupRef = useRef(null);

  const senderphoto = localStorage.getItem("Photo") || "/default-avatar.png";
  const {
    selectedUser,
    setMessages,
    setIsBlocked,
    showAttachmentPopup,
    setShowAttachmentPopup,
    messages,
  } = useContext(StateContext);

  const receiverId = selectedUser?._id || null;

  // Generate a unique key for the chat room cache
  const getCacheKey = useCallback((senderId, receiverId) => {
    return `messages_${[senderId, receiverId].sort().join("-")}`;
  }, []);

  // Fetch messages from the API
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
          userphoto: data.userphoto || "",
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

  // Load cached data and fetch fresh data
  const loadMessages = useCallback(async () => {
    if (!senderId || !receiverId) return;

    const cacheKey = getCacheKey(senderId, receiverId);
    const cachedData = sessionStorage.getItem(cacheKey);

    // Immediately show cached data if available
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      setMessages(parsedData.messages || []);
      setRecieverPhoto(parsedData.userphoto || "");
      setIsBlocked(parsedData.isBlocked || false);
    }

    // Fetch fresh data from API in the background
    setLoading(true);
    const freshData = await fetchMessagesFromApi();
    setLoading(false);

    if (freshData) {
      setMessages(freshData.messages);
      setRecieverPhoto(freshData.userphoto);
      setIsBlocked(freshData.isBlocked);
      setError(null);

      // Update cache with fresh data
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          messages: freshData.messages,
          userphoto: freshData.userphoto,
          isBlocked: freshData.isBlocked,
        })
      );
    }
  }, [
    senderId,
    receiverId,
    getCacheKey,
    fetchMessagesFromApi,
    setMessages,
    setIsBlocked,
  ]);

  // Handle new messages received via WebSocket
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

          // Update the cache with the new message
          const cacheKey = getCacheKey(senderId, receiverId);
          const cachedData = JSON.parse(sessionStorage.getItem(cacheKey)) || {};
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              ...cachedData,
              messages: updatedMessages,
            })
          );

          return updatedMessages;
        });
      }
    },
    [receiverId, senderId, setMessages, getCacheKey]
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

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    if (!receiverId) {
      setMessages([]);
      setCurrentRoom(null);
      setError(null);
      setRecieverPhoto("");
      setIsBlocked(false);
      return;
    }

    // Load messages (cached first, then fresh)
    loadMessages();

    const newRoomId = [senderId, receiverId].sort().join("-");

    if (currentRoom && currentRoom !== newRoomId) {
      socket.emit("leaveRoom", currentRoom);
      console.log(`Left room: ${currentRoom}`);
    }

    socket.emit("joinRoom", newRoomId);
    setCurrentRoom(newRoomId);
    console.log(`Joined room: ${newRoomId}`);

    socket.off("receiveMessage").on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      if (newRoomId) {
        socket.emit("leaveRoom", newRoomId);
        console.log(`Left room on cleanup: ${newRoomId}`);
      }
    };
  }, [
    receiverId,
    socket,
    loadMessages,
    senderId,
    setMessages,
    currentRoom,
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