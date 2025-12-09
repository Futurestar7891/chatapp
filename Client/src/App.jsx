import React, { useContext } from "react"; // ✅ Single import

import { AuthContext } from "./Context/AuthContext";
import Protected from "./Routes/Protected";
import Public from "./Routes/Public";
function App() {
  const { isLoggedIn, loading } = useContext(AuthContext);

  // Show loading while checking auth
  if (loading) {
    return (
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
    );
  }

  return isLoggedIn ? <Protected /> : <Public />;
}

export default React.memo(App);
