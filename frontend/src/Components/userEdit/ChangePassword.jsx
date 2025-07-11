import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StateContext } from "../../main";
import axios from "axios";
import "../../Css/ChangePassword.css";

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailOrMobile = location.state?.emailOrMobile || "";
  const token = localStorage.getItem("token");
  const { setShowOtpPopup } = useContext(StateContext);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Client-side validation
    if (token && !formData.oldPassword) {
      setErrors({ oldPassword: "Old password is required" });
      setIsLoading(false);
      return;
    }
    if (!formData.newPassword) {
      setErrors({ newPassword: "New password is required" });
      setIsLoading(false);
      return;
    }
    if (!formData.confirmPassword) {
      setErrors({ confirmPassword: "Please confirm your password" });
      setIsLoading(false);
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setIsLoading(false);
      return;
    }

    try {
      const requestBody = {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
        ...(token ? { oldPassword: formData.oldPassword } : { emailOrMobile }),
      };

      const endpoint = token
        ? `${import.meta.env.VITE_PUBLIC_API_URL}/api/change-password`
        : `${import.meta.env.VITE_PUBLIC_API_URL}/api/reset-password`;

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 10000,
      });

      const data = response.data;

      if (data.success) {
        alert(data.message || "Password updated successfully!");
        setShowOtpPopup(false);
        navigate("/login");
      } else {
        setErrors(data.error || {});
      }
    } catch (error) {
      console.error("Error:", error);
      if (error.response?.data?.error) {
        setErrors(error.response.data.error);
      } else if (
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout")
      ) {
        setErrors({
          general: "Request timed out. Please check your connection.",
        });
      } else {
        setErrors({ general: "An error occurred. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const FullPageLoader = () => (
    <div className="full-page-loader">
      <div className="loader-content">
        <div className="loader-spinner"></div>
      </div>
    </div>
  );

  return (
    <div className="change-password-main-div">
      {isLoading && <FullPageLoader />}

      <form onSubmit={handleSubmit}>
        <h2>{token ? "Change Password" : "Reset Password"}</h2>

        {token && (
          <div className="change-password-input">
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="Old Password"
              className={errors.oldPassword ? "error" : ""}
            />
            <label className={errors.oldPassword ? "error" : ""}>
              {errors.oldPassword || ""}
            </label>
          </div>
        )}

        <div className="change-password-input">
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="New Password"
            className={errors.newPassword ? "error" : ""}
          />
          <label className={errors.newPassword ? "error" : ""}>
            {errors.newPassword || ""}
          </label>
        </div>

        <div className="change-password-input">
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className={errors.confirmPassword ? "error" : ""}
          />
          <label className={errors.confirmPassword ? "error" : ""}>
            {errors.confirmPassword || ""}
          </label>
        </div>

        {errors.general && (
          <div className="change-password-error">{errors.general}</div>
        )}

        <button
          type="submit"
          className="change-password-button"
          disabled={isLoading}
        >
          {isLoading
            ? "Processing..."
            : token
            ? "Change Password"
            : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
