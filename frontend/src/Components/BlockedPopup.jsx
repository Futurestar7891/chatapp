import { StateContext } from "../main";
import { useContext } from "react";

const Blockedpopup = () => {
  const { selectedUser, setIsBlocked } = useContext(StateContext);

  const handleUnblockClick = async () => {
    const token = localStorage.getItem("token");
    const blockedUserId = selectedUser._id;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/unblock-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ blockedUserId }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setIsBlocked(false);
        console.log("after change blockedusers", data.blockedarray);
        console.log("the state after change ", data.isBlocked);
      } else {
        console.error("Failed to unblock user:", data.message);
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  return (
    <div className="BlockedPopupamaindiv">
      <p>
        You have blocked this user.{" "}
        <span
          onClick={handleUnblockClick}
          style={{ cursor: "pointer", textDecoration: "underline" }}
        >
          Tap to unblock
        </span>
      </p>
    </div>
  );
};

export default Blockedpopup;
