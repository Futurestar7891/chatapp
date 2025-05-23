// utils/userStatus.js
import axios from "axios";
const API_URL = import.meta.env.VITE_PUBLIC_API_URL;

const getUserInfo = async (receiverId) => {
  console.log("Fetching user info...");
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await axios.post(
      `${API_URL}/api/userinfo`,
      { receiverId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching user info:", error.message);
    return { success: false, data: null };
  }
};

const getPrivacySettings = async () => {
  console.log("Fetching privacy settings...");
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await axios.get(`${API_URL}/api/privacy-settings`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching privacy settings:", error.message);
    return { success: false, settings: null, blockedUsers: [] };
  }
};

export { getUserInfo, getPrivacySettings };
