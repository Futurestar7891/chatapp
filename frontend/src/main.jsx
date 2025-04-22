import { useState, createContext, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

export const StateContext = createContext();

export const StateProvider = ({ children }) => {
  const getInitialState = (key, defaultValue) => {
    const storedData = sessionStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  };

  const [selectedUser, setSelectedUser] = useState(() =>
    getInitialState("selectedUser", {})
  );
  const [showuserpublicprofiledata, setShowUserPublicProfileData] = useState(
    () => getInitialState("showuserpublicprofiledata", {})
  );
  const [showpublicprofile, setShowPublicProfile] = useState(false);
  const [showbar, setShowbar] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isInContactList, setIsInContactList] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    sessionStorage.setItem("selectedUser", JSON.stringify(selectedUser));
  }, [selectedUser]);

  useEffect(() => {
    sessionStorage.setItem(
      "showuserpublicprofiledata",
      JSON.stringify(showuserpublicprofiledata)
    );
  }, [showuserpublicprofiledata]);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

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
      isInContactList,
      setIsInContactList,
      showPrivacy,
      setShowPrivacy,
      isMobile,
      setIsMobile,
    }),
    [
      selectedUser,
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
      isBlocked,
      isInContactList,
      showPrivacy,
      isMobile,
    ]
  );

  return (
    <StateContext.Provider value={stateobj}>{children}</StateContext.Provider>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(
  <StateProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StateProvider>
);

if (import.meta.hot) {
  import.meta.hot.accept();
}
