import React, { useState } from "react";
import styles from "../Modules/Privacy.module.css";
import { Shield, X } from "lucide-react";

export default function Privacy() {
  const [privacy, setPrivacy] = useState({
    statusVisibility: "contacts",
  });

  const [blocked] = useState(["user1@example.com", "user2@example.com"]);

  const options = [
    { value: "onlyme", label: "Only Me ", desc: "Your status is private." },
    { value: "contacts", label: "Contacts ", desc: "Only your saved contacts." },
    { value: "anyone", label: "Anyone ", desc: "Everyone can see your status." },
  ];

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
                checked={privacy.statusVisibility === opt.value}
                onChange={() =>
                  setPrivacy({ ...privacy, statusVisibility: opt.value })
                }
              />
              <div className={styles.OptionText}>
                <span className={styles.OptionLabel}>{opt.label}</span>
                <span className={styles.OptionDesc}>{opt.desc}</span>
              </div>
            </label>
          ))}
        </div>

        <button className={styles.SaveBtn}>Save Changes</button>
      </div>

      {/* BLOCKED USERS */}
      <div className={styles.Card}>
        <div className={styles.CardHeader}>
          <div className={styles.BlockIconBox}>
            <X size={20} className={styles.BlockIcon} />
          </div>
          <div>
            <h3 className={styles.CardTitle}>Blocked Users</h3>
            <p className={styles.CardDesc}>{blocked.length} users blocked</p>
          </div>
        </div>

        {blocked.map((u, i) => (
          <div key={i} className={styles.BlockItem}>
            <div className={styles.BlockUser}>
              <div className={styles.BlockAvatar}>{u[0].toUpperCase()}</div>
              <span>{u}</span>
            </div>

            <button className={styles.UnblockBtn}>Unblock</button>
          </div>
        ))}
      </div>
    </div>
  );
}
