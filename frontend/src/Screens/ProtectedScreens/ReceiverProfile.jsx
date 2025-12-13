import toast from "react-hot-toast";
import React, { useContext, useState } from "react";
import Styles from "../../Modules/ReceiverProfile.module.css";
import {
  UserPlus,
  MessageSquare,
  Phone,
  Video,
  Image as ImageIcon,
  Lock,
  Unlock,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { AuthContext } from "../../Context/AuthContext";
import { ChatContext } from "../../Context/ChatContext";
import { updateUserSettings } from "../../utils/user";
import { useNavigate } from "react-router-dom";

function ReceiverProfile() {
  const navigate = useNavigate();

  const { setSettings, computeRelationship } = useContext(AuthContext);
  const { receiverData, receiverId, setReceiverData, setChatList } =
    useContext(ChatContext);

  const rel = computeRelationship(receiverId);

  const [isEditingName, setIsEditingName] = useState(false);
  const [contactName, setContactName] = useState(receiverData?.name);

  const [loading, setLoading] = useState(false);

  const getInitials = React.useCallback((name) => {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  }, []);

  const handleBack = () => navigate("/", { replace: true });

  // ⭐ BLOCK / UNBLOCK TOGGLE
  const handleBlockToggle = async () => {
    setLoading(true);

    const res = await updateUserSettings({ receiverId });

    setLoading(false);

    if (res.success) {
      setSettings(res.settings); // update global settings
      if (res.action === "blocked") toast.success("user is blocked");
      if (res.action === "unblocked") toast.success("user is unblocked");
    }
  };

  // ⭐ SAVE CONTACT
  const handleSaveContact = async () => {
    if (!contactName.trim()) return;

    setLoading(true);

    const res = await updateUserSettings({
      receiverId,
      savedName: contactName.trim(),
    });

    setLoading(false);

    if (res.success) {
      setReceiverData((prev) => ({
        ...prev,
        name: contactName,
      }));

      setSettings(res.settings);
      if (res.chatlist) {
        
        setChatList(res.chatlist);
      }
      setIsEditingName(false);

      if (res.action === "contact_added") toast.success("Contact is Saved");
      if (res.action === "contact_updated") toast.success("Contact is Updated");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className={Styles.Container}>
      <div className={Styles.Page}>
        {/* HEADER */}
        <div className={Styles.Header}>
          <button onClick={handleBack} className={Styles.BackBtn}>
            <ArrowLeft size={24} color="#333" />
          </button>

          <h2 className={Styles.Title}>Profile</h2>

          {!isEditingName && receiverData.isContact ? (
            <button
              className={Styles.EditContactBtn}
              onClick={() => setIsEditingName(true)}
            >
              <Pencil size={20} color="#4f46e5" />
            </button>
          ) : (
            <button
              className={Styles.AddContactBtn}
              onClick={() => setIsEditingName(true)}
            >
              <UserPlus size={22} color="#4f46e5" />
            </button>
          )}
        </div>

        {/* CARD */}
        <div className={Styles.Card}>
          {/* PHOTO */}
          <div className={Styles.PhotoWrapper}>
            {receiverData?.avatar && !rel.blockedMe ? (
              <img
                src={receiverData.avatar}
                loading="lazy"
                className={Styles.ProfilePhoto}
                alt="user"
              />
            ) : (
              <div className={Styles.initialsCircle}>
                {getInitials(receiverData?.name)}
              </div>
            )}

            <div
              className={`${Styles.StatusIndicator} ${
                rel.blockedByMe ? Styles.StatusBlocked : Styles.StatusOnline
              }`}
            />
          </div>

          <div className={Styles.ContentPadding}>
            {/* NAME SECTION / EDIT */}
            {!isEditingName ? (
              <div className={Styles.NameSection}>
                <h1 className={Styles.UserName}>{receiverData?.name}</h1>
                <p className={Styles.UserHandle}>{receiverData?.email}</p>
              </div>
            ) : (
              <div className={Styles.EditNameBox}>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className={Styles.EditInput}
                  placeholder="Enter saved name"
                />

                <div className={Styles.EditBtnsRow}>
                  <button
                    className={Styles.SaveBtn}
                    onClick={handleSaveContact}
                  >
                    {receiverData.isContact ? "Update" : "Save"}
                  </button>

                  <button
                    className={Styles.CancelBtn}
                    onClick={() => {
                      setIsEditingName(false);
                      setContactName(receiverData?.name);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* BLOCK BUTTON */}
            <div className={Styles.BtnCenter}>
              <button
                onClick={handleBlockToggle}
                className={
                  rel.blockedByMe ? Styles.UnblockBtn : Styles.BlockBtn
                }
              >
                {rel.blockedByMe ? (
                  <>
                    <Unlock size={20} />
                    <span>{loading ? "Please Wait..." : "Unblock User"}</span>
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>{loading ? "Please Wait..." : "Block User"}</span>
                  </>
                )}
              </button>
            </div>

            {/* ACTION BUTTONS */}
            <div className={Styles.ActionsWrapper}>
              <div className={Styles.ActionsGrid}>
                {[
                  {
                    icon: MessageSquare,
                    label: "Message",
                    style: Styles.ChipMessage,
                  },
                  { icon: Phone, label: "Call", style: Styles.ChipCall },
                  { icon: Video, label: "Video", style: Styles.ChipVideo },
                  { icon: ImageIcon, label: "Media", style: Styles.ChipMedia },
                ].map(({ icon: Icon, label, style }, i) => (
                  <button
                    key={i}
                    disabled={rel.blockedByMe || rel.blockedMe || loading}
                    onClick={() =>
                      label !== "Message"?
                      toast.error("This functionality is not open"):navigate("/")
                    }
                    className={`${Styles.ActionChip} ${
                      rel.blockedByMe ? Styles.ChipDisabled : style
                    }`}
                  >
                    <Icon size={24} className={Styles.ChipIcon} />
                    <span className={Styles.ChipLabel}>{label}</span>
                  </button>
                ))}
              </div>

              {rel.blockedByMe && (
                <div className={Styles.BlockedMessage}>
                  <p className={Styles.BlockedText}>
                    🚫 You have blocked this user
                  </p>
                </div>
              )}
            </div>

            {/* BIO */}
            <div className={Styles.BioCard}>
              <h3 className={Styles.BioTitle}>About</h3>
              <p className={Styles.BioText}>{receiverData?.bio}</p>
            </div>

            {/* DETAILS */}
            <div className={Styles.DetailsGrid}>
              <div className={Styles.DetailCard}>
                <p className={Styles.DetailLabel}>Email</p>
                <p className={Styles.DetailValue}>{receiverData?.email}</p>
              </div>

              <div className={Styles.DetailCard}>
                <p className={Styles.DetailLabel}>Mobile</p>
                <p className={Styles.DetailValue}>{receiverData?.mobile}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ReceiverProfile);
