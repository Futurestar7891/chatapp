
export const checkAuth = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-auth`, {
      method: "GET",
      credentials: "include", 
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user; 
  } catch (error) {
    console.log(error);
    return null;

  }
};
