import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
};

export const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.GMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Chat With Me" <${process.env.GMAIL}>`,
      to: email,
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
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP sent to email:", email);

    return true;
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return false;
  }
};
