import React, { useContext } from "react";
import { FileText } from "lucide-react";
import Styles from "../Modules/ReplyPreviewBox.module.css";
import { ChatContext } from "../Context/ChatContext";
import { AuthContext } from "../Context/AuthContext";

export default function ReplyPreviewBox({ replyMessage}) {
  const {user}=useContext(AuthContext)
  const{setReplyToMessage,replyToMessage,receiverData}=useContext(ChatContext);
 let finalname;
  if(replyMessage.sender.name===user.name){
        finalname="you"
  }

  else{
    finalname=receiverData?.name;
  }
  

  return (
    <div className={Styles.Box}>
      <div className={Styles.LeftBar} />

      <div className={Styles.Content}>
        {/* Sender Name */}
        <div className={Styles.Sender}>{finalname}</div>

        {/* If replying to text */}
        {replyMessage.text && (
          <div className={Styles.Text}>{replyMessage.text}</div>
        )}

        {/* If replying to an image */}
        {replyMessage.mediaType === "image" && (
          <img src={replyMessage.mediaUrl} className={Styles.ImageThumb} />
        )}

        {/* If replying to a video */}
        {replyMessage.mediaType === "video" && (
          <video src={replyMessage.mediaUrl} className={Styles.VideoThumb} />
        )}

        {/* Audio */}
        {replyMessage.mediaType === "audio" && (
          <div className={Styles.MediaLabel}>🎵 Audio</div>
        )}

        {/* File */}
        {replyMessage.mediaType === "file" && (
          <div className={Styles.MediaLabel}>
            <FileText size={16} /> {replyMessage.filename || "File"}
          </div>
        )}
      </div>

      {/* Close Button */}
      {replyToMessage && (
        <button
          className={Styles.CloseBtn}
          onClick={() => setReplyToMessage(false)}
        >
          ✖
        </button>
      )}
    </div>
  );
}
