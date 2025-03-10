import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import ChatApp from "./Components/ChatApp";
import "./App.css";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Login from "./Components/Forms/Login";
import Signup from "./Components/Forms/Signup";
import Options from "./Components/ChatListUsers/Options";
import ChangePassword from "./Components/userEdit/ChangePassword";
import AddContact from "./Components/Forms/AddContact";

const App = () => {
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate(); // For manual navigation

  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_PUBLIC_API_URL}`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.once("connect", () => {
      console.log("✅ Connected to server, ID:", newSocket.id);
    });

    newSocket.once("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    newSocket.once("connect_error", (err) => {
      console.error("⚠️ Connection error:", err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Check token expiration and handle logout
  useEffect(() => {
    const checkTokenExpiration = () => {
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      if (tokenExpiry && Date.now() >= tokenExpiry) {
        handleLogout(); // Call logout if token has expired
      }
    };

    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("id");
      localStorage.removeItem("Mobile");
      window.alert("session expire");
      navigate("/login", { replace: true }); // Redirect to login page
    };

    // Set up interval to check token expiration every second
    const interval = setInterval(checkTokenExpiration, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [navigate]);

  // Wrapper for protected routes
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Redirect to the login page if there's no token
      return <Navigate to="/login" replace />;
    }

    // Render the protected component if the token exists
    return children;
  };

  // Wrapper for public routes
  const PublicRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (token) {
      // Redirect to the main page (or another protected page) if the token exists
      return <Navigate to="/" replace />;
    }

    // Render the public component if no token exists
    return children;
  };

  return (
    <Routes>
      {/* Public Routes (Only accessible if no token exists) */}
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/forgotpassword"
        element={
          <PublicRoute>
            <ChangePassword />
          </PublicRoute>
        }
      />

      {/* Protected Routes (Only accessible if a token exists) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatApp socket={socket} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/options"
        element={
          <ProtectedRoute>
            <Options />
          </ProtectedRoute>
        }
      />

      <Route
        path="/changepassword"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-contact"
        element={
          <ProtectedRoute>
            <AddContact />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
