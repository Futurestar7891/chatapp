import "../../Css/MessageInfo.css";

function MessageInfo({ message, onClose,isSent }) {
  // Get the current user's ID from localStorage
  const currentUserId = localStorage.getItem("id");

  // Determine class based on sender
  const infoClass =
    isSent ? "senderinfo" : "receiverinfo";

  return (
    <div className={`message-info-box ${infoClass}`}>
      <div className="info-header">Message Info</div>
      <div className="info-row">
        <strong>Sent Time:</strong>{" "}
        {message.sentTime ? new Date(message.sentTime).toLocaleString() : "-"}
      </div>
      <div className="info-row">
        <strong>Received Time:</strong>{" "}
        {message.receivedTime
          ? new Date(message.receivedTime).toLocaleString()
          : "-"}
      </div>
      <div className="info-row">
        <strong>Seen Time:</strong>{" "}
        {message.seenTime ? new Date(message.seenTime).toLocaleString() : "-"}
      </div>
      <button className="info-close-button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

export default MessageInfo;
