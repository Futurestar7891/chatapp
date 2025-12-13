import toast from "react-hot-toast";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import Styles from "../Modules/ChatWindowHeaderCard.module.css";
import { ChatContext } from "../Context/ChatContext";
import { AuthContext } from "../Context/AuthContext";

function ChatWindowHeaderCard() {
  const navigate = useNavigate();
  const { receiverData,setReceiverData,setReceiverId} = useContext(ChatContext);
  const { userStatus } = useContext(AuthContext);
 

  const avatar = receiverData?.avatar;

  // Show avatar only if not blocked by them
  const isImage = avatar && avatar.startsWith("http") && !userStatus.blockedMe;

  const nameToShow =  receiverData?.name || "";

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Open profile only if not blocked
  const handleProfileClick = () => {
    navigate("/receiver-profile");
  };

  // 🔥 Real online/offline status logic

  return (
    <div className={Styles.HeaderContainer}>
      {/* BACK BUTTON (MOBILE) */}
      <button
        className={Styles.BackBtn}
        onClick={() => {
          setReceiverData({});
          setReceiverId("");
          sessionStorage.removeItem("receiverId");
          sessionStorage.removeItem("receiverData");
        }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* AVATAR */}
      <div
        className={Styles.AvatarWrapper}
        onClick={handleProfileClick}
        style={{ cursor: "pointer" }}
      >
        {isImage ? (
          <img src={avatar} className={Styles.AvatarImage} alt="avatar" />
        ) : (
          <div className={Styles.AvatarInitials}>{getInitials(nameToShow)}</div>
        )}

        {/* ONLINE DOT — only if not blocked */}
        {userStatus.show && userStatus.isOnline && (
          <span className={Styles.OnlineDot}></span>
        )}
      </div>

      {/* NAME + STATUS */}
      <div className={Styles.UserInfo}>
        <h2 className={Styles.Name}>{nameToShow}</h2>

        {/* STATUS LOGIC */}
        <p className={Styles.Status}>
          {!userStatus.show ? "" : userStatus.isOnline ? "Online" : "Offline"}
        </p>
      </div>

      {/* ACTION ICONS */}
      <div className={Styles.Actions}>
        <button
          className={Styles.IconBtn}
          disabled={userStatus.blockedMe || userStatus.blockedByMe}
          style={{
            cursor:
              userStatus.blockedMe || userStatus.blockedByMe
                ? "not-allowed"
                : "pointer",
          }}
          onClick={() => toast.error("This fucntionality is not Open")}
        >
          <Phone size={20} className={Styles.PhoneIcon} />
        </button>

        <button
          className={Styles.IconBtn}
          disabled={userStatus.blockedMe || userStatus.blockedByMe}
          style={{
            cursor:
              userStatus.blockedMe || userStatus.blockedByMe
                ? "not-allowed"
                : "pointer",
          }}
          onClick={() => toast.error("This fucntionality is not Open")}
        >
          <Video size={20} className={Styles.VideoIcon} />
        </button>

        <button
          className={Styles.IconBtn}
          style={{
            cursor:
              userStatus.blockedMe || userStatus.blockedByMe
                ? "not-allowed"
                : "pointer",
          }}
          onClick={() => toast.error("This fucntionality is not Open")}
        >
          <MoreVertical size={20} className={Styles.MenuIcon} />
        </button>
      </div>
    </div>
  );
}

export default React.memo(ChatWindowHeaderCard);
