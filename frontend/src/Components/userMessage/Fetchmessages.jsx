import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import Message from "./Message";
import { StateContext } from "../../main";
import MessageInput from "./MessageInput";
import "../../Css/Fetchmessages.css";
import Userstatus from "./userStatus";


const FetchMessages = () => {
  const senderId = localStorage.getItem("id");
  const [recieverphoto, setRecieverPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  

  const senderphoto = localStorage.getItem("Photo") || "/default-avatar.png";
  const {
    selectedUser,
    setMessages,
    setIsBlocked,
    showAttachmentPopup,
    setShowAttachmentPopup,
    messages,
    socket,
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
        const messagesWithFlags = data.messages.map((msg) => ({
          ...msg,
          files: msg.files.map((file) => ({
            ...file,
            isDeletedForMe: file.deletedFor?.includes(senderId) || false,
          })),
        }));
        return {
          messages: messagesWithFlags,
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
      setMessages((prev) => {
        const optimisticMessageIndex = prev.findIndex(
          (msg) =>
            msg._id.startsWith("local_") &&
            msg.senderId === newMessage.senderId &&
            msg.receiverId === newMessage.receiverId &&
            msg.sentTime === newMessage.sentTime
        );

        if (optimisticMessageIndex !== -1) {
          const updatedMessages = [...prev];
          updatedMessages[optimisticMessageIndex] = {
            ...newMessage,
            files: newMessage.files.map((file) => ({
              ...file,
              isDeletedForMe: file.deletedFor?.includes(senderId) || false,
            })),
          };
          return updatedMessages.sort(
            (a, b) => new Date(a.sentTime) - new Date(b.sentTime)
          );
        }

        if (
          newMessage.senderId.toString() === receiverId &&
          newMessage.receiverId.toString() === senderId
        ) {
          if (prev.some((msg) => msg._id === newMessage._id)) return prev;

          const updatedMessages = [
            ...prev,
            {
              ...newMessage,
              files: newMessage.files.map((file) => ({
                ...file,
                isDeletedForMe: file.deletedFor?.includes(senderId) || false,
              })),
            },
          ].sort((a, b) => new Date(a.sentTime) - new Date(b.sentTime));
          return updatedMessages;
        }

        const updatedMessages = [...prev];
        const messageIndex = updatedMessages.findIndex(
          (msg) => msg._id === newMessage._id
        );
        if (messageIndex !== -1) {
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            receivedTime:
              newMessage.receivedTime ||
              updatedMessages[messageIndex].receivedTime,
            seenTime:
              newMessage.seenTime || updatedMessages[messageIndex].seenTime,
          };
        }
        return updatedMessages.sort(
          (a, b) => new Date(a.sentTime) - new Date(b.sentTime)
        );
      });
    },
    [receiverId, senderId, setMessages]
  );

  const handleDeleteForMe = useCallback(
    ({ senderId: eventSenderId, messageId, fileIndex }) => {
      if (eventSenderId !== senderId) return;

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg._id === messageId) {
            if (fileIndex === "text" || fileIndex === "all") {
              return {
                ...msg,
                deletedFor: [...(msg.deletedFor || []), senderId],
              };
            } else if (
              typeof fileIndex === "number" &&
              msg.files?.[fileIndex]
            ) {
              const updatedFiles = msg.files.map((file, index) =>
                index === fileIndex
                  ? {
                      ...file,
                      deletedFor: [...(file.deletedFor || []), senderId],
                      isDeletedForMe: true,
                    }
                  : file
              );
              return { ...msg, files: updatedFiles };
            }
          }
          return msg;
        });

        return updatedMessages.filter(
          (msg) =>
            !msg.deletedFor?.includes(senderId) ||
            (msg.files?.some((file) => !file.deletedFor?.includes(senderId)) &&
              msg.text?.trim())
        );
      });
    },
    [senderId, setMessages]
  );

  const handleDeleteForEveryone = useCallback(
    ({ messageId, fileIndex, updatedMessage }) => {
      setMessages((prevMessages) => {
        return prevMessages.map((msg) => {
          if (msg._id === messageId) {
            if (updatedMessage) {
              return {
                ...updatedMessage,
                files: updatedMessage.files.map((file) => ({
                  ...file,
                  isDeletedForMe: file.deletedFor?.includes(senderId) || false,
                })),
              };
            }

            if (fileIndex === "all") {
              return {
                ...msg,
                deletedFor: [
                  ...new Set([...(msg.deletedFor || []), senderId, receiverId]),
                ],
              };
            } else if (
              typeof fileIndex === "number" &&
              msg.files?.[fileIndex]
            ) {
              const updatedFiles = msg.files.map((idx) =>
                idx === fileIndex
                  ? {
                      ...file,
                      deletedFor: [
                        ...new Set([
                          ...(file.deletedFor || []),
                          senderId,
                          receiverId,
                        ]),
                      ],
                      isDeletedForMe: true,
                    }
                  : file
              );

              return {
                ...msg,
                files: updatedFiles,
              };
            }
          }
          return msg;
        });
      });
    },
    [senderId, receiverId, setMessages]
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
        setMessages(freshData.messages);
        setRecieverPhoto(freshData.userphoto);
        setIsBlocked(freshData.isBlocked);
      }
      setLoading(false);
    };

    fetchInitialData();
    const roomId = [senderId, receiverId].sort().join("-");
    socket.emit("joinRoom", { roomId, senderId });
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageDeletedForMe", handleDeleteForMe);
    socket.on("messageDeletedForEveryone", (data) => {
      handleDeleteForEveryone({
        messageId: data.messageId,
        fileIndex: data.fileIndex,
        updatedMessage: data.updatedMessage,
      });
    });

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
      socket.off("messageDeletedForMe", handleDeleteForMe);
      socket.off("messageDeletedForEveryone", handleDeleteForEveryone);
      socket.off("messagesSeen");
      socket.emit("leaveRoom");
    };
  }, [
    senderId,
    receiverId,
    socket,
    fetchMessagesFromApi,
    setMessages,
    setIsBlocked,
    handleReceiveMessage,
    handleDeleteForMe,
    handleDeleteForEveryone,
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
          receiverId={receiverId}
        />
      );
    });
  }, [messages, senderId, recieverphoto, senderphoto]);

  return (
    <>
      {receiverId ? (
        <div className="Chatapprightdiv">
          <Userstatus />
          <div className="Chatapprightdivdowndiv">
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
          Please choose user from chatlist or add contact
        </div>
      )}
    </>
  );
};

export default FetchMessages;
