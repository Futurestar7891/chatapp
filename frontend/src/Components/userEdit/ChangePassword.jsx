import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StateContext } from "../../main";
import axios from "axios";
import "../../Css/ChangePassword.css";

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailOrMobile = location.state?.emailOrMobile || ""; // Retrieve emailOrMobile
  const token = localStorage.getItem("token"); // Check if token exists
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { setShowOtpPopup } = useContext(StateContext);
  const [errors, setErrors] = useState({}); // State to hold validation errors from backend

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const requestBody = {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      };

      // Add oldPassword to the request body if token exists (change password flow)
      if (token) {
        requestBody.oldPassword = formData.oldPassword;
      } else {
        requestBody.emailOrMobile = emailOrMobile;
      }

      const endpoint = token
        ? `${import.meta.env.VITE_PUBLIC_API_URL}/api/change-password` // Change password endpoint
        : `${import.meta.env.VITE_PUBLIC_API_URL}/api/reset-password`; // Forgot password endpoint

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }), // Include token for change password
        },
      });

      const data = response.data;

      if (data.success) {
        alert(data.message || "Password updated successfully!");
        setShowOtpPopup(false);
        navigate("/login"); // Redirect to login page
      } else {
        // Set errors returned from the backend
        setErrors(data.error || {});
        console.log(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="change-password-main-div"
      style={{
        background: `url('Login.jpg') center/cover no-repeat`,
      }}
    >
      <form onSubmit={handleSubmit}>
        <h2>{token ? "Change Password" : "Forgot Password"}</h2>

        {/* Show Old Password field only if token exists */}
        {token && (
          <div className="change-password-input">
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="Old Password"
            />
            {errors.oldPassword && <label>{errors.oldPassword}</label>}
          </div>
        )}

        {/* New Password field */}
        <div className="change-password-input">
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="New Password"
          />
          {errors.newPassword && <label>{errors.newPassword}</label>}
        </div>

        {/* Confirm Password field */}
        <div className="change-password-input">
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
          />
          {errors.confirmPassword && <label>{errors.confirmPassword}</label>}
        </div>

        <button type="submit" className="change-password-button">
          {token ? "Change Password" : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
