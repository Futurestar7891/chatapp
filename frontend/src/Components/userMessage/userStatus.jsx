import React, { useContext } from "react";
import { StateContext } from "../../main";
import "../../Css/Fetchmessages.css";
import { useNavigate } from "react-router-dom";

const UserStatus = () => {
  const navigate = useNavigate();
  const {
    selectedUser,
    setShowUserPublicProfileData,
    setShowPublicProfile,
    showpublicprofile,
    isMobile,
  } = useContext(StateContext);

  const handleImageClick = async (e) => {
    if (selectedUser) {
      if (isMobile) {
        navigate("/public-profile");
         setShowUserPublicProfileData(selectedUser);
      }
      // Set the selected user's data for the public profile
      else{
         setShowUserPublicProfileData(selectedUser);
          setShowPublicProfile(!showpublicprofile);
      }
     
      e.stopPropagation();
    }
  };

  return (
    <div className="Chatapprightdivtopdiv">
      <img
        onClick={handleImageClick}
        src={selectedUser?.Photo || "/default-avatar.png"}
        alt="User"
      />
      <h2>{selectedUser?.Name || "Select a User"}</h2>
    </div>
  );
};

export default UserStatus;
