import React, { useContext } from "react";
import { Toaster } from "react-hot-toast";

import { AuthContext } from "./Context/AuthContext";
import Protected from "./Routes/Protected";
import Public from "./Routes/Public";

function App() {
  const { isLoggedIn, loading } = useContext(AuthContext);

  // Show loading while checking auth
  if (loading) {
    return (
      <>
        <Toaster position="bottom-center" />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "18px",
            color: "#666",
          }}
        >
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          success: {
            style: {
              background: "#16a34a",
              color: "#fff",
              minWidth: "320px",
              maxWidth: "420px",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "14px",
            },
          },
          error: {
            style: {
              background: "#dc2626",
              color: "#fff",
              minWidth: "250px",
              maxWidth: "420px",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "14px",
            },
          },
        }}
      />

      {isLoggedIn ? <Protected /> : <Public />}
    </>
  );
}

export default React.memo(App);
