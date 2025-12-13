import React, { useEffect, useRef } from "react";

export default function MessageInfo({ message, onClose }) {
  const popupRef = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const format = (date) =>
    date ? new Date(date).toLocaleString() : "Not available";
  
 

  return (
    <div style={styles.Overlay}>
      <div style={styles.Popup} ref={popupRef}>
        <h4>Message Info</h4>

        <div style={styles.Row}>
          <strong>Sent:</strong> {format(message.createdAt)}
        </div>

        <div style={styles.Row}>
          <strong>Delivered:</strong> {format(message.deliveredAt)}
        </div>

        <div style={styles.Row}>
          <strong>Seen:</strong> {format(message.seenAt)}
        </div>

        <button style={styles.CloseBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
   };

const styles = {
  Overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.25)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  Popup: {
    background: "white",
    padding: "18px",
    width: "260px",
    borderRadius: "12px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.15)",
    color:"black"
  },

  Row: {
    margin: "8px 0",
    fontSize: "14px",
    color:"black"
  },

  CloseBtn: {
    marginTop: "12px",
    width: "100%",
    padding: "8px",
    background: "#007aff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};