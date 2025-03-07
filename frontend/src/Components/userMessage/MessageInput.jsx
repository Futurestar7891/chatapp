import React, { useRef, useContext, useCallback } from "react";
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
import Blockedpopup from "../userEdit/BlockedPopup";
import { StateContext } from "../../main";
import "../../Css/Fetchmessages.css";

const MessageInput = ({ socket, handleAttachmentClick }) => {
  const {
    isBlocked,
    messageInput,
    setMessageInput,
    selectedFiles,
    setSelectedFiles,
    showAttachmentPopup,
    showAudioRecorder,
    setShowAudioRecorder,
    showPreviewPopup,
    setShowPreviewPopup,
    selectedUser,
    setMessages,
  } = useContext(StateContext);

  const senderId = localStorage.getItem("id");
  const receiverId = selectedUser?._id || null;
  const popupRef = useRef(null);
  const inputRef = useRef(null);

  const handleRecordingComplete = (audioFile) => {
    if (audioFile) {
      setSelectedFiles([audioFile]);
      setShowPreviewPopup(true);
    }
  };

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!messageInput.trim() && selectedFiles.length === 0) return;
      if (!senderId || !receiverId) {
        console.error("Cannot send message: Missing sender or receiver");
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

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_API_URL}/api/send-receive`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
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
          }
        );

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to send message");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((m) => m._id !== localMessage._id));
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

  // Define handleEmojiSelect locally using setMessageInput from context
  const handleEmojiSelect = (emoji) => {
    setMessageInput((prev) => prev + emoji);
  };

  return (
    <>
      {isBlocked ? (
        <Blockedpopup />
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
      )}
    </>
  );
};

export default MessageInput;
