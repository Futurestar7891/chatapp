import React, { useContext, useState } from "react";
import styles from "../Modules/PersonalInfo.module.css";
import { User, Mail, Phone, FileText, Edit2, Save, X } from "lucide-react";
import { AuthContext } from "../Context/AuthContext";

import {
  sendEmailUpdateOtp,
  verifyEmailUpdateOtp,
  updateProfileInfo,
} from "../utils/user";

import OtpPopUp from "../Screens/PublicScreens/OtpPopUp";

export default function PersonalInfo() {
  const { user, setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [loading,setLoading]=useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [errors, setErrors] = useState({});

  const [data, setData] = useState({
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    bio: user.bio || "Hare Krishna",
    currentPassword: "",
  });

  const [edit, setEdit] = useState({ ...data });

  /* ───────────────────────────────────────────────
      START SAVE
  ─────────────────────────────────────────────── */
  const startSave = async () => {
    setErrors({});

    if (!edit.currentPassword.trim()) {
      setErrors({ currentPassword: "Enter current password" });
      return;
    }

    setLoading(true);

    if (edit.email !== user.email && !emailVerified) {
      const r = await sendEmailUpdateOtp(edit.email);
      setLoading(false);
      if (r.success) {
        setShowOtp(true);
      } else {
        setErrors(r.errors);
      }
      return;
    }

    await finalizeUpdate();
    setLoading(false);
  };

  /* ───────────────────────────────────────────────
      FINAL UPDATE API
  ─────────────────────────────────────────────── */
  const finalizeUpdate = async () => {
    const response = await updateProfileInfo(edit);

    if (response.success) {
      setUser(response.user);
      setData({
        name: response.user.name,
        email: response.user.email,
        mobile: response.user.mobile,
        bio: response.user.bio || "Hare Krishna",
        currentPassword: "",
      });
      setEdit({...edit,currentPassword:""})
      setIsEditing(false);
      alert(response.message);
    } else if (response.errors) {
      setErrors(response.errors);
    } else {
      alert(response.message);
    }
  };

  /* ───────────────────────────────────────────────
      VERIFY OTP
  ─────────────────────────────────────────────── */
  const verifyOtp = async (otp) => {
    setLoading(true);
    setOtpError("");

    const response = await verifyEmailUpdateOtp(edit.email, otp);

    setLoading(false);

    if (response.success) {
      setEmailVerified(true);
      setShowOtp(false);
      alert(response.message);
      await finalizeUpdate();
    } else {
      setOtpError(response.message);
    }
  };

  /* ───────────────────────────────────────────────
      RESEND OTP
  ─────────────────────────────────────────────── */
  const resendOtp = () => sendEmailUpdateOtp(edit.email);

  const cancel = () => {
    setEdit({ ...data });
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className={styles.Container}>
      {showOtp && (
        <OtpPopUp
          onClose={() => {
            setShowOtp(false);
            setOtpError("");
          }}
          onVerify={verifyOtp}
          onResend={resendOtp}
          error={otpError}
          loading={loading}
        />
      )}
      <div className={styles.Header}>
        <h2 className={styles.Title}>Profile Information</h2>
        <p className={styles.Subtitle}>Manage your personal details</p>
      </div>

      <div className={styles.Card}>
        {/* CURRENT PASSWORD */}
        {isEditing && (
          <div className={styles.FieldGroup}>
            <label className={styles.Label}>
              <User size={18} /> Current Password
            </label>

            <input
              type="password"
              className={styles.Input}
              placeholder="Enter your password"
              value={edit.currentPassword}
              onChange={(e) =>
                setEdit({ ...edit, currentPassword: e.target.value })
              }
            />

            {errors.currentPassword && (
              <p className={styles.ErrorText}>{errors.currentPassword}</p>
            )}
          </div>
        )}

        {/* NAME */}
        <div className={styles.FieldGroup}>
          <label className={styles.Label}>
            <User size={18} /> Name
          </label>

          {!isEditing ? (
            <div className={styles.ValueBox}>{data.name}</div>
          ) : (
            <input
              className={styles.Input}
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          )}

          {errors.name && <p className={styles.ErrorText}>{errors.name}</p>}
        </div>

        {/* EMAIL */}
        <div className={styles.FieldGroup}>
          <label className={styles.Label}>
            <Mail size={18} /> Email
          </label>

          {!isEditing ? (
            <div className={styles.ValueBox}>{data.email}</div>
          ) : (
            <input
              className={styles.Input}
              value={edit.email}
              onChange={(e) => {
                setEmailVerified(false);
                setEdit({ ...edit, email: e.target.value });
              }}
            />
          )}

          {errors.email && <p className={styles.ErrorText}>{errors.email}</p>}
        </div>

        {/* MOBILE */}
        <div className={styles.FieldGroup}>
          <label className={styles.Label}>
            <Phone size={18} /> Mobile
          </label>

          <div className={styles.ValueBox}>{data.mobile}</div>

          {errors.mobile && <p className={styles.ErrorText}>{errors.mobile}</p>}
        </div>

        {/* BIO */}
        <div className={styles.FieldGroup}>
          <label className={styles.Label}>
            <FileText size={18} /> Bio
          </label>

          {!isEditing ? (
            <div className={styles.ValueBox}>{data.bio}</div>
          ) : (
            <textarea
              className={styles.TextArea}
              value={edit.bio}
              onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
            />
          )}

          {errors.bio && <p className={styles.ErrorText}>{errors.bio}</p>}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      {!isEditing ? (
        <button className={styles.EditBtn} onClick={() => setIsEditing(true)}>
          <Edit2 size={18} /> Edit Profile
        </button>
      ) : (
        <div className={styles.ActionRow}>
          <button className={styles.SaveBtn} onClick={startSave}>
            <Save size={18} /> {loading ? "Please Wait---" : "Save"}
          </button>
          <button className={styles.CancelBtn} onClick={cancel}>
            <X size={18} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}
