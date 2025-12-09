import React, { useContext } from "react";
import { ChatContext } from "../Context/ChatContext";

function ChatCard({ data }) {
  const { setReceiverId, setReceiverData } = useContext(ChatContext);
  const { user, lastMessage, updatedAt, unreadCount } = data;


  const time = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""; 

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div
      style={styles.card}
     
      onClick={() => {
        const safe = JSON.parse(JSON.stringify(user)); // CLEAN!
        sessionStorage.setItem("receiverId", safe._id);
        sessionStorage.setItem("receiverData", JSON.stringify(safe));

        setReceiverId(safe._id);
        setReceiverData(safe);
      }}
    >
      {user.avatar && !user.blockedMe  ? (
        <img src={user.avatar} alt="avatar" style={styles.avatar} />
      ) : (
        <div style={styles.initialsCircle}>{getInitials(user.name)}</div>
      )}

      <div style={styles.info}>
        <div style={styles.topRow}>
          <span style={styles.name}>{user.name}</span>
          <span style={styles.time}>{time}</span>
        </div>

        <span style={styles.lastMessage}>
          {lastMessage?.text
            ? `${lastMessage.text.slice(0, 20)}${
                lastMessage.text.length > 20 ? "..." : ""
              }`
            : lastMessage?.filename
            ? `${lastMessage.filename.slice(0, 20)}${
                lastMessage.filename.length > 20 ? "..." : ""
              }`
            : "No  message yet"}
        </span>
      </div>

      {unreadCount > 0 && <div style={styles.unreadBadge}>{unreadCount}</div>}
    </div>
  );
}

export default ChatCard;

const styles = {
  card: {
    width: "100%",
    padding: "12px",
    display: "flex",
    gap: "12px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    background: "#fff",
  },

  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  initialsCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#888",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
   alignItems:"flex-end",
    
  },

  name: {
    fontSize: "16px",
    fontWeight: "bold",
  },

  time: {
    fontSize: "12px",
    color: "#888",
  },

  lastMessage: {
    fontSize: "14px",
    color: "#000000",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  unreadBadge: {
    minWidth: "22px",
    height: "22px",
    background: "#25D366",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "12px",
    marginLeft: "auto",
  },
};
