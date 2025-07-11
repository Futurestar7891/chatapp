import { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { StateContext } from "../../main";
import axios from "axios";
import "../../Css/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const { showOtpPopup, setShowOtpPopup } = useContext(StateContext);
  const [otp, setOtp] = useState("");
  const [forgotEmailOrMobile, setForgotEmailOrMobile] = useState("");
  const [timer, setTimer] = useState(0);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    const storedShowOtpPopup = localStorage.getItem("showOtpPopup");
    const storedTimer = localStorage.getItem("timer");
    const storedStartTime = localStorage.getItem("starttime");

    if (storedShowOtpPopup === "true") {
      setShowOtpPopup(true);
    }

    if (storedTimer && storedStartTime) {
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = parseInt(storedStartTime, 10);
      const elapsedTime = currentTime - startTime;
      const remainingTime = Math.max(0, 300 - elapsedTime);

      if (remainingTime > 0) {
        setTimer(remainingTime);
        startTimer();
      } else {
        localStorage.removeItem("timer");
        localStorage.removeItem("showOtpPopup");
        localStorage.removeItem("starttime");
        setTimer(0);
      }
    }
  }, [setShowOtpPopup]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(updatedFormData);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowFullPageLoader(true);
    setErrors({});

    // Basic client-side validation
    if (!formData.email) {
      setErrors({ email: "Email or mobile is required" });
      setShowFullPageLoader(false);
      return;
    }
    if (!formData.password) {
      setErrors({ password: "Password is required" });
      setShowFullPageLoader(false);
      return;
    }

    try {
      const requestBody = {
        Password: formData.password,
      };

      if (formData.email.includes("@")) {
        requestBody.Email = formData.email;
      } else {
        requestBody.Mobile = formData.email;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/login`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      if (data.Token) {
        const tokenPayload = JSON.parse(atob(data.Token.split(".")[1]));
        const expirationTime = tokenPayload.exp * 1000;

        localStorage.setItem("token", data.Token);
        localStorage.setItem("tokenExpiry", expirationTime);
        localStorage.setItem("id", data.id);
        localStorage.setItem("Mobile", data.Mobile);
        localStorage.setItem("Photo", data.Photo);
        localStorage.setItem("Name", data.Name);
        localStorage.setItem("Bio", data.Bio);
        localStorage.setItem("Email", data.Email);

        navigate("/", { replace: true });
      } else {
        if (data.error) {
          setErrors(data.error);
        } else {
          setErrors({
            general: data.message || "Login failed. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
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
        setErrors({ general: "Login failed. Please check your credentials." });
      }
    } finally {
      setShowFullPageLoader(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: "Please enter your email or mobile number" });
      return;
    }

    setShowFullPageLoader(true);
    setErrors({});

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/send-otp`,
        { emailOrMobile: formData.email },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      if (data.success) {
        setForgotEmailOrMobile(formData.email);
        localStorage.setItem("showOtpPopup", "true");
        localStorage.setItem("starttime", Math.floor(Date.now() / 1000));
        localStorage.setItem("timer", "300");
        setShowOtpPopup(true);
        setTimer(300);
        startTimer();
      } else {
        setErrors({
          general: data.message || "Failed to send OTP. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (error.response?.data?.error) {
        setErrors(error.response.data.error);
      } else {
        setErrors({ general: "Failed to send OTP. Please try again." });
      }
    } finally {
      setShowFullPageLoader(false);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          localStorage.removeItem("timer");
          localStorage.removeItem("showOtpPopup");
          localStorage.removeItem("starttime");
          return 0;
        }
        localStorage.setItem("timer", prev - 1);
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpSubmit = async () => {
    if (!otp) {
      setOtpError("Please enter the OTP");
      return;
    }

    setShowFullPageLoader(true);
    setOtpError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/validate-otp`,
        { emailOrMobile: forgotEmailOrMobile, otp },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      if (data.success) {
        localStorage.removeItem("showOtpPopup");
        localStorage.removeItem("timer");
        localStorage.removeItem("starttime");
        setShowOtpPopup(false);
        navigate("/forgotpassword", {
          state: { emailOrMobile: forgotEmailOrMobile },
        });
      } else {
        setOtpError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error validating OTP:", error);
      if (error.response?.data?.error?.otp) {
        setOtpError(error.response.data.error.otp);
      } else if (error.response?.data?.message) {
        setOtpError(error.response.data.message);
      } else {
        setOtpError("Failed to validate OTP. Please try again.");
      }
    } finally {
      setShowFullPageLoader(false);
    }
  };

  const handleClosePopup = () => {
    setShowOtpPopup(false);
    localStorage.removeItem("showOtpPopup");
    localStorage.removeItem("timer");
    localStorage.removeItem("starttime");
  };

  const FullPageLoader = () => (
    <div className="full-page-loader">
      <div className="loader-content">
        <div className="loader-spinner"></div>
      </div>
    </div>
  );

  return (
    <div className="login-main-div">
      {showFullPageLoader && <FullPageLoader />}

      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <div className="login-input">
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={
              errors.email || errors.Email || errors.Mobile ? "error" : ""
            }
          />
          <label
            className={
              errors.email || errors.Email || errors.Mobile ? "error" : ""
            }
          >
            {errors.email ||
              errors.Email ||
              errors.Mobile ||
              "Enter your Email or Mobile No."}
          </label>
        </div>

        <div className="login-input">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={errors.password ? "error" : ""}
          />
          <label className={errors.password ? "error" : ""}>
            {errors.Password || "Enter your Password"}
          </label>
        </div>

        <div className="login-forget-password">
          <label htmlFor="rememberpassword">
            <input
              type="checkbox"
              id="remember"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <p>Remember me</p>
          </label>
          <a
            href="#"
            onClick={handleForgotPassword}
            className="forgot-password-link"
          >
            Forgot password?
          </a>
        </div>

        <button type="submit" className="login-button">
          Log In
        </button>

        <div className="login-register">
          <p>
            Don't have an account? <NavLink to="/signup">Register</NavLink>
          </p>
        </div>
      </form>

      {showOtpPopup && (
        <div className="login-otp-popup">
          <div className="login-otp-popup-content">
            <h3>Enter OTP</h3>
            <p>A 4-digit OTP has been sent to your email/mobile.</p>
            {timer > 0 ? (
              <>
                <input
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className={`otp-input ${otpError ? "error" : ""}`}
                />
                {otpError && <div className="error-message">{otpError}</div>}
                <p>
                  Time remaining: {Math.floor(timer / 60)}:
                  {timer % 60 < 10 ? `0${timer % 60}` : timer % 60}
                </p>
                <button onClick={handleOtpSubmit} className="otp-submit-btn">
                  Submit
                </button>
              </>
            ) : (
              <>
                <p>OTP expired. Click resend to get a new OTP.</p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleForgotPassword(e);
                  }}
                  className="otp-resend-btn"
                >
                  Resend OTP
                </button>
              </>
            )}
            <button onClick={handleClosePopup} className="otp-close-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
