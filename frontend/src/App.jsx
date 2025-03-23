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
import Fetchmessages from "./Components/userMessage/Fetchmessages";
import PublicProfile from "./Components/userEdit/PublicProfile";

const App = () => {
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("id"); // Get the user's ID from localStorage

    const newSocket = io(`${import.meta.env.VITE_PUBLIC_API_URL}`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.once("connect", () => {
      console.log("✅ Connected to server, ID:", newSocket.id);

      // Emit the "setOnline" event to update the user's status to "online"
      if (userId) {
        newSocket.emit("setOnline", userId);
      }
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
        handleLogout();
      }
    };

    const handleLogout = () => {
      const userId = localStorage.getItem("id");
      if (socket && userId) {
        socket.emit("logout", userId); // Emit logout event
      }

      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("id");
      localStorage.removeItem("Mobile");
      window.alert("session expire");
      navigate("/login", { replace: true });
    };

    const interval = setInterval(checkTokenExpiration, 1000);

    return () => clearInterval(interval);
  }, [navigate, socket]);

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  const PublicRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (token) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  return (
    <Routes>
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatApp socket={socket} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fetchmessage"
        element={
          <ProtectedRoute>
            <Fetchmessages socket={socket} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/public-profile"
        element={
          <ProtectedRoute>
            <PublicProfile />
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
