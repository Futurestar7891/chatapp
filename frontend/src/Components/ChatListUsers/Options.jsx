import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StateContext } from "../../main";
import axios from "axios"; // Make sure to import axios
import "../../Css/Options.css";

const Options = ({ socket }) => {
  const {
    setShowPublicProfile,
    showbar,
    setShowbar,
    setShowUserPublicProfileData,
    isMobile
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
    const response = await axios.post(
      `${import.meta.env.VITE_PUBLIC_API_URL}/api/logout`,
      {}, // No body needed, empty object
      {
        withCredentials: true, // Equivalent to credentials: "include"
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    const data=response.data;
    // Axios resolves with response.data when successful
    // No need to check response.ok as Axios throws for non-2xx responses
    // Remove the token from local storage
    if(data.success){
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
    }
    else{
      console.log(data);
    }
 
  } catch (error) {
    // Axios error handling
    if (error.response) {
      // Server responded with a status outside 2xx
      console.error("Failed to logout:", error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error("Logout error: No response received", error.request);
    } else {
      // Error setting up the request
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
            if(isMobile){
            navigate("/public-profile");
            setShowUserPublicProfileData(SenderDetail);
            }
            else{
              setShowUserPublicProfileData(SenderDetail);
               setShowPublicProfile(true);
               setShowbar(!showbar);
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
        <div
          onClick={() => {
            setShowUserPublicProfileData({})
            navigate("/add-contact")}}
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
