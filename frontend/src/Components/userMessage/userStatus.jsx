import React, { useContext } from "react";
import { StateContext } from "../../main";
import "../../Css/Fetchmessages.css";

const UserStatus = () => {
  const {
    selectedUser,
    setShowUserPublicProfileData,
    setShowPublicProfile,
    showpublicprofile,
    setIsBlocked,
    setIsInContactList,
  } = useContext(StateContext);

  const handleImageClick = async (e) => {
    if (selectedUser) {
      // Set the selected user's data for the public profile
      setShowUserPublicProfileData(selectedUser);
      setShowPublicProfile(!showpublicprofile);
      e.stopPropagation();

      // Pre-fetch isBlocked and isInContactList statuses
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("id");
      const receiverId = selectedUser._id;

      try {
        // Fetch isBlocked status
        const blockResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_API_URL}/api/fetch-messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              senderid: userId,
              receiverid: receiverId,
            }),
          }
        );
        const blockData = await blockResponse.json();
        if (blockData.success) {
          setIsBlocked(blockData.isBlocked);
        }

        // Fetch isInContactList status
        const contactResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_API_URL}/api/search-contact`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ receiverId }),
          }
        );
        const contactData = await contactResponse.json();
        if (contactData.success) {
          setIsInContactList(contactData.isInContactList);
        }
      } catch (error) {
        console.error("Error pre-fetching statuses:", error);
      }
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
