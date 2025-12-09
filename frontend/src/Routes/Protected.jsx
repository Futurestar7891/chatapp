import React, { lazy, Suspense, useContext, memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

// 🚀 Lazy load screens for faster initial load
const Home = lazy(() => import("../Screens/ProtectedScreens/Home"));
const Profile = lazy(() => import("../Screens/ProtectedScreens/Profile"));
const ReceiverProfile = lazy(() =>
  import("../Screens/ProtectedScreens/ReceiverProfile")
);

function ProtectedRoute({ children }) {
  const { isLoggedIn, } = useContext(AuthContext);


  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

function Protected() {
  return (
    <Suspense
      fallback={
   null
      }
    >
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receiver-profile"
          element={
            <ProtectedRoute>
              <ReceiverProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default memo(Protected);
