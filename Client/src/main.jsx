import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./Context/AuthContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { ChatProvider } from "./Context/ChatContext.jsx";

// Simple loading component
export const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontSize: "18px",
      color: "#666",
      fontFamily: "Arial, sans-serif",
    }}
  >
    ⚡ Loading your chat app...
  </div>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <ChatProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </Suspense>
  </StrictMode>
);
