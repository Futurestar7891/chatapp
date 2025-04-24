import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import Message from "./Message";
import { StateContext } from "../../main";
import UserStatus from "./userStatus";
import MessageInput from "./MessageInput";
import "../../Css/Fetchmessages.css";

const FetchMessages = () => {
  const senderId = localStorage.getItem("id");
  const [recieverphoto, setRecieverPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const senderphoto = localStorage.getItem("Photo") || "/default-avatar.png";
  const {
    selectedUser,
    setSelectedUser,
    setMessages,
    setIsBlocked,
    showAttachmentPopup,
    setShowAttachmentPopup,
    messages,
    onlineUsers,
    socket // Access onlineUsers from StateContext
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
          return updatedMessages;
        });
      } else {
        setMessages((prev) => {
          const updatedMessages = [...prev];
          if (updatedMessages.length > 0) {
            const latestMessageIndex = updatedMessages.length - 1;
            updatedMessages[latestMessageIndex] = {
              ...updatedMessages[latestMessageIndex],
              receivedTime: newMessage.receivedTime,
              seenTime:newMessage.seenTime,
            };
          }
          updatedMessages.sort(
            (a, b) => new Date(a.sentTime) - new Date(b.sentTime)
          );
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

    const fetchInitialData = async () => {
      setLoading(true);

      const freshData = await fetchMessagesFromApi();
      if (freshData) {
        console.log("Fetched fresh data:", freshData);
        setMessages(freshData.messages);
        setRecieverPhoto(freshData.userphoto);
        setIsBlocked(freshData.isBlocked);
        setSelectedUser((prev) => ({
          ...prev,
          Photo: freshData.userphoto,
          status: onlineUsers.includes(receiverId) ? "online" : "offline",
          lastSeen: onlineUsers.includes(receiverId) ? null : new Date(),
        }));
      }

      setLoading(false);
    };

    fetchInitialData();
    const roomId=[senderId,receiverId].sort().join("-");
    socket.emit("joinRoom",{roomId,senderId});
    socket.on("receiveMessage", handleReceiveMessage);

    socket.on(
      "messagesSeen",
      ({ senderId: seenFrom, receiverId: seenTo, seenTime }) => {
        if (seenFrom === senderId && seenTo === receiverId) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.seenTime || msg.senderId !== senderId
                ? msg
                : { ...msg, seenTime }
            )
          );
        }
      }
    );

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageSeen");
       socket.emit("leaveRoom");
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
    onlineUsers, // Depend on onlineUsers
  ]);

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
