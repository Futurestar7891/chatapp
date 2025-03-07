import React, { useContext } from "react";
import { StateContext } from "../../main";
import "../../Css/Fetchmessages.css";

const UserStatus = () => {
  const {
    selectedUser,
    setShowUserPublicProfileData,
    setShowPublicProfile,
    showpublicprofile,
  } = useContext(StateContext);

  return (
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
  );
};

export default UserStatus;
