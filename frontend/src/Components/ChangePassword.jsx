import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StateContext } from "../main";
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
        ? "http://localhost:3000/api/change-password" // Change password endpoint
        : "http://localhost:3000/api/reset-password"; // Forgot password endpoint

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token for change password
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Password updated successfully!");
        setShowOtpPopup(false);
        navigate("/login"); // Redirect to login page
      } else {
        // Set errors returned from the backend
        setErrors(data.error || {});
        console.log(errors);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="Loginmaindiv" // Reuse the same class name as Login
      style={{
        background: `url('Login.jpg') center/cover no-repeat`,
      }}
    >
      <form onSubmit={handleSubmit}>
        <h2>{token ? "Change Password" : "Forgot Password"}</h2>

        {/* Show Old Password field only if token exists */}
        {token && (
          <div className="Logininput">
            {" "}
            {/* Reuse the same class name as Login */}
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
        <div className="Logininput">
          {" "}
          {/* Reuse the same class name as Login */}
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
        <div className="Logininput">
          {" "}
          {/* Reuse the same class name as Login */}
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
          />
          {errors.confirmPassword && <label>{errors.confirmPassword}</label>}
        </div>

        <button type="submit" className="Loginbutton">
          {" "}
          {/* Reuse the same class name as Login */}
          {token ? "Change Password" : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
