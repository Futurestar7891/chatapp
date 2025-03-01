import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StateContext } from "../main";

const Options = ({ socket }) => {
  const {
    setShowPublicProfile,
    showbar,
    setShowbar,
    setShowUserPublicProfileData,
  } = useContext(StateContext);

  const SenderDetail = {
    Email: localStorage.getItem("Email"),
    Mobile: localStorage.getItem("Mobile"),
    Name: localStorage.getItem("Name"),
    Bio: localStorage.getItem("Bio"),
    Photo: localStorage.getItem("Photo"),
    _id: localStorage.getItem("id"),
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Notify the server to invalidate the token (or destroy the session)
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/api/logout`, {
        method: "POST",
        credentials: "include", // Ensures cookies are included in the request
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Remove the token from local storage
        localStorage.removeItem("token");

        // Notify the server via socket
        if (socket) {
          socket.emit("logout");
        }
        setShowPublicProfile(false);
        setShowbar(false);

        // Redirect to login
        console.log("logout already");
        navigate("/login", { replace: true });
      } else {
        console.error("Failed to logout:", await response.text());
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="Optionsmaindiv">
      <div className="Optionstopdiv">
        <h2>Settings</h2>
        <span
          onClick={() => {
            setShowbar(!showbar);
          }}
        >
          X
        </span>
      </div>

      <div className="Optionsdowndiv">
        <div
          onClick={() => {
            setShowPublicProfile(true);
            setShowbar(!showbar);
            setShowUserPublicProfileData(SenderDetail);
          }}
          className="option-item"
        >
          <h4>Personal Information</h4>
        </div>
        <div
          onClick={() => {
            navigate("/changepassword");
          }}
          className="option-item"
        >
          <h4>Change Password</h4>
        </div>
        <div
          onClick={() => console.log("Privacy Settings")}
          className="option-item"
        >
          <h4>Privacy Settings</h4>
        </div>
        <div
          onClick={() => console.log("Notification Settings")}
          className="option-item"
        >
          <h4>Calls</h4>
        </div>
        <div onClick={handleLogout} className="option-item">
          <h4 style={{ color: "red" }}>Logout</h4>
        </div>
      </div>
    </div>
  );
};

export default Options;
