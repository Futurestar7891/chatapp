export const signUp = async (formData) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error", error };
  }
};

export const verifySignUpOtp = async (email, otp) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/user/verify-signup-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      }
    );

    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error", error };
  }
};

export const signIn = async (emailOrMobile, password) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/user/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emailOrMobile, password }),
    });

    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error", error };
  }
};

export const forgotPasswordOtp = async (emailOrMobile) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/user/forgot-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailOrMobile }),
      }
    );

    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error", error };
  }
};

export const verifyForgotPasswordOtp = async (emailOrMobile, otp) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/user/verify-forgot-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailOrMobile, otp }),
      }
    );

    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error", error };
  }
};

export const resetPassword = async (password, confirmpassword) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/user/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, confirmpassword }),
      }
    );

    return await res.json();
  } catch (error) {
    return { success: false, message: "Network error", error };
  }
};

// ⬅ Send Email OTP
// SEND OTP
export const sendEmailUpdateOtp = async (email) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/user/send-email-update-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ newEmail: email }),
    }
  );

  return res.json();
};

// VERIFY OTP
export const verifyEmailUpdateOtp = async (email, otp) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/user/verify-email-update-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp }),
    }
  );

  return res.json();
};

// UPDATE PROFILE INFO
export const updateProfileInfo = async (formData) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/user/update-profile-info`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    }
  );

  return res.json();
};

export const updateAvatar = async (avatarUrl) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/user/update-avatar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ avatar: avatarUrl }),
    }
  );

  return res.json();
};

export const changePassword = async (formData) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/user/change-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    }
  );

  return res.json();
};
export const logout = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/user/logout`, {
    method: "POST",
    credentials: "include",
  });

  return res.json();
};

export const updateUserSettings = async (payload) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/user/update-setting`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    return await res.json(); // returns {success, action, settings}
  } catch (err) {
    console.log("Update Settings Error:", err);
    return { success: false, message: "Network error" };
  }
};

export const fetchUserSettings = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/user/get-setting`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    return await res.json(); // returns {success, settings}
  } catch (err) {
    console.log("Fetch Settings Error:", err);
    return { success: false, message: "Network error" };
  }
};
