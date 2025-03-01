
const cloudinary = require("./index");

const uploadToCloudinary = async (fileData, options = {}) => {
  try {
    // Ensure fileData is in the correct format (base64)
    let uploadData = fileData;
    if (typeof fileData === "object" && fileData.data && fileData.type) {
      if (!fileData.data.startsWith("data:")) {
        uploadData = `data:${fileData.type};base64,${fileData.data}`;
      }
    }

    const uploadResponse = await cloudinary.uploader.upload(uploadData, {
      ...options,
      resource_type: options.resource_type || "auto",
      timeout: 120000, // Set a timeout to avoid hanging
    });

    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

module.exports = { uploadToCloudinary };
