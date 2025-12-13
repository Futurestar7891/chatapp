import toast from "react-hot-toast";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Styles from "../../Modules/ResetPassword.module.css";
import Loginsignup from "../../assets/Loginsignup.webp";
import { resetPassword } from "../../utils/user";

function ResetPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmpassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);


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

    const response = await resetPassword(
      formData.password,
      formData.confirmpassword
    );

    setLoading(false);

    // Backend error object
    if (response.errors) {
      setErrors(response.errors);
      return;
    }

    if (!response.success) {
      setErrors({ general: response.message || "Reset failed" });
      toast.error(response.message);
      return;
    }


    toast.success(response.message);

    setTimeout(() => {
      navigate("/signin", { replace: true });
    }, 1500);
  };

  return (
    <div className={Styles.page}>
      <div className={Styles.grid}>
        {/* IMAGE */}
        <div className={Styles.imageWrapper}>
          <img
            src={Loginsignup}
            loading="lazy"
            className={Styles.image}
            alt="Reset"
          />
        </div>

        {/* FORM CARD */}
        <div className={Styles.card}>
          <h2 className={Styles.title}>Reset Password</h2>
          <p className={Styles.subtitle}>Enter your new password</p>

          {/* General Error */}
          {errors.general && (
            <p className={Styles.errorGeneral}>{errors.general}</p>
          )}

          <form className={Styles.form} onSubmit={handleSubmit}>
            {/* PASSWORD */}
            <label className={Styles.label}>New Password</label>
            <input
              type="password"
              name="password"
              className={Styles.input}
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
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
              placeholder="Confirm new password"
              value={formData.confirmpassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirmpassword && (
              <p className={Styles.error}>{errors.confirmpassword}</p>
            )}

            {/* SUBMIT */}
            <button type="submit" className={Styles.button} disabled={loading}>
              {loading ? "Please wait..." : "Reset Password"}
            </button>

            {/* BOTTOM */}
            <p className={Styles.bottomText}>
              Back to
              <span
                onClick={() => navigate("/signin")}
                style={{
                  color: "#1e40af",
                  fontWeight: "bold",
                  marginLeft: "5px",
                  cursor: "pointer",
                }}
              >
                Sign In
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ResetPassword);
