
import dotenv from "dotenv";

dotenv.config();

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOTP = async (email, otp) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_EMAIL, // must be your verified Gmail
      subject: "Your OTP Verification Code",
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2>OTP Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="background:#000;color:#fff;padding:10px;width:max-content;border-radius:6px;">
            ${otp}
          </h1>
          <p>This OTP will expire in <b>10 minutes</b>.</p>
        </div>
      `,
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    };

    await sgMail.send(msg);
    console.log("OTP sent to email:", email);

    return true;
  } catch (error) {
    console.error("Error sending OTP:", error.response?.body || error.message);
    return false;
  }
};

