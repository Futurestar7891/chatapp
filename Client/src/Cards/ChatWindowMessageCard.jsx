import React, { useContext, useState } from "react";
import Styles from "../Modules/ChatWindowMessageCard.module.css";
import { AuthContext } from "../Context/AuthContext";
import { FileText, Download, ChevronDown } from "lucide-react";
import MessageActionsPopup from "./MessageActionsPopUp";
import { getMessageActions } from "../utils/messageActions";

export default function ChatWindowMessageCard({ data }) {
  const { user } = useContext(AuthContext);
  const isSender = data.sender === user._id;

  const [showOptions, setShowOptions] = useState(false);

  const fileName =
    data.filename ||
    data.originalName ||
    data.mediaUrl?.split("/")?.pop() ||
    "File";

  const renderTicks = () => {
    if (!isSender) return null;
    if (data.seenAt) return <span className={Styles.TickBlue}>✔✔</span>;
    if (data.deliveredAt) return <span className={Styles.TickGray}>✔✔</span>;
    return <span className={Styles.TickGray}>✔</span>;
  };

  const actions = getMessageActions({ message: data, isSender });

  const renderMedia = () => {
    if (!data.mediaType) return null;

    return (
      <div className={Styles.BubbleWrapper}>
        {/* ↓ More Options Button */}
        <button
          className={`${Styles.MoreBtn} ${
            isSender ? Styles.rightarrow : Styles.leftarrow
          }`}
          onClick={() => setShowOptions((prev) => !prev)}
        >
          <ChevronDown size={16} />
        </button>

        {/* MEDIA TYPE HANDLING */}
        {data.mediaType === "image" && (
          <img src={data.mediaUrl} className={Styles.ImageBubble} />
        )}

        {data.mediaType === "video" && (
          <video src={data.mediaUrl} controls className={Styles.VideoBubble} />
        )}

        {data.mediaType === "audio" && (
          <audio controls className={Styles.AudioBubble}>
            <source src={data.mediaUrl} type="audio/webm" />
          </audio>
        )}

        {data.mediaType === "file" && (
          <div className={Styles.DocumentBubble}>
            <FileText size={32} className={Styles.DocIcon} />
            <div className={Styles.DocumentInfo}>
              <span className={Styles.DocName}>{fileName}</span>
              <a
                href={data.mediaUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={Styles.DownloadBtn}
              >
                <Download size={20} />
              </a>
            </div>
          </div>
        )}

        {/* FILENAME BELOW MEDIA */}
        {data.mediaType !== "file" && (
          <div className={Styles.FileName}>{fileName}</div>
        )}

        {isSender && <div className={Styles.TickPosition}>{renderTicks()}</div>}

        {/* POPUP */}
        {showOptions && (
          <MessageActionsPopup
            actions={actions}
            onSelect={(action) => {
              setShowOptions(false);
              console.log("Selected:", action);
            }}
            onClose={() => setShowOptions(false)}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className={`${Styles.MessageRow} ${
        isSender ? Styles.Right : Styles.Left
      }`}
    >
      {/* MEDIA */}
      {renderMedia()}

      {/* TEXT MESSAGE */}
      {data.text && !data.mediaType && (
        <div
          className={`${Styles.TextBubble} ${
            isSender ? Styles.Sent : Styles.Received
          }`}
        >
          {/* Text */}
          {data.text}

          {/* More button */}
          <button
            className={`${Styles.MoreBtn} ${
              isSender ? Styles.rightarrow : Styles.leftarrow
            }`}
            onClick={() => setShowOptions((prev) => !prev)}
          >
            <ChevronDown size={16} />
          </button>
          {/* Ticks */}
          {isSender && (
            <div className={Styles.TickPosition}>{renderTicks()}</div>
          )}

          {/* Popup */}
          {showOptions && (
            <MessageActionsPopup
              isSender={isSender}
              actions={actions}
              onSelect={(action) => {
                setShowOptions(false);
                console.log("Selected:", action);
              }}
              onClose={() => setShowOptions(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
