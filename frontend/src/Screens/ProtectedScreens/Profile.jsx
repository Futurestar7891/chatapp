import toast from "react-hot-toast";
import React, { useContext, useState } from "react";
import styles from "../../Modules/Profile.module.css";

import PersonalInfo from "../../Components/PersonalInfo";
import Security from "../../Components/Security";
import Privacy from "../../Components/Privacy";

import { User, Lock, Shield } from "lucide-react";
import { AuthContext } from "../../Context/AuthContext";

import {  updateAvatar } from "../../utils/user";
import { uploadFile } from "../../utils/message";

 function Profile() {
  const { user, setUser } = useContext(AuthContext);

  /* Extract initials */
 const initials = React.useMemo(() => {
   const nameParts = user.name.trim().split(" ");
   if (nameParts.length >= 2) return nameParts[0][0] + nameParts[1][0];
   return nameParts[0][0];
 }, [user.name]);

  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("activeTab") || "personalInfo"
  );

  const [avatarPreview, setAvatarPreview] = useState(null);

  /* -------------------------------------------------------
      Change Avatar → Cloudinary → Backend
  ------------------------------------------------------- */
  const handleAvatarChange = async (e) => {
    const toastId = toast.loading("please wait image updating ......");
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Cloudinary upload needs file (NOT FileList)
    const cloudUrl = await uploadFile(file);

    if (!cloudUrl) {
      alert("Avatar upload failed!");
      return;
    }

    // Save new avatar in backend
    const response = await updateAvatar(cloudUrl);

    if (response.success) {
      setUser(response.user);
      toast.success(response.message,{id:toastId});
    } else {
      toast.error(response.message,{id:toastId});
    }
    // Clean up the object URL when component unmounts or new file selected
    return () => URL.revokeObjectURL(previewUrl);
  };

  const tabs = [
    { id: "personalInfo", label: "Profile", icon: User },
    { id: "security", label: "Login & Security", icon: Lock },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <div className={styles.Container}>
      <div className={styles.Card}>
        {/* ---------- HEADER ---------- */}
        <div className={styles.Header}>
          <div className={styles.HeaderBlur1}></div>
          <div className={styles.HeaderBlur2}></div>

          <div className={styles.ProfileAvatarWrapper}>
            {/* Avatar Image Or Fallback Initials */}
            {avatarPreview || user.avatar ? (
              <img
                src={avatarPreview || user.avatar}
                className={styles.AvatarImage}
                alt="profile"
                loading="lazy"
              />
            ) : (
              <div className={styles.AvatarCircle}>{initials}</div>
            )}

            {/* Hidden Input */}
            <input
              type="file"
              id="avatarInput"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />

            {/* Camera Button */}
            <button
              className={styles.AvatarCameraBtn}
              onClick={() => document.getElementById("avatarInput").click()}
            >
              📷
            </button>
          </div>

          <h1 className={styles.ProfileName}>{user.name}</h1>
          <p className={styles.ProfileEmail}>{user.email}</p>
        </div>

        {/* ---------- TABS ---------- */}
        <div className={styles.TabBar}>
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`${styles.TabButton} ${
                  activeTab === t.id ? styles.ActiveTab : ""
                }`}
                onClick={() => {
                  sessionStorage.setItem("activeTab", t.id);
                  setActiveTab(t.id);
                }}
              >
                <Icon size={20} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---------- TAB CONTENT ---------- */}
        <div className={styles.Content}>
          {activeTab === "personalInfo" && <PersonalInfo />}
          {activeTab === "security" && <Security />}
          {activeTab === "privacy" && <Privacy />}
        </div>
      </div>
    </div>
  );
}
export default React.memo(Profile);