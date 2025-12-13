import React, { useContext } from "react";
import { FileText } from "lucide-react";
import Styles from "../Modules/ReplyPreviewBox.module.css";
import { ChatContext } from "../Context/ChatContext";
import { AuthContext } from "../Context/AuthContext";

export default function ReplyPreviewBox({ replyMessage }) {
  const { user } = useContext(AuthContext);
  const { setReplyToMessage, replyToMessage, receiverData } =
    useContext(ChatContext);
console.log(replyMessage);
  if (!replyMessage) return null;

  // 🔥 NORMALIZATION (THIS IS THE KEY)
  const sender = replyMessage.sender;
  if (!sender) return null;

  const senderName =
    sender._id === user?._id
      ? "You"
      : receiverData?.name || sender.name || "User";

  const { text, mediaType, mediaUrl, filename } = replyMessage;
  

  return (
    <div className={Styles.Box}>
      <div className={Styles.LeftBar} />

      <div className={Styles.Content}>
        <div className={Styles.Sender}>{senderName}</div>

        {/* Text */}
        {text && <div className={Styles.Text}>{text}</div>}

        {/* Image */}
        {mediaType === "image" && mediaUrl && (
          <img src={mediaUrl} className={Styles.ImageThumb} alt="reply" />
        )}

        {/* Video */}
        {mediaType === "video" && mediaUrl && (
          <video src={mediaUrl} className={Styles.VideoThumb} />
        )}

        {/* Audio */}
        {mediaType === "audio" && (
          <div className={Styles.MediaLabel}>🎵 Audio</div>
        )}

        {/* File */}
        {mediaType === "file" && (
          <div className={Styles.MediaLabel}>
            <FileText size={16} />
            {filename || "File"}
          </div>
        )}
      </div>

      {/* Close ONLY in input preview */}
      {replyToMessage && (
        <button
          className={Styles.CloseBtn}
          onClick={() => setReplyToMessage(null)}
        >
          ✖
        </button>
      )}
    </div>
  );
}
