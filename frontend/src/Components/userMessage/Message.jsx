import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useState, useRef, useEffect } from "react";
import {
  faFilePdf,
  faFileWord,
  faFileAlt,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import "../../Css/Message.css";
import { StateContext } from "../../main";
import MessageContextMenu from "./MessageContextMenu";
import MessageInfo from "./MessageInfo";

const Message = ({ message, isSent, userphoto, receiverId }) => {
  const [showMessage, setShowMessage] = useState({
    show: false,
    message: "",
  });
  const [showInfo, setShowInfo] = useState(false);
  const { selectedUser, setMessages } = useContext(StateContext);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    target: null,
  });

  useEffect(() => {
    let timer;
    if (showMessage.show) {
      timer = setTimeout(() => {
        setShowMessage({ show: false, message: "" });
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [showMessage.show]);

  const handleContextMenuAction = (action) => {
    let messageText = "";
    if (action === "copy") messageText = "Message copied to clipboard";
    else if (action === "save") messageText = "File download started";
    else if (action === "DFM") messageText = "The message is deleted for you";
    else if (action === "DFE")
      messageText = "The message is deleted for everyone";
    else if (action === "DFM-loading") messageText = "Deleting...";
    else if (action === "DFE-loading") messageText = "Deleting...";

    if (messageText) {
      setShowMessage({ show: true, message: messageText });
    }
  };

  const handleDelete = ({ type, messageId, fileIndex, senderId }) => {
    setMessages((prevMessages) => {
      if (type === "DFM") {
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
      } else if (type === "DFE") {
        if (fileIndex === "all") {
          return prevMessages.filter((msg) => msg._id !== messageId);
        } else if (typeof fileIndex === "number") {
          const updatedMessages = prevMessages.map((msg) => {
            if (msg._id === messageId && msg.files?.[fileIndex]) {
              const updatedFiles = msg.files.filter(
                (_, index) => index !== fileIndex
              );
              if (updatedFiles.length === 0 && !msg.text?.trim()) {
                return null;
              }
              return { ...msg, files: updatedFiles };
            }
            return msg;
          });
          return updatedMessages.filter((msg) => msg !== null);
        }
      }
      return prevMessages;
    });
  };

  const touchTimer = useRef(null);
  const contextMenuRef = useRef(null);
  const textRef = useRef(null);

  const hasText = !!message.text?.trim();
  const hasMedia = message.files && message.files.length > 0;

  const menuOptions = {
    showCopy: hasText,
    showSave: hasMedia,
  };

  const closeAllContextMenus = () => {
    const event = new CustomEvent("closeAllContextMenus");
    document.dispatchEvent(event);
  };

  const handleContextMenu = (e, target) => {
    e.preventDefault();
    closeAllContextMenus();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, target });
  };

  const handleTouchStart = (e, target) => {
    touchTimer.current = setTimeout(() => {
      closeAllContextMenus();
      const touch = e.touches[0];
      setContextMenu({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        target,
      });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target)
      ) {
        setContextMenu({ visible: false, x: 0, y: 0, target: null });
      }
    };

    const handleCloseAll = () => {
      setContextMenu({ visible: false, x: 0, y: 0, target: null });
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("closeAllContextMenus", handleCloseAll);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("closeAllContextMenus", handleCloseAll);
    };
  }, []);

  const getFileIcon = (fileType) => {
    if (fileType === "application/pdf") return faFilePdf;
    if (
      fileType === "application/msword" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return faFileWord;
    return faFileAlt;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown Time";
    const date = new Date(timestamp);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderFile = (file, index) => {
    if (file.isDeletedForMe) return null;

    if (file.url.startsWith("data:")) {
      if (file.type.startsWith("image")) {
        return (
          <img src={file.url} alt={file.name} style={{ maxWidth: "100%" }} />
        );
      } else if (file.type.startsWith("video")) {
        return (
          <video controls style={{ maxWidth: "100%" }}>
            <source src={file.url} type={file.type} />
          </video>
        );
      } else if (file.type.startsWith("audio")) {
        return (
          <audio controls>
            <source src={file.url} type={file.type} />
          </audio>
        );
      } else if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return (
          <div className="document-thumbnail">
            <FontAwesomeIcon icon={getFileIcon(file.type)} size="3x" />
            <p className="document-name">{file.name}</p>
          </div>
        );
      }
    } else {
      if (file.type.startsWith("image")) {
        return (
          <img src={file.url} alt={file.name} style={{ maxWidth: "100%" }} />
        );
      } else if (file.type.startsWith("video")) {
        return <video controls src={file.url} style={{ maxWidth: "100%" }} />;
      } else if (file.type.startsWith("audio")) {
        return <audio controls src={file.url} />;
      } else if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return (
          <div className="document-thumbnail">
            <FontAwesomeIcon icon={getFileIcon(file.type)} size="3x" />
            <p className="document-name">{file.name}</p>
          </div>
        );
      }
    }

    return null;
  };

  const renderMessageStatus = () => {
    if (!isSent) return null;

    const isRead = message._id && message.receivedTime;
    const isSeen = message._id && message.seenTime;

    return (
      <span className="message-status">
        <FontAwesomeIcon
          icon={faCheck}
          className={`tick single-tick ${isSeen ? "seen-tick" : ""}`}
        />
        {isRead && (
          <FontAwesomeIcon
            icon={faCheck}
            className={`tick double-tick ${isSeen ? "seen-tick" : ""}`}
          />
        )}
      </span>
    );
  };

  const renderMessageContent = () => {
    return (
      <div
        ref={textRef}
        className="messagetextdiv"
        onContextMenu={(e) => handleContextMenu(e, "text")}
        onTouchStart={(e) => handleTouchStart(e, "text")}
        onTouchEnd={handleTouchEnd}
      >
        <p>{message.text}</p>
        <div className="message-footer">
          <span className="message-timestamp">
            {formatTimestamp(isSent ? message.sentTime : message.receivedTime)}
          </span>
          {renderMessageStatus()}
        </div>
      </div>
    );
  };

  const displayName = selectedUser?.Name || "Unknown";

  return (
    <div className={`message ${isSent ? "sent" : "received"}`}>
      <div className="userphotodiv">
        {isSent ? (
          <img src={userphoto} alt="Sender" />
        ) : selectedUser?.Photo ? (
          <img src={selectedUser.Photo} alt="Receiver" />
        ) : (
          <div className="default-avatar">{displayName[0]}</div>
        )}
      </div>

      <div className={`messagesdiv ${isSent ? "sendermsg" : "receivermsg"}`}>
        {hasMedia &&
          message.files.map((file, index) => {
            if (file.isDeletedForMe) return null;
            return (
              <div
                key={index}
                className="message-media"
                onContextMenu={(e) => handleContextMenu(e, index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchEnd={handleTouchEnd}
              >
                {renderFile(file, index)}
                {contextMenu.visible && contextMenu.target === index && (
                  <div className="contextmenumaindiv" ref={contextMenuRef}>
                    <MessageContextMenu
                      x={contextMenu.x}
                      y={contextMenu.y}
                      isSent={isSent}
                      message={message}
                      file={file}
                      fileindex={index}
                      receiverId={receiverId}
                      setShowInfo={setShowInfo}
                      options={menuOptions}
                      onAction={handleContextMenuAction}
                      onClose={() =>
                        setContextMenu({
                          visible: false,
                          x: 0,
                          y: 0,
                          target: null,
                        })
                      }
                      onDelete={handleDelete}
                    />
                  </div>
                )}
              </div>
            );
          })}

        {hasText && renderMessageContent()}

        {contextMenu.visible && contextMenu.target === "text" && (
          <div className="contextmenumaindiv" ref={contextMenuRef}>
            <MessageContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              isSent={isSent}
              message={message}
              fileindex="text"
              receiverId={receiverId}
              options={menuOptions}
              setShowInfo={setShowInfo}
              onAction={handleContextMenuAction}
              onDelete={handleDelete}
              onClose={() =>
                setContextMenu({ visible: false, x: 0, y: 0, target: null })
              }
            />
          </div>
        )}
      </div>

      {showMessage.show && (
        <div className="message-notification">{showMessage.message}</div>
      )}
      {showInfo && (
        <MessageInfo
          isSent={isSent}
          message={message}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
};

export default Message;
