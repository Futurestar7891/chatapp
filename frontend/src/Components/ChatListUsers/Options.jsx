import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StateContext } from "../../main";
import axios from "axios";
import "../../Css/Options.css";

const Options = ({ socket }) => {
  const {
    setShowPublicProfile,
    showpublicprofile,
    showbar,
    setShowbar,
    setShowUserPublicProfileData,
    isMobile,
    setShowPrivacy,
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
      const userId = localStorage.getItem("id");
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      if (data.success) {
        localStorage.removeItem("token");

        // Notify server via socket without disconnecting client-side
        if (socket && socket.connected) {
          socket.emit("logout", userId); // Send userId with logout event
          console.log("Logout event emitted to server");
        }

        setShowPublicProfile(false);
        setShowbar(false);

        console.log("Logout successful");
        navigate("/login", { replace: true });
      } else {
        console.log(data);
      }
    } catch (error) {
      if (error.response) {
        console.error("Failed to logout:", error.response.data);
      } else if (error.request) {
        console.error("Logout error: No response received", error.request);
      } else {
        console.error("Logout error:", error.message);
      }
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
            if (isMobile) {
              navigate("/public-profile");
              setShowUserPublicProfileData(SenderDetail);
            } else {
              setShowUserPublicProfileData(SenderDetail);
              setShowPublicProfile(true);
              setShowbar(!showbar);
              setShowPrivacy(false);
            }
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
          onClick={() => {
            if (isMobile) {
              navigate("/privacy-setting");
            } else {
              if (showpublicprofile) {
                setShowPublicProfile(false);
              }
              setShowPrivacy(true);
              setShowbar(!showbar);
            }
          }}
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
        <div
          onClick={() => {
            setShowUserPublicProfileData({});
            navigate("/add-contact");
          }}
          className="option-item"
        >
          <h4>Add new Contact</h4>
        </div>
        <div onClick={handleLogout} className="option-item">
          <h4 style={{ color: "red" }}>Logout</h4>
        </div>
      </div>
    </div>
  );
};

export default Options;
