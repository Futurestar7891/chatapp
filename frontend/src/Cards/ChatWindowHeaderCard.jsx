import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import Styles from "../Modules/ChatWindowHeaderCard.module.css";
import { ChatContext } from "../Context/ChatContext";

function ChatWindowHeaderCard({ name, avatar, online, onBack }) {
  const{receiverData}=useContext(ChatContext);
  const navigate=useNavigate();
  const isImage = avatar && avatar.startsWith("http") && !receiverData?.blockedMe ;

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className={Styles.HeaderContainer}>
      {/* BACK BUTTON (ONLY MOBILE) */}
      <button className={Styles.BackBtn} onClick={onBack}>
        <ArrowLeft size={20} />
      </button>

      {/* AVATAR */}
      <div
        className={Styles.AvatarWrapper}
        onClick={() => navigate("/receiver-profile")}
      >
        {isImage ? (
          <img src={avatar} className={Styles.AvatarImage} alt="avatar" />
        ) : (
          <div className={Styles.AvatarInitials}>{getInitials(name)}</div>
        )}

        {online && !receiverData.blockedMe && (
          <span className={Styles.OnlineDot}></span>
        )}
      </div>

      {/* NAME + STATUS */}
      <div className={Styles.UserInfo}>
        <h2 className={Styles.Name}>{name}</h2>
        <p className={Styles.Status}>
          {online && !receiverData.blockedMe ? "Online" : "Offline"}
        </p>
      </div>

      {/* ACTION ICONS */}
      <div className={Styles.Actions}>
        <button className={Styles.IconBtn}>
          <Phone size={20} className={Styles.PhoneIcon} />
        </button>
        <button className={Styles.IconBtn}>
          <Video size={20} className={Styles.VideoIcon} />
        </button>
        <button className={Styles.IconBtn}>
          <MoreVertical size={20} className={Styles.MenuIcon} />
        </button>
      </div>
    </div>
  );
}

export default ChatWindowHeaderCard;
