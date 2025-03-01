import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faUser } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    photo: null, // No default image URL, use faUser icon
  });

  const [errors, setErrors] = useState({}); // State to hold validation errors

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          [name]: reader.result, // Base64 URL
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageClick = () => {
    document.getElementById("photo-upload").click(); // Trigger file input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/signup", {
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
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({
          ...prev,
          name: "", // Clear the 'name' field
          email: "", // Clear the 'email' field
          mobile: "", // Clear the 'mobile' field
          password: "", // Clear the 'password' field
          photo: "",
        }));

        alert("Signup successful!");

        setErrors((prev) => ({
          ...prev,
          Name: "",
          Email: "",
          Mobile: "",
          Password: "",
        }));
        // Redirect or perform other actions after successful signup
      } else {
        if (data.error) {
          // Set validation errors
          setErrors(data.error);

          setFormData((prev) => ({
            ...prev,
            name: data.error.Name ? "" : prev.name,
            email: data.error.Email ? "" : prev.email,
            mobile: data.error.Mobile ? "" : prev.mobile,
            password: data.error.Password ? "" : prev.password,
          }));
        } else {
          alert(data.message || "Signup failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Signup failed:", error.message);
      alert("Signup failed. Please try again.");
    }
  };

  return (
    <div
      className="Loginmaindiv"
      style={{
        background: `url('Login.jpg') center/cover no-repeat`,
      }}
    >
      <form onSubmit={handleSubmit}>
        <h2>Signup</h2>

        {/* Circular Image Picker */}
        <div className="image-picker" onClick={handleImageClick}>
          {formData.photo ? (
            <img src={formData.photo} alt="Profile" className="profile-image" />
          ) : (
            <div className="default-icon">
              <FontAwesomeIcon icon={faUser} />
            </div>
          )}
          <div className="camera-icon">
            <FontAwesomeIcon icon={faCamera} />
          </div>
          <input
            type="file"
            id="photo-upload"
            name="photo"
            onChange={handleChange}
            accept="image/*"
            style={{ display: "none" }} // Hide the file input
          />
        </div>

        {/* Name Field */}
        <div className="Logininput">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <label>{errors.Name ? errors.Name : "Enter your Name"}</label>
        </div>

        {/* Email Field */}
        <div className="Logininput">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label>{errors.Email ? errors.Email : "Enter your Email"}</label>
        </div>

        {/* Mobile Field */}
        <div className="Logininput">
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            required
          />
          <label>{errors.Mobile ? errors.Mobile : "Enter your mobile"}</label>
        </div>

        {/* Password Field */}
        <div className="logininput">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <label>
            {errors.Password ? errors.Password : "Enter your Password"}
          </label>
        </div>

        <button type="submit">Sign Up</button>
        <div className="register">
          <p>
            Already have an account? <NavLink to="/">Login</NavLink>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
