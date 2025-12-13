import React, { useState, useEffect } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import styles from "./Modules/LoadingPage.module.css";

export default function LoadingPage() {
  const [dots, setDots] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    "Preparing your chat experience",
    "Securing your connection",
    "Almost there",
    "Getting everything ready",
  ];

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.spaceY8}`}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <div className={styles.logoRelative}>
            <div className={styles.logoGlow}></div>
            <div className={styles.logoBox}>
              <MessageCircle size={64} color="#4f46e5" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className={styles.spaceY3}>
          <h1 className={styles.heading}>Welcome Back</h1>
          <p className={styles.subText}>We're setting things up for you</p>
        </div>

        {/* Loader */}
        <div className={styles.spaceY6}>
          <div className={styles.loaderRow}>
            <Loader2 size={24} className="spin" />
            <span className={styles.loaderText}>
              {loadingMessages[messageIndex]}
              {dots}
            </span>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>

        {/* Dots */}
        <div className={styles.dotRow}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={styles.dot}
              style={{
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <p className={styles.footerText}>
          This may take a moment on first load due to Render ColdStart
        </p>
      </div>
    </div>
  );
}
