import React, { useContext } from "react";
import { StateContext } from "../../main";
import "../../Css/Fetchmessages.css";
import { useNavigate } from "react-router-dom";

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "";

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInMilliseconds = now - lastSeenDate;
  const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 48) {
    if (diffInHours < 1) {
      return "Last seen just now";
    } else if (diffInHours < 24) {
      return `Last seen ${Math.floor(diffInHours)} hour${
        Math.floor(diffInHours) === 1 ? "" : "s"
      } ago`;
    } else {
      return `Last seen at ${lastSeenDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
  } else {
    return `Last seen on ${lastSeenDate.toLocaleDateString()}`;
  }
};

const UserStatus = () => {
  const navigate = useNavigate();
  const {
    selectedUser,
    setShowUserPublicProfileData,
    setShowPublicProfile,
    showpublicprofile,
    isMobile,
    // isBlocked, // Not used here; we'll use selectedUser.isBlockedByReceiver
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
  console.log(selectedUser);
  const displayName = selectedUser?.Name || "Unknown";

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
            {displayName[0]} {/* Show initial if no photo */}
          </div>
        )}
        {selectedUser?.status === "online" &&
          !selectedUser?.isBlockedByReceiver && (
            <span className="online-indicator"></span>
          )}
      </div>
      
      <div className="user-info">
        <h2>{selectedUser?.Name || ""}</h2>
        {selectedUser && (
          <p className="status-text">
            {selectedUser.status === "online" &&
            !selectedUser.isBlockedByReceiver
              ? "Online"
              : !selectedUser.isBlockedByReceiver && selectedUser.lastSeen
              ? formatLastSeen(selectedUser.lastSeen)
              : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserStatus;
