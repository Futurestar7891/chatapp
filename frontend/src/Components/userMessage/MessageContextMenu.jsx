import { useEffect } from "react";
import "../../Css/MessageContextMenu.css";

const MessageContextMenu = ({
  x,
  y,
  isSent,
  message,
  file,
  fileindex,
  receiverId,
  options,
  setShowInfo,
  onClose,
  onAction,
  onDelete,
}) => {
  const senderId = localStorage.getItem("id");

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      onAction("copy");
    }
    onClose();
  };

  const handleSave = async () => {
    if (!file) return;

    try {
      const cloudinaryUrl = file.url.replace(
        "/upload/",
        "/upload/fl_attachment/"
      );

      const link = document.createElement("a");
      link.href = cloudinaryUrl;
      link.download =
        file.name || `file_${Date.now()}.${file.type.split("/")[1]}`;

      link.onerror = async () => {
        const response = await fetch(file.url);
        const blob = await response.blob();
        link.href = window.URL.createObjectURL(blob);
        link.click();
        window.URL.revokeObjectURL(link.href);
      };

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onAction("save");
    } catch (error) {
      console.error("Download failed:", error);
    }

    onClose();
  };

  const handleInfo = () => {
    setShowInfo(true);
    onClose();
  };

  const handleForward = () => {
    console.log("Forward:", message);
    onClose();
  };

  const handleReply = () => {
    console.log("Reply:", message);
    onClose();
  };

  const handleDeleteForMe = async () => {
    try {
      let deleteWholeMessage = false;

      if (fileindex === "text") {
        deleteWholeMessage = true;
      } else {
        const mediaCount = message.files.filter(
          (f) => !f.isDeletedForMe
        ).length;
        const hasText = !!message.text?.trim();

        if (mediaCount === 1 && !hasText) {
          deleteWholeMessage = true;
        } else if (mediaCount === 1 && hasText) {
          deleteWholeMessage = true;
        } else {
          deleteWholeMessage = false;
        }
      }

      onAction("DFM-loading");

      onDelete({
        type: "DFM",
        messageId: message._id,
        fileIndex: deleteWholeMessage ? "all" : Number(fileindex),
        senderId,
        receiverId,
      });

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/delete-for-me`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            senderid: senderId,
            receiverId,
            Message: message,
            fileindex: deleteWholeMessage ? "all" : Number(fileindex),
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        onAction("DFM");
      } else {
        console.error("❌ Delete failed:", data.error);
      }
    } catch (err) {
      console.error("❌ Network or server error:", err);
    }

    onClose();
  };

  const handleDeleteForEveryone = async () => {
    if (!isSent) return;

    try {
      let deleteWholeMessage = false;

      if (fileindex === "text") {
        deleteWholeMessage = true;
      } else {
        const mediaCount = message.files.filter(
          (f) => !f.isDeletedForMe
        ).length;
        const hasText = !!message.text?.trim();

        if (mediaCount === 1 && !hasText) {
          deleteWholeMessage = true;
        } else if (mediaCount === 1 && hasText) {
          deleteWholeMessage = true;
        } else {
          deleteWholeMessage = false;
        }
      }

      onAction("DFE-loading");

      onDelete({
        type: "DFE",
        messageId: message._id,
        fileIndex: deleteWholeMessage ? "all" : Number(fileindex),
        senderId,
        receiverId,
      });

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/delete-for-everyone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            senderid: senderId,
            receiverId,
            Message: message,
            fileindex: deleteWholeMessage ? "all" : Number(fileindex),
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        onAction("DFE");
      } else {
        console.error("❌ Delete failed:", data.error);
      }
    } catch (err) {
      console.error("❌ Network or server error:", err);
    }

    onClose();
  };

  return (
    <div
      className={`context-menu ${isSent ? "contextsent" : "contextreceived"}`}
      style={{ position: "fixed", left: x, top: y }}
    >
      <div className="context-menu-item" onClick={handleInfo}>
        Info
      </div>
      <div className="context-menu-item" onClick={handleForward}>
        Forward
      </div>
      {options.showCopy && (
        <div className="context-menu-item" onClick={handleCopy}>
          Copy
        </div>
      )}
      {options.showSave && (
        <div className="context-menu-item" onClick={handleSave}>
          Save
        </div>
      )}
      <div className="context-menu-item" onClick={handleReply}>
        Reply
      </div>
      <div className="context-menu-item" onClick={handleDeleteForMe}>
        Delete for Me
      </div>
      {isSent && (
        <div className="context-menu-item" onClick={handleDeleteForEveryone}>
          Delete for Everyone
        </div>
      )}
    </div>
  );
};

export default MessageContextMenu;
