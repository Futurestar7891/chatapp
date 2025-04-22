import { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { StateContext } from "../../main";
import axios from "axios";
import "../../Css/Login.css";

const Login = ({socket}) => {
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

    if (name === "email") {
      localStorage.setItem("emailOrMobile", updatedFormData.email.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        console.log("Login successful");

        // Emit setUserId to associate user with socket
        socket.emit("setUserId", data.id);

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 100); // Small delay to allow socket event to be sent
      } else {
        if (data.error) {
          setErrors(data.error);
          setFormData((prev) => ({
            ...prev,
            email: data.error.Email || data.error.Mobile ? "" : prev.email,
            password: data.error.Password ? "" : prev.password,
          }));
        } else {
          alert(data.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login failed:", error.message);
      alert("Login failed. Please check your credentials.");
    }
  };

  const handleForgotPassword = async () => {
    const emailOrMobile = localStorage.getItem("emailOrMobile");
    if (!emailOrMobile) {
      alert("Please enter your email or mobile number.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/send-otp`,
        { emailOrMobile },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      if (data.success) {
        setForgotEmailOrMobile(emailOrMobile);
        localStorage.setItem("showOtpPopup", "true");
        localStorage.setItem("starttime", Math.floor(Date.now() / 1000));
        localStorage.setItem("timer", "300");
        setShowOtpPopup(true);
        setTimer(300);
        startTimer();
      } else {
        alert(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("An error occurred. Please try again.");
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
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/validate-otp`,
        { emailOrMobile: forgotEmailOrMobile, otp },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      if (data.success) {
        localStorage.removeItem("emailOrMobile");
        localStorage.removeItem("showOtpPopup");
        localStorage.removeItem("timer");
        localStorage.removeItem("starttime");
        setShowOtpPopup(false);
        navigate("/forgotpassword", {
          state: { emailOrMobile: forgotEmailOrMobile },
        });
      } else {
        alert(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error validating OTP:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleClosePopup = () => {
    setShowOtpPopup(false);
    localStorage.removeItem("showOtpPopup");
    localStorage.removeItem("timer");
    localStorage.removeItem("starttime");
  };

  return (
    <div
      className="login-main-div"
      style={{
        background: `url('Login.jpg') center/cover no-repeat`,
      }}
    >
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div className="login-input">
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <label>
            {errors.Email
              ? errors.Email
              : errors.Mobile
              ? errors.Mobile
              : "Enter your Email or Mobile No."}
          </label>
        </div>
        <div className="login-input">
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
          <a onClick={handleForgotPassword}>Forgot password?</a>
        </div>
        <button type="submit">Log In</button>
        <div className="login-register">
          <p>
            Don’t have an account? <NavLink to="/signup">Register</NavLink>
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
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
                <p>
                  Time remaining: {Math.floor(timer / 60)}:
                  {timer % 60 < 10 ? `0${timer % 60}` : timer % 60}
                </p>
                <button onClick={handleOtpSubmit}>Submit</button>
              </>
            ) : (
              <>
                <p>OTP expired. Click resend to get a new OTP.</p>
                <button onClick={handleForgotPassword}>Resend OTP</button>
              </>
            )}
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
