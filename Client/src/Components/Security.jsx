import React, { useState } from "react";
import styles from "../Modules/Security.module.css";
import { Lock, Eye, EyeOff } from "lucide-react";
import { changePassword } from "../utils/user";

export default function Security() {
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [form, setForm] = useState({
    currentpassword: "",
    newpassword: "",
    confirmpassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setErrors({});
    setLoading(true);

    const res = await changePassword(form);
    setLoading(false);

    if (res.success) {
      alert(res.message);
      setForm({
        currentpassword: "",
        newpassword: "",
        confirmpassword: "",
      });
    } else if (res.errors) {
      setErrors(res.errors);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <h2 className={styles.Title}>Login & Security</h2>
        <p className={styles.Subtitle}>Keep your account secure</p>
      </div>

      <div className={styles.Card}>
        <div className={styles.CardHeader}>
          <div className={styles.IconBox}>
            <Lock size={24} className={styles.Icon} />
          </div>
          <div>
            <h3 className={styles.CardTitle}>Change Password</h3>
            <p className={styles.CardDesc}>Update your password regularly</p>
          </div>
        </div>

        {/* CURRENT PASSWORD */}
        <div className={styles.FieldGroup}>
          <label className={styles.Label}>Current Password</label>

          <div className={styles.InputWrapper}>
            <input
              type={show.current ? "text" : "password"}
              className={styles.Input}
              placeholder="Enter current password"
              value={form.currentpassword}
              onChange={(e) =>
                setForm({ ...form, currentpassword: e.target.value })
              }
            />

            <button
              type="button"
              onClick={() =>
                setShow((prev) => ({ ...prev, current: !prev.current }))
              }
              className={styles.ShowBtn}
            >
              {show.current ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {errors.currentpassword && (
            <p className={styles.ErrorText}>{errors.currentpassword}</p>
          )}
        </div>

        {/* NEW PASSWORD */}
        <div className={styles.FieldGroup}>
          <label className={styles.Label}>New Password</label>

          <div className={styles.InputWrapper}>
            <input
              type={show.new ? "text" : "password"}
              className={styles.Input}
              placeholder="Enter new password"
              value={form.newpassword}
              onChange={(e) =>
                setForm({ ...form, newpassword: e.target.value })
              }
            />

            <button
              type="button"
              onClick={() => setShow((prev) => ({ ...prev, new: !prev.new }))}
              className={styles.ShowBtn}
            >
              {show.new ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {errors.newpassword && (
            <p className={styles.ErrorText}>{errors.newpassword}</p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div className={styles.FieldGroup}>
          <label className={styles.Label}>Confirm New Password</label>

          <div className={styles.InputWrapper}>
            <input
              type={show.confirm ? "text" : "password"}
              className={styles.Input}
              placeholder="Confirm new password"
              value={form.confirmpassword}
              onChange={(e) =>
                setForm({ ...form, confirmpassword: e.target.value })
              }
            />

            <button
              type="button"
              onClick={() =>
                setShow((prev) => ({ ...prev, confirm: !prev.confirm }))
              }
              className={styles.ShowBtn}
            >
              {show.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {errors.confirmpassword && (
            <p className={styles.ErrorText}>{errors.confirmpassword}</p>
          )}
        </div>

        <button
          className={styles.UpdateBtn}
          disabled={loading}
          onClick={handleUpdate}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
