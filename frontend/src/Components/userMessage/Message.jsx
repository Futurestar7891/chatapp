// src/components/Message.js
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import {
  faFilePdf,
  faFileWord,
  faFileAlt,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import "../../Css/Message.css";
import { StateContext } from "../../main";

const Message = ({ message, isSent, userphoto }) => {
  const { selectedUser } = useContext(StateContext);

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

  const handleOpen = (url) => {
    const newWindow = window.open();
    newWindow.document.write(`
      <html>
        <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
          <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
        </body>
      </html>
    `);
  };

  const handleSave = (url, fileName) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown Time";
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleTimeString();
  };

  const renderFile = (file) => {
    if (file.url.startsWith("data:")) {
      if (file.type.startsWith("image")) {
        return (
          <div className="message-media" key={file.name}>
            <img
              src={file.url}
              alt={file.name}
              style={{ maxWidth: "100%", height: "auto" }}
              onError={(e) => {
                console.error("Optimistic image failed to load:", file.url);
                e.target.src = "/default-image.png";
              }}
            />
          </div>
        );
      } else if (file.type.startsWith("video")) {
        return (
          <div className="message-media" key={file.name}>
            <video controls>
              <source src={file.url} type={file.type} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      } else if (file.type.startsWith("audio")) {
        return (
          <div className="message-media" key={file.name}>
            <audio controls>
              <source src={file.url} type={file.type} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      } else if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return (
          <div className="message-media document-preview" key={file.name}>
            <div className="document-thumbnail">
              <FontAwesomeIcon
                icon={getFileIcon(file.type)}
                size="3x"
                className="document-icon"
              />
              <p className="document-name">{file.name}</p>
            </div>
            <div className="document-actions">
              <button
                className="action-btn save-btn"
                onClick={() => handleSave(file.url, file.name)}
              >
                Save
              </button>
              <button
                className="action-btn open-btn"
                onClick={() => handleOpen(file.url)}
              >
                Open
              </button>
            </div>
          </div>
        );
      }
    } else {
      if (file.type.startsWith("image")) {
        return (
          <div className="message-media" key={file.name}>
            <img
              src={file.url}
              alt={file.name}
              style={{ maxWidth: "100%", height: "auto" }}
              onError={(e) => {
                console.error("Backend image failed to load:", file.url);
                e.target.src = "/default-image.png";
              }}
            />
          </div>
        );
      } else if (file.type.startsWith("video")) {
        return (
          <div className="message-media" key={file.name}>
            <video controls src={file.url} />
          </div>
        );
      } else if (file.type.startsWith("audio")) {
        return (
          <div className="message-media" key={file.name}>
            <audio controls src={file.url} />
          </div>
        );
      } else if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return (
          <div className="message-media document-preview" key={file.name}>
            <div className="document-thumbnail">
              <FontAwesomeIcon
                icon={getFileIcon(file.type)}
                size="3x"
                className="document-icon"
              />
              <p className="document-name">{file.name}</p>
            </div>
            <div className="document-actions">
              <button
                className="action-btn save-btn"
                onClick={() => handleSave(file.url, file.name)}
              >
                Save
              </button>
              <button
                className="action-btn open-btn"
                onClick={() => handleOpen(file.url)}
              >
                Open
              </button>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const renderMessageStatus = () => {
    if (!isSent) return null;

    // Check if message is from backend (has _id) and has receivedTime
    const isRead = message._id && message.receivedTime;
    const isSeen = message._id && message.seenTime;

    return (
      <span className="message-status">
        {/* Always show single tick */}
        <FontAwesomeIcon
          icon={faCheck}
          className={`tick single-tick ${isSeen ? "seen-tick" : ""}`}
        />

        {/* Show double tick when read */}
        {isRead && (
          <FontAwesomeIcon
            icon={faCheck}
            className={`tick double-tick ${isSeen ? "seen-tick" : ""}`}
          />
        )}
      </span>
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
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "20px",
            }}
          >
            {displayName[0]}
          </div>
        )}
      </div>
      <div className={`messagesdiv ${isSent ? "sendermsg" : "receivermsg"}`}>
        {message.files && message.files.map((file) => renderFile(file))}
        <div className="messagetextdiv">
          <p>{message.text}</p>
          <div className="message-footer">
            <span className="message-timestamp">
              {formatTimestamp(isSent ?message.sentTime:message.receivedTime)}
            </span>
            {renderMessageStatus()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
