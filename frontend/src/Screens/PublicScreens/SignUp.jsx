import { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";
import Loginsignup from "../../assets/Loginsignup.webp";

import Styles from "../../Modules/SignUp.module.css";
import { signUp, verifySignUpOtp } from "../../utils/user";
import OtpPopUp from "./OtpPopUp";

const SignUp = () => {
  const { setIsLoggedIn, setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmpassword: "",
  });

  const [errors, setErrors] = useState({});
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpError, setOtpError] = useState("");

  /* -------------------- INPUT -------------------- */
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
      general: "",
    }));
  };

  /* -------------------- SEND OTP -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setOtpError("");

    if (!accepted) {
      setErrors({ policy: "Accept Terms & Privacy Policy" });
      return;
    }

    setLoading(true);
    const response = await signUp(formData);
    setLoading(false);

    if (response.errors) {
      setErrors(response.errors);
      return;
    }

    if (!response.success) {
      setErrors({ general: response.message });
      return;
    }

    setShowOtpPopup(true);
  };

  /* -------------------- VERIFY OTP -------------------- */
  const handleVerifyOtp = async (otp) => {
    setOtpError("");
    setLoading(true);

    const response = await verifySignUpOtp(formData.email, otp);
    setLoading(false);

    if (!response.success) {
      setOtpError(response.message);
      return;
    }

    setUser(response.user);
    setIsLoggedIn(true);
    setShowOtpPopup(false);
  };

  /* -------------------- RESEND OTP -------------------- */
  const handleResendOtp = async () => {
    setOtpError("");
    const response = await signUp(formData);

    if (response.errors) {
      setOtpError("Fix errors before resending OTP");
      return;
    }

    if (!response.success) {
      setOtpError(response.message);
      return;
    }
  };

  return (
    <div className={Styles.page}>
      <div className={Styles.grid}>
        {/* IMAGE */}
        <div className={Styles.imageWrapper}>
          <img
            src={Loginsignup}
            alt="signup"
            loading="lazy"
            className={Styles.image}
          />
        </div>

        {/* FORM */}
        <div className={Styles.card}>
          <h2 className={Styles.title}>Create an Account</h2>
          <p className={Styles.subtitle}>Join us today</p>

          {errors.general && (
            <p className={Styles.errorGeneral}>{errors.general}</p>
          )}

          <form className={Styles.form} onSubmit={handleSubmit}>
            {/* NAME */}

            <label className={Styles.label}>Full Name</label>
            <input
              name="name"
              className={Styles.input}
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
            />
            {errors.name && <p className={Styles.error}>{errors.name}</p>}

            {/* EMAIL */}

            <label className={Styles.label}>Email</label>
            <input
              type="email"
              name="email"
              className={Styles.input}
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
            />
            {errors.email && <p className={Styles.error}>{errors.email}</p>}

            {/* MOBILE */}

            <label className={Styles.label}>Mobile</label>
            <input
              name="mobile"
              className={Styles.input}
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile Number"
            />
            {errors.mobile && <p className={Styles.error}>{errors.mobile}</p>}

            <label className={Styles.label}>Password</label>
            <input
              type="password"
              name="password"
              className={Styles.input}
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
            />
            {errors.password && (
              <p className={Styles.error}>{errors.password}</p>
            )}

            {/* CONFIRM PASSWORD */}

            <label className={Styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmpassword"
              className={Styles.input}
              value={formData.confirmpassword}
              onChange={handleChange}
              placeholder="Confirm Password"
            />
            {errors.confirmpassword && (
              <p className={Styles.error}>{errors.confirmpassword}</p>
            )}

            {/* TERMS */}
            <div className={Styles.checkboxRow}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={() => setAccepted(!accepted)}
                className={Styles.checkbox}
              />
              <p className={Styles.terms}>Accept Terms & Privacy Policy</p>
            </div>
            {errors.policy && <p className={Styles.error}>{errors.policy}</p>}

            {/* BUTTON */}
            <button
              type="submit"//additional
              className={`${Styles.button} ${
                accepted ? Styles.buttonActive : Styles.buttonDisabled
              }`}
              disabled={!accepted || loading}
            >
              {loading ? "Please wait..." : "Sign Up"}
            </button>

            <p className={Styles.bottomText}>
              Already have an account?
              <NavLink to="/" className={Styles.link}>
                Login
              </NavLink>
            </p>
          </form>
        </div>
      </div>

      {showOtpPopup && (
        <OtpPopUp
          onClose={() => setShowOtpPopup(false)}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          error={otpError}
        />
      )}
    </div>
  );
};

export default SignUp;


