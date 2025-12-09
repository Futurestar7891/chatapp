import User from "../Models/User.js";

export const checkAuth = async (req, res) => {
  try {
    const userExist = await User.findById(req.user.id).select("-password");

    return res.status(200).json({
      user: userExist,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
