import React, { lazy, Suspense, useContext, memo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

// 🚀 Lazy load screens for faster initial load
const SignIn = lazy(() => import("../Screens/PublicScreens/SignIn"));
const SignUp = lazy(() => import("../Screens/PublicScreens/SignUp"));
const ResetPassword = lazy(() =>
  import("../Screens/PublicScreens/ResetPassword")
);

function PublicRoute({ children }) {
  const { isLoggedIn, } = useContext(AuthContext);



  if (isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

function Public() {
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
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default memo(Public);
