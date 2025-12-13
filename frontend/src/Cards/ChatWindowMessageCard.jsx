import toast from "react-hot-toast"
import React, { useContext, useState ,useRef} from "react";
import Styles from "../Modules/ChatWindowMessageCard.module.css";
import { AuthContext } from "../Context/AuthContext";
import { FileText, Download, ChevronDown } from "lucide-react";

import MessageActionsPopup from "./MessageActionsPopUp";
import MessageInfo from "../Components/MessageInfo";
import ReplyPreviewBox from "./ReplyPreviewBox";

import { getMessageActions } from "../utils/messageActions";
import {
  copyText,
  saveMedia,
  deleteForEveryone,
  deleteForMe,
  
} from "../utils/messageActions";

import { ChatContext } from "../Context/ChatContext";

export default function ChatWindowMessageCard({ data }) {

  const arrowRef = useRef(null);

  const { user } = useContext(AuthContext);
  const { setReplyToMessage } = useContext(ChatContext);

  const isSender = data.sender._id === user._id;

  const [showMessageInfo, setShowMessageInfo] = useState(false);
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

  const handleAction = async (key, message) => {
    switch (key) {
      case "copy":
        await copyText(message);
        break;

      case "save":
        saveMedia(message.mediaUrl);
        break;

      case "deleteForMe":
        deleteForMe(message._id);
        break;

      case "deleteForEveryone":
        deleteForEveryone(message._id);
        break;

      case "info":
        setShowMessageInfo(true);
        break;

      case "forward":
        toast.error("This Fucntionality not Open")
        break;

      case "reply":
        setReplyToMessage(message);
        break;

      default:
        console.log("Unknown action:", key);
    }
  };

  const actions = getMessageActions({ message: data, isSender });

  // ⭐ MEDIA MESSAGE BUBBLE
  const renderMedia = () => {
    if (!data.mediaType) return null;

    return (
      <div className={Styles.BubbleWrapper}>
        {/* Reply Preview */}
        {data.replyTo && <ReplyPreviewBox replyToMessage={data.replyTo} />}

        {/* Options Button */}
        <button
        ref={arrowRef}
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

        {/* TICKS */}
        {isSender && <div className={Styles.TickPosition}>{renderTicks()}</div>}

        {/* Popup */}
        {showOptions && (
          <MessageActionsPopup
            message={data}
            isSender={isSender}
            actions={actions}
            onSelect={(key) => {
              setShowOptions(false);
              handleAction(key, data);
            }}
            onClose={() => setShowOptions(false)}
          />
        )}

        {/* Message Info */}
        {showMessageInfo && (
          <MessageInfo
            message={data}
            onClose={() => setShowMessageInfo(false)}
          />
        )}
      </div>
    );
  };

  // ⭐ MAIN RETURN
  return (
    <div
      className={`${Styles.MessageRow} ${
        isSender ? Styles.Right : Styles.Left
      }`}
    >
      {/* MEDIA MESSAGE */}
      {renderMedia()}

      {/* TEXT MESSAGE */}
      {data.text && !data.mediaType && (
        <div
          className={`${Styles.TextBubble} ${
            isSender ? Styles.Sent : Styles.Received
          }`}
        >
          {/* Reply Preview */}
          {data.replyTo && <ReplyPreviewBox replyMessage={data.replyTo} />}

          {/* Actual Text */}
          {data.text}

          {/* Options Button */}
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
              message={data}
              actions={actions}
              onSelect={(key) => {
                setShowOptions(false);
                handleAction(key, data);
              }}
              onClose={() => setShowOptions(false)}
              ignoreRef={arrowRef}
            />
          )}

          {/* Message Info */}
          {showMessageInfo && (
            <MessageInfo
              message={data}
              onClose={() => setShowMessageInfo(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
