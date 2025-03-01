import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
} from "react";
import Message from "./Message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLink,
  faMicrophone,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import AttachmentPopup from "./AttachmentPopup";
import PreviewPopup from "./PreviewPopup";
import EmojisPicker from "./EmojiPicker";
import RecordeAudio from "./RecordAudio";
import { StateContext } from "../main";
import Blockedpopup from "./Blockedpopup";

const FetchMessages = ({ socket }) => {
  const popupRef = useRef(null);
  const inputRef = useRef();
  const senderId = localStorage.getItem("id");
  const [recieverphoto, setRecieverPhoto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  const senderphoto = localStorage.getItem("Photo") || "/default-avatar.png";
  const {
    selectedUser,
    showAttachmentPopup,
    setShowAttachmentPopup,
    showAudioRecorder,
    setShowAudioRecorder,
    showPreviewPopup,
    setShowPreviewPopup,
    selectedFiles,
    setSelectedFiles,
    messageInput,
    setMessageInput,
    messages,
    setMessages,
    isBlocked,
    setIsBlocked,
    setShowUserPublicProfileData,
    setShowPublicProfile,
    showpublicprofile,
  } = useContext(StateContext);

  const receiverId = selectedUser?._id || null;

  const fetchMessages = useCallback(async () => {
    if (!senderId || !receiverId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // Add token for authenticated request
      const response = await fetch("http://localhost:3000/api/fetch-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderid: senderId, receiverid: receiverId }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        setRecieverPhoto(data.userphoto || "");
        setIsBlocked(data.isBlocked); // Reflects if sender blocked receiver
        setError(null);
      } else {
        throw new Error(data.message || "Failed to fetch messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [receiverId, senderId, setIsBlocked, setMessages]);

  const fetchChatListAndJoinRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/chat-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: senderId }),
      });
      const data = await response.json();
      if (data.success) {
        data.chatList.forEach((chat) => {
          const roomId = [senderId, chat.userId].sort().join("-");
          socket.emit("joinRoom", roomId);
          console.log(`Proactively joined room: ${roomId}`);
        });
      } else {
        console.error("Failed to fetch chat list:", data.message);
      }
    } catch (err) {
      console.error("Error fetching chat list:", err);
    }
  }, [senderId, socket]);

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
      fetchChatListAndJoinRooms();
    });

    if (!receiverId) {
      setMessages([]);
      setCurrentRoom(null);
      setError(null);
      return;
    }

    fetchMessages();

    const newRoomId = [senderId, receiverId].sort().join("-");

    if (currentRoom && currentRoom !== newRoomId) {
      socket.emit("leaveRoom", currentRoom);
      console.log(`Left room: ${currentRoom}`);
    }

    socket.emit("joinRoom", newRoomId);
    setCurrentRoom(newRoomId);
    console.log(`Joined room: ${newRoomId}`);

    const handleReceiveMessage = (newMessage) => {
      console.log("Received message on client:", newMessage);
      if (
        newMessage.senderId.toString() === receiverId &&
        newMessage.receiverId.toString() === senderId
      ) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === newMessage._id)) return prev;
          return [...prev, newMessage].sort(
            (a, b) => new Date(a.sentTime) - new Date(b.sentTime)
          );
        });
      }
    };

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
    fetchMessages,
    senderId,
    setMessages,
    currentRoom,
    fetchChatListAndJoinRooms,
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

  useEffect(() => {
    if (showPreviewPopup && inputRef.current) inputRef.current.focus();
  }, [showPreviewPopup]);

  const handleAttachmentClick = useCallback(() => {
    setShowAttachmentPopup(!showAttachmentPopup);
  }, [setShowAttachmentPopup, showAttachmentPopup]);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!messageInput.trim() && selectedFiles.length === 0) return;
      if (!senderId || !receiverId) {
        setError("Cannot send message: Missing sender or receiver");
        return;
      }

      const filesWithData = await Promise.all(
        selectedFiles.map(async (file) => {
          if (!file.data) {
            if (file instanceof File || file instanceof Blob) {
              const reader = new FileReader();
              return new Promise((resolve) => {
                reader.onload = () => {
                  const base64Data = reader.result.split(",")[1];
                  resolve({
                    name: file.name,
                    type: file.type,
                    data: base64Data,
                  });
                };
                reader.readAsDataURL(file);
              });
            } else {
              throw new Error(
                `No data or file object provided for ${file.name}`
              );
            }
          }
          return file;
        })
      );

      const sentTime = new Date().toISOString();
      const localMessage = {
        _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId,
        receiverId,
        text: messageInput,
        files: filesWithData.map((file) => ({
          name: file.name,
          type: file.type,
          url: file.data.startsWith("data:")
            ? file.data
            : `data:${file.type};base64,${file.data}`,
        })),
        sentTime,
        receivedTime: null,
      };

      setMessages((prev) =>
        [...prev, localMessage].sort(
          (a, b) => new Date(a.sentTime) - new Date(b.sentTime)
        )
      );
      setMessageInput("");
      setSelectedFiles([]);
      setShowPreviewPopup(false);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/send-receive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Add token
          },
          body: JSON.stringify({
            senderid: senderId,
            receiverid: receiverId,
            message: {
              senderId,
              receiverId,
              text: messageInput,
              files: filesWithData,
              sentTime,
            },
          }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to send message");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((m) => m._id !== localMessage._id));
        setError("Message failed to send. Please try again.");
      }
    },
    [
      messageInput,
      selectedFiles,
      senderId,
      receiverId,
      setShowPreviewPopup,
      setMessageInput,
      setSelectedFiles,
      setMessages,
    ]
  );

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

  const handleEmojiSelect = (emoji) => setMessageInput((prev) => prev + emoji);

  const handleRecordingComplete = (audioBlob) => {
    const audioFile = new File([audioBlob], "recording.wav", {
      type: "audio/wav",
    });
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(",")[1];
      const audioMessage = {
        name: "recording.wav",
        type: "audio/wav",
        data: base64Data,
      };
      setSelectedFiles([audioMessage]);
      setShowPreviewPopup(true);
      setShowAudioRecorder(false);
    };
    reader.readAsDataURL(audioFile);
  };

  if (!senderId) {
    return (
      <div className="Chatapprightdiv">
        <div style={{ padding: "20px", color: "red" }}>
          Please log in to use the chat.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="Chatapprightdiv">
        <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="Chatapprightdiv">
      <div className="Chatapprightdivtopdiv">
        <img
          onClick={(e) => {
            if (selectedUser) {
              setShowUserPublicProfileData(selectedUser);
              setShowPublicProfile(!showpublicprofile);
              e.stopPropagation();
            }
          }}
          src={selectedUser?.Photo || "/default-avatar.png"}
          alt="User"
        />
        <h2>{selectedUser?.Name || "Select a User"}</h2>
      </div>

      {receiverId ? (
        <div
          style={{ background: `url('/background.jpg')` }}
          className="Chatapprightdivdowndiv"
        >
          {loading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <div className="messages-container">{renderedMessages}</div>
          )}
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
          className="Chatapprightdivdowndiv"
        >
          Send or receive message by choosing a chat user
        </div>
      )}

      {receiverId && socket ? (
        isBlocked ? (
          <Blockedpopup /> // Show popup if sender blocked receiver
        ) : (
          <form
            onSubmit={handleSendMessage}
            className="Chatapprightdivmessagediv"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          >
            <div className="Attachfile" ref={popupRef}>
              <FontAwesomeIcon
                icon={faLink}
                onClick={!showPreviewPopup ? handleAttachmentClick : undefined}
                style={{
                  cursor: showPreviewPopup ? "not-allowed" : "pointer",
                  opacity: showPreviewPopup ? 0.5 : 1,
                }}
              />
              {showAttachmentPopup && <AttachmentPopup />}
            </div>
            <div className="Attachfile">
              <EmojisPicker onEmojiSelect={handleEmojiSelect} />
            </div>
            <div className="Attachfile">
              <FontAwesomeIcon
                icon={faMicrophone}
                onClick={
                  !showPreviewPopup
                    ? () => setShowAudioRecorder(!showAudioRecorder)
                    : undefined
                }
                style={{
                  cursor: showPreviewPopup ? "not-allowed" : "pointer",
                  opacity: showPreviewPopup ? 0.5 : 1,
                }}
              />
              {showAudioRecorder && (
                <RecordeAudio
                  onRecordingComplete={handleRecordingComplete}
                  setShowAudioRecorder={setShowAudioRecorder}
                />
              )}
            </div>
            <input
              type="text"
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              style={{
                cursor:
                  messageInput.trim() || selectedFiles.length > 0
                    ? "pointer"
                    : "not-allowed",
              }}
              type="submit"
              className="sendmessage"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
            {showPreviewPopup && <PreviewPopup />}
          </form>
        )
      ) : (
        <div
          className="Chatapprightdivmessagediv"
          style={{ backgroundColor: "rgb(70, 69, 69)" }}
        ></div>
      )}
    </div>
  );
};

export default FetchMessages;
