import React, { useState } from "react";
import {
  Send,
  Camera,
  Paperclip,
  FileText,
  Video,
  Image as ImageIcon,
  Mic,
  AudioLines, // 🔥 audio icon (you forgot this import earlier!)
} from "lucide-react";

import AttachmentPreviewCard from "./AttachmentPreviewCard";
import Styles from "../Modules/ChatWindowInputCard.module.css";
import openCamera from "../utils/openCamera"

function ChatWindowInputCard({
  value,
  onChange,
  onSendMessage,
  selectedFiles,
  setSelectedFiles,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const addFiles = (files) => {
    const arr = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...arr]);

    if (selectedFiles.length === 0) setActiveIndex(0);

    setShowMenu(false);
  };

  const handleSend = () => {
    if (value.trim() || selectedFiles.length > 0) {
      onSendMessage();
    }
  };

  const handleOpenCamera = async () => {
    try {
      const file = await openCamera();
      setSelectedFiles((prev) => [...prev, file]);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        alert("Camera permission denied. Please allow camera access.");
      } else {
        console.error("Camera error:", err);
      }
    }
  };


  return (
    <>
      {/* ⭐ Attachment Preview */}
      {selectedFiles.length > 0 && (
        <AttachmentPreviewCard
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
      )}

      {/* ⭐ INPUT BAR */}
      <div className={Styles.InputContainer}>
        {/* ATTACH MENU */}
        <div className={Styles.RelativeWrapper}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={Styles.IconBtn}
          >
            <Paperclip size={22} className={Styles.IconGray} />
          </button>

          {showMenu && (
            <div className={Styles.AttachMenu}>
              {/* DOCUMENT */}
              <label className={Styles.MenuItem}>
                <FileText size={18} className={Styles.DocIcon} />
                Document
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>

              {/* VIDEO */}
              <label className={Styles.MenuItem}>
                <Video size={18} className={Styles.VideoIcon} />
                Video
                <input
                  type="file"
                  hidden
                  multiple
                  accept="video/*"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>

              {/* IMAGE */}
              <label className={Styles.MenuItem}>
                <ImageIcon size={18} className={Styles.ImageIcon} />
                Image
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>

              {/* AUDIO */}
              <label className={Styles.MenuItem}>
                <AudioLines size={18} className={Styles.ImageIcon} />
                Audio
                <input
                  type="file"
                  hidden
                  multiple
                  accept="audio/*"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            </div>
          )}
        </div>

        {/* CAMERA BUTTON */}
        <button className={Styles.IconBtn} onClick={handleOpenCamera}>
          <Camera size={22} className={Styles.CameraIcon} />
        </button>

        {/* INPUT FIELD */}
        <input
          className={Styles.InputBox}
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        {/* SEND BUTTON */}
        <button
          className={Styles.SendBtn}
          disabled={!value.trim() && selectedFiles.length === 0}
          onClick={handleSend}
        >
          <Send size={20} />
        </button>
      </div>
    </>
  );
}

export default ChatWindowInputCard;
