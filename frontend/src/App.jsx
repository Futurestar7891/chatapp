import { useEffect } from "react";
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
import PrivacySettings from "./Components/userEdit/PrivacySettings";

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenExpiration = () => {
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      if (tokenExpiry && Date.now() >= tokenExpiry) {
        handleLogout();
      }
    };

    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("id");
      localStorage.removeItem("Mobile");
      window.alert("Session expired");
      navigate("/login", { replace: true });
    };

    const interval = setInterval(checkTokenExpiration, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

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
            <ChatApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fetchmessage"
        element={
          <ProtectedRoute>
            <Fetchmessages />
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
      <Route
        path="/privacy-setting"
        element={
          <ProtectedRoute>
            <PrivacySettings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
