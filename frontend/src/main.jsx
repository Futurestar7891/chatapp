import { useState, createContext, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

export const StateContext = createContext();

export const StateProvider = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState({});
  const [showpublicprofile, setShowPublicProfile] = useState(false);
  const [showbar, setShowbar] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false); // Global block state
  
  const [showuserpublicprofiledata, setShowUserPublicProfileData] = useState(
    {}
  );

  const stateobj = useMemo(
    () => ({
      selectedUser,
      setSelectedUser,
      showpublicprofile,
      setShowPublicProfile,
      showbar,
      setShowbar,
      showuserpublicprofiledata,
      setShowUserPublicProfileData,
      showOtpPopup,
      setShowOtpPopup,
      showAttachmentPopup,
      setShowAttachmentPopup,
      showPreviewPopup,
      setShowPreviewPopup,
      showAudioRecorder,
      setShowAudioRecorder,
      selectedFiles,
      setSelectedFiles,
      messageInput,
      setMessageInput,
      messages,
      setMessages,
      isBlocked,
      setIsBlocked,
     
    }),
    [
      showpublicprofile,
      showbar,
      showuserpublicprofiledata,
      showOtpPopup,
      showAttachmentPopup,
      showPreviewPopup,
      showAudioRecorder,
      selectedFiles,
      messageInput,
      messages,
      selectedUser,
      isBlocked,
      
    ]
  );

  return (
    <StateContext.Provider value={stateobj}>{children}</StateContext.Provider>
  );
};

// Create root once and store it
const root = createRoot(document.getElementById("root"));

// Initial render
root.render(
  <StateProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StateProvider>
);

// Optional: Handle HMR if using a dev server
if (import.meta.hot) {
  import.meta.hot.accept();
}
