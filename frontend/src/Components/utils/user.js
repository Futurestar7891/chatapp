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

export { getUserInfo };
