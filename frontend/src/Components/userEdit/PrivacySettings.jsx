import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../../Css/PrivacySetting.css"; // Import the updated CSS file
import { StateContext } from "../../main";

const PrivacySettings = () => {
  const { selectedUser, setIsBlocked } = useContext(StateContext);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    lastSeenVisibility: "public",
    bioVisibility: "public",
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_PUBLIC_API_URL}/api/privacy-settings`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.success) {
          setPrivacySettings(response.data.settings);
          setBlockedUsers(response.data.blockedUsers);
        }
      } catch (error) {
        console.error("Error fetching privacy settings:", error.message);
        setError("Failed to fetch privacy settings.");
      }
    };
    fetchPrivacySettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPrivacySettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/privacy-settings`,
        privacySettings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
           console.log("updated");
      } else {
        throw new Error(
          response.data.message || "Failed to update privacy settings."
        );
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error.message);
      setError("Failed to update privacy settings.");
    } finally {
      setLoading(false);
    }
  };
const handleUnblockUser = async (blockedUserId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${import.meta.env.VITE_PUBLIC_API_URL}/api/unblock-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blockedUserId }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      setBlockedUsers((prev) =>
        prev.filter((user) => user.userId._id !== blockedUserId)
      );
      if (selectedUser?._id === blockedUserId) {
        setIsBlocked(false);
      }
      alert("User unblocked successfully!");
      setError("");
    } else {
      throw new Error(data.message || "Failed to unblock user.");
    }
  } catch (error) {
    console.error("Error unblocking user:", error.message);
    setError("Failed to unblock user.");
  }
};

  return (
    <div className="privacy-maindiv">
      <div className="privacy-topdiv">
        <h2>Privacy Settings</h2>
        {error && <p className="error">{error}</p>}
      </div>

      {/* Privacy Settings Form */}
      <form onSubmit={handleSubmit} className="privacy-form">
        <div className="form-group">
          <label>Who can see my profile photo?</label>
          <select
            name="profileVisibility"
            value={privacySettings.profileVisibility}
            onChange={handleInputChange}
          >
            <option value="public">Everyone</option>
            <option value="contacts">Contacts Only</option>
            <option value="private">Private (Only Me)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Who can see my last seen and status?</label>
          <select
            name="lastSeenVisibility"
            value={privacySettings.lastSeenVisibility}
            onChange={handleInputChange}
          >
            <option value="public">Everyone</option>
            <option value="contacts">Contacts Only</option>
            <option value="private">Private (Only Me)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Who can see my bio?</label>
          <select
            name="bioVisibility"
            value={privacySettings.bioVisibility}
            onChange={handleInputChange}
          >
            <option value="public">Everyone</option>
            <option value="contacts">Contacts Only</option>
            <option value="private">Private (Only Me)</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Blocked Users Section */}
      <div className="privacy-downdiv">
        <h3>Blocked Users</h3>
        {blockedUsers.length > 0 ? (
          <ul className="blocked-users-list">
            {blockedUsers.map((user) => (
              <li key={user.userId._id} className="blocked-user-item">
                {/* Main content (80% width) */}
                <div className="user-content">
                  <img
                    src={user.userId.Photo}
                    alt={user.userId.Name}
                    className="blocked-user-photo"
                  />
                  <div className="user-details">
                    <span>{user.userId.Name}</span>
                    <span>{user.userId.Mobile}</span>
                  </div>
                </div>

                {/* Delete action (20% width, hidden by default) */}
                <div
                  className="unblock-action"
                  onClick={() => handleUnblockUser(user.userId._id)}
                >
                  Unblock
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No blocked users.</p>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
