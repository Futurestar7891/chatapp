import React, { useContext } from "react";
import { StateContext } from "../../main";
import "../../Css/Fetchmessages.css";
import { useNavigate } from "react-router-dom";



const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "Unknown";

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInMilliseconds = now - lastSeenDate;
  const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 48) {
    // Within 48 hours, show "last seen at [time]" or "X hours ago"
    if (diffInHours < 1) {
      return "Last seen just now";
    } else if (diffInHours < 24) {
      return `Last seen ${Math.floor(diffInHours)} hour${Math.floor(diffInHours) === 1 ? "" : "s"} ago`;
    } else {
      return `Last seen at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  } else {
    // After 48 hours, show the date
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
    isBlocked,
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

  return (
    <div className="Chatapprightdivtopdiv">
      <div className="user-status-container">
        <img
          onClick={handleImageClick}
          src={selectedUser?.Photo || "/default-avatar.png"}
          alt="User"
          className="user-avatar"
        />
        {selectedUser?.status === "online" && !isBlocked && (
          <span className="online-indicator"></span>
        )}
      </div>
      <div className="user-info">
        <h2>{selectedUser?.Name || "Select a User"}</h2>
        {selectedUser && (
          <p className="status-text">
            {selectedUser.status === "online"
              ? "Online"
              : formatLastSeen(selectedUser.lastSeen)}{" "}:
              
            {/* Use the utility function here */}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserStatus;
