import { useContext } from "react";
import { StateContext } from "../../main";
import "../../Css/Fetchmessages.css";
import { useNavigate } from "react-router-dom";

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "";

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInMilliseconds = now - lastSeenDate;
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"} ago`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes === 1 ? "" : ""} ago`;
  } else if (diffInHours < 41) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  } else {
    const isSameDay =
      now.getDate() === lastSeenDate.getDate() &&
      now.getMonth() === lastSeenDate.getMonth() &&
      now.getFullYear() === lastSeenDate.getFullYear();

    if (isSameDay) {
      return lastSeenDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    } else {
      return lastSeenDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }
};

const Userstatus = () => {
  const navigate = useNavigate();
  const {
    selectedUser,
    setShowUserPublicProfileData,
    setShowPublicProfile,
    showpublicprofile,
    isMobile,
    onlineUsers,
  } = useContext(StateContext);

  const handleImageClick = (e) => {
    if (selectedUser) {
      if (isMobile) {
        navigate("/public-profile");
        setShowUserPublicProfileData(selectedUser);
      } else {
        setShowUserPublicProfileData(selectedUser);
        setShowPublicProfile(!showpublicprofile);
      }
      e.stopPropagation();
    }
  };

  const displayName = selectedUser?.Name || "Unknown";
  const isOnline = selectedUser?._id && onlineUsers.includes(selectedUser._id);
  const canSeeStatus =
    selectedUser?.status && !selectedUser?.isBlockedByReceiver;

  return (
    <div className="Chatapprightdivtopdiv">
      <div className="user-status-container">
        {selectedUser?.Photo ? (
          <img
            onClick={handleImageClick}
            src={selectedUser.Photo}
            alt="User"
            className="user-avatar"
          />
        ) : (
          <div
            onClick={handleImageClick}
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
              cursor: "pointer",
            }}
          >
            {displayName[0]}
          </div>
        )}
        {canSeeStatus && isOnline && <span className="online-indicator"></span>}
      </div>

      <div className="user-info">
        <h2>{displayName}</h2>
        {selectedUser && canSeeStatus && (
          <p className="status-text">
            {isOnline
              ? "Online"
              : selectedUser.lastSeen
              ? formatLastSeen(selectedUser.lastSeen)
              : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default Userstatus;
