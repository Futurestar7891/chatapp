import toast from "react-hot-toast"
import React, { useContext } from "react";
import styles from "../Modules/Privacy.module.css";
import { Shield, X } from "lucide-react";
import { AuthContext } from "../Context/AuthContext";
import { updateUserSettings } from "../utils/user";

function Privacy() {
  const { settings, setSettings } = useContext(AuthContext);

  const options = [
    { value: "onlyme", label: "Only Me", desc: "Your status is private." },
    {
      value: "contacts",
      label: "Contacts",
      desc: "Only your saved contacts.",
    },
    {
      value: "anyone",
      label: "Anyone",
      desc: "Everyone can see your status.",
    },
  ];

  // ⭐ Update privacy
  const handleSave = async () => {
    const res = await updateUserSettings({
      statusVisibility: settings.statusVisibility,
    });

    if (res.success) {
      setSettings(res.settings); // update global state
      toast.success("Privacy updated");
    }
  };

  // ⭐ Unblock a user (NEW unified backend logic)
  const handleUnblock = async (id) => {
    const res = await updateUserSettings({ receiverId: id });

    if (res.success) {
      setSettings(res.settings);
      if(res.action==="unblocked") toast.success("User is Unblocked")
    }
  else{
    toast.error(res.message);
  }
  };

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <h2 className={styles.Title}>Privacy Settings</h2>
        <p className={styles.Subtitle}>Control who sees your information</p>
      </div>

      {/* STATUS CARD */}
      <div className={styles.Card}>
        <div className={styles.CardHeader}>
          <div className={styles.IconBox}>
            <Shield size={22} className={styles.Icon} />
          </div>
          <div>
            <h3 className={styles.CardTitle}>Who can see my status</h3>
            <p className={styles.CardDesc}>Choose your visibility</p>
          </div>
        </div>

        <div className={styles.OptionList}>
          {options.map((opt) => (
            <label key={opt.value} className={styles.OptionItem}>
              <input
                type="radio"
                checked={settings.statusVisibility === opt.value}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    statusVisibility: opt.value,
                  }))
                }
              />

              <div className={styles.OptionText}>
                <span className={styles.OptionLabel}>{opt.label}</span>
                <span className={styles.OptionDesc}>{opt.desc}</span>
              </div>
            </label>
          ))}
        </div>

        <button className={styles.SaveBtn} onClick={handleSave}>
          Save Changes
        </button>
      </div>

      {/* BLOCKED USERS */}
      <div className={styles.Card}>
        <div className={styles.CardHeader}>
          <div className={styles.BlockIconBox}>
            <X size={20} className={styles.BlockIcon} />
          </div>
          <div>
            <h3 className={styles.CardTitle}>Blocked Users</h3>
            <p className={styles.CardDesc}>
              {settings.blockedUsers.length} users blocked
            </p>
          </div>
        </div>

        {settings.blockedUsers.length === 0 ? (
          <p className={styles.EmptyText}>No blocked users</p>
        ) : (
          settings.blockedUsers.map((user) => (
            <div key={user._id} className={styles.BlockItem}>
              <div className={styles.BlockUser}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={styles.BlockAvatarImage}
                  />
                ) : (
                  <div className={styles.initialsCircle}>
                    {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
                  </div>
                )}

                <div className={styles.BlockUserText}>
                  <span className={styles.BlockUserName}>{user.name}</span>
                  <span className={styles.BlockUserEmail}>{user.email}</span>
                </div>
              </div>

              <button
                className={styles.UnblockBtn}
                onClick={() => handleUnblock(user._id)}
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
export default React.memo(Privacy);