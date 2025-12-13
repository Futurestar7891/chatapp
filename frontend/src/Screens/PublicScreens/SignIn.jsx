import toast from "react-hot-toast";
import React, { useState, useContext } from "react";
import Loginsignup from "../../assets/Loginsignup.webp";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";

import Styles from "../../Modules/SignIn.module.css";
import {
  forgotPasswordOtp,
  signIn,
  verifyForgotPasswordOtp,
} from "../../utils/user";
import OtpPopUp from "./OtpPopUp";

function SignIn() {
  const navigate = useNavigate();
  const { setIsLoggedIn, setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
      general: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    setLoading(true);
    const response = await signIn(formData.emailOrMobile, formData.password);
    setLoading(false);

    if (!response.success) {
      if (response.errors) setErrors(response.errors);
      else setErrors({ general: response.message });
      return;
    }

    setUser(response.user);
    setIsLoggedIn(true);
    toast.success(response.message);
  };

  const handleForgot = async () => {
    setErrors({});
    setLoading(true);
    const response = await forgotPasswordOtp(formData.emailOrMobile);
    setLoading(false);

    if (!response.success) {
      if (response.errors) setErrors(response.errors);
      else setErrors({ general: response.message });
      toast.error(response.message);
      return;
    }

    setShowOtpPopup(true);
    toast.success(response.message);
  };

  const verifyForgotOtp = async (otp) => {
    setOtpError("");
    setLoading(true);

    const response = await verifyForgotPasswordOtp(formData.emailOrMobile, otp);

    setLoading(false);

    if (!response.success) {
      setOtpError(response.message);
      toast.error(response.message);
      return;
    }
    toast.success(response.message);
    navigate("/reset-password");
  };

  return (
    <div className={Styles.page}>
      <div className={Styles.grid}>
        <div className={Styles.imageWrapper}>
          <img
            src={Loginsignup}
            loading="lazy"
            className={Styles.image}
            alt="signin"
          />
        </div>

        <div className={Styles.card}>
          <h2 className={Styles.title}>Sign In</h2>
          <p className={Styles.subtitle}>Login and connect with us</p>

          {errors.general && (
            <p className={Styles.errorGeneral}>{errors.general}</p>
          )}

          <form className={Styles.form} onSubmit={handleSubmit}>
            <label className={Styles.label}>Email</label>
            <input
              // type="email"
              name="emailOrMobile"
              className={Styles.input}
              placeholder="Enter your email"
              value={formData.emailOrMobile}
              onChange={handleChange}
            />
            {errors.emailOrMobile && (
              <p className={Styles.error}>{errors.emailOrMobile}</p>
            )}

            <label className={Styles.label}>Password</label>
            <input
              type="password"
              name="password"
              className={Styles.input}
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <p className={Styles.error}>{errors.password}</p>
            )}

            <p className={Styles.forgot} onClick={handleForgot}>
              Forgot password?
            </p>

            <button type="submit" className={Styles.button} disabled={loading}>
              {loading ? "Please wait..." : "Sign In"}
            </button>

            <p className={Styles.bottomText}>
              Don’t have an account?
              <NavLink className={Styles.link} to="/signup">
                Register here
              </NavLink>
            </p>
          </form>
        </div>
      </div>

      {showOtpPopup && (
        <OtpPopUp
          onClose={() => setShowOtpPopup(false)}
          onVerify={verifyForgotOtp}
          onResend={handleForgot}
          error={otpError}
          loading={loading}
        />
      )}
    </div>
  );
}

export default React.memo(SignIn);
