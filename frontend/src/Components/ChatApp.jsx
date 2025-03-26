import { useContext, useRef } from "react";
import Fetchchatlist from "./ChatListUsers/Fetchchatlist";
import Fetchmessages from "./userMessage/Fetchmessages";
import PublicProfile from "./userEdit/PublicProfile";
import { StateContext } from "../main";
import "../Css/Chatapp.css";
import PrivacySettings from "./userEdit/PrivacySettings";

function ChatApp({ socket }) {
  const { showpublicprofile,showPrivacy,setShowPrivacy, setShowPublicProfile,isMobile } = useContext(StateContext);

  // Create a ref for the PublicProfile component
  const publicProfileRef = useRef(null);
  const privacyRef=useRef(null);

  // Handle clicks outside the PublicProfile component
  const handleClickOutside = (event) => {
    // Check if the click is outside the PublicProfile component
    if (
      publicProfileRef.current &&
      !publicProfileRef.current.contains(event.target)
    ) {
      setShowPublicProfile(false); // Close the PublicProfile
    }
    if(privacyRef.current && !privacyRef.current.contains(event.target)){
      setShowPrivacy(false);
    }
  };

  // Attach the event listener when the PublicProfile is shown
  if (showpublicprofile || showPrivacy) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    // Remove the event listener when the PublicProfile is hidden
    document.removeEventListener("mousedown", handleClickOutside);
  }

  return (
    <div className="Chatappmaindiv">
      {showpublicprofile ? (
        <div ref={publicProfileRef}>
          <PublicProfile />
        </div>
      ) : showPrivacy ? (
        <div ref={privacyRef}>
          <PrivacySettings />
        </div>
      ) : (
        ""
      )}

      <Fetchchatlist socket={socket} />
      {!isMobile && <Fetchmessages socket={socket} />}
    </div>
  );
}

export default ChatApp;
