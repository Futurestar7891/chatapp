import { useContext, useRef } from "react";
import Fetchchatlist from "./Fetchchatlist";
import Fetchmessages from "./Fetchmessages";
import PublicProfile from "./PublicProfile";
import { StateContext } from "../main";

function ChatApp({ socket }) {
  const { showpublicprofile, setShowPublicProfile } = useContext(StateContext);

  // Create a ref for the PublicProfile component
  const publicProfileRef = useRef(null);

  // Handle clicks outside the PublicProfile component
  const handleClickOutside = (event) => {
    // Check if the click is outside the PublicProfile component
    if (
      publicProfileRef.current &&
      !publicProfileRef.current.contains(event.target)
    ) {
      setShowPublicProfile(false); // Close the PublicProfile
    }
  };

  // Attach the event listener when the PublicProfile is shown
  if (showpublicprofile) {
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
      ) : (
        ""
      )}
      <Fetchchatlist socket={socket} />
      <Fetchmessages socket={socket} />
    </div>
  );
}

export default ChatApp;
