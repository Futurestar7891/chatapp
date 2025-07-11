import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faUser, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router-dom";
import "../../Css/Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    photo: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    // Clear any existing errors when user types (using capitalized keys)
    if (errors[name.charAt(0).toUpperCase() + name.slice(1)]) {
      setErrors((prev) => ({
        ...prev,
        [name.charAt(0).toUpperCase() + name.slice(1)]: "",
      }));
    }
    if (serverError) setServerError("");

    if (type === "file") {
      const file = files[0];
      // Validate image file
      if (file && !file.type.match("image.*")) {
        setErrors((prev) => ({
          ...prev,
          Photo: "Please upload an image file",
        }));
        return;
      }
      if (file && file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          Photo: "Image size should be less than 5MB",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [name]: reader.result,
        });
      };
      if (file) {
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageClick = () => {
    document.getElementById("photo-upload").click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerError("");

    // Basic client-side validation with capitalized keys
    if (!formData.name) {
      setErrors({ Name: "Name is required" });
      setIsLoading(false);
      return;
    }
    if (!formData.email) {
      setErrors({ Email: "Email is required" });
      setIsLoading(false);
      return;
    }
    if (!formData.mobile) {
      setErrors({ Mobile: "Mobile number is required" });
      setIsLoading(false);
      return;
    }
    if (!formData.password) {
      setErrors({ Password: "Password is required" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Name: formData.name,
            Email: formData.email,
            Mobile: formData.mobile,
            Password: formData.password,
            Photo: formData.photo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          setErrors(data.error);
          if (data.error.General) {
            setServerError(data.error.General);
          }
        } else {
          setServerError(data.message || "Signup failed. Please try again.");
        }
        return;
      }

      // Clear form on success
      setFormData({
        name: "",
        email: "",
        mobile: "",
        password: "",
        photo: null,
      });

      // Show success message and redirect
      alert("Signup successful! Redirecting to login...");
      navigate("/");
    } catch (error) {
      console.error("Signup error:", error);
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-main-div">
      {" "}
      {/* Changed to match Login's container class */}
      <form onSubmit={handleSubmit}>
        <h2>Signup</h2>

        {serverError && <div className="error-message">{serverError}</div>}

        {/* Circular Image Picker */}
        <div className="signup-image-picker" onClick={handleImageClick}>
          {formData.photo ? (
            <img
              src={formData.photo}
              alt="Profile"
              className="signup-profile-image"
            />
          ) : (
            <div className="signup-default-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>
          )}
          <div className="signup-camera-icon">
            <FontAwesomeIcon icon={faCamera} />
          </div>
          <input
            type="file"
            id="photo-upload"
            name="photo"
            onChange={handleChange}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>
        {errors.Photo && <div className="field-error">{errors.Photo}</div>}

        {/* Name Field */}
        <div className="login-input">
          {" "}
          {/* Changed to match Login's input class */}
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={errors.Name ? "error" : ""}
          />
          <label className={errors.Name ? "error" : ""}>
            {errors.Name || "Enter your Name"}
          </label>
        </div>

        {/* Email Field */}
        <div className="login-input">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={errors.Email ? "error" : ""}
          />
          <label className={errors.Email ? "error" : ""}>
            {errors.Email || "Enter your Email"}
          </label>
        </div>

        {/* Mobile Field */}
        <div className="login-input">
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={errors.Mobile ? "error" : ""}
          />
          <label className={errors.Mobile ? "error" : ""}>
            {errors.Mobile || "Enter your Mobile"}
          </label>
        </div>

        {/* Password Field */}
        <div className="login-input">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={errors.Password ? "error" : ""}
          />
          <label className={errors.Password ? "error" : ""}>
            {errors.Password || "Enter your Password"}
          </label>
        </div>

        <button type="submit" className="login-button">
          {" "}
          {/* Changed to match Login's button class */}
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Processing...
            </>
          ) : (
            "Sign Up"
          )}
        </button>

        <div className="login-register">
          {" "}
          {/* Changed to match Login's register class */}
          <p>
            Already have an account? <NavLink to="/">Login</NavLink>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
