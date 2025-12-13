import { useRef, useState, useEffect } from "react";
import Styles from "../../Modules/OtpPopUp.module.css";


const OtpPopUp = ({ onClose, onVerify, onResend, error,loading }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);

  const inputs = useRef([]);

  /* ---------------- TIMER ---------------- */
 useEffect(() => {
   if (timeLeft <= 0) {
     // eslint-disable-next-line react-hooks/set-state-in-effect
     setCanResend(true);
     return;
   }

   const timer = setInterval(() => {
     setTimeLeft((prev) => {
       if (prev <= 1) {
         setCanResend(true);
         return 0;
       }
       return prev - 1;
     });
   }, 1000);

   return () => clearInterval(timer);
 }, [timeLeft]);

 useEffect(() => {
   if (inputs.current[0]) {
     inputs.current[0].focus();
   }
 }, []);

  const formatTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  /* ---------------- INPUT ---------------- */
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const submitOtp = () => {
    const finalOtp = otp.join("");
    onVerify(finalOtp);
  };

  const resend = () => {
    if (!canResend) return;
    onResend();

    setOtp(["", "", "", "", "", ""]);
    setTimeLeft(600);
    setCanResend(false);
  };

  return (
    <div className={Styles.overlay}>
      <div className={Styles.popup}>
        <h2 className={Styles.title}>Verify OTP</h2>

        {error && <p className={Styles.error}>{error}</p>}

        <div className={Styles.otpContainer}>
          {otp.map((digit, index) => (
            <input
              key={index}
              type="tel" // Better mobile keyboard
              inputMode="numeric" // Shows numeric keyboard
              pattern="[0-9]*" // Mobile optimization
              autoComplete="one-time-code" // iOS autofill
              ref={(el) => (inputs.current[index] = el)}
              className={Styles.otpBox}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        <p className={Styles.timer}>
          {canResend ? "You can resend OTP now" : `Resend in ${formatTime()}`}
        </p>

        <button
          className={`${Styles.resend} ${canResend ? Styles.active : ""}`}
          disabled={!canResend}
          onClick={resend}
        >
          Resend OTP
        </button>

        {loading ? (
          <button className={Styles.verify} disabled={loading}>
            Verifing
          </button>
        ) : (
          <button
            className={Styles.verify}
            onClick={submitOtp}
            disabled={loading} // Prevent double submit
          >
            Verify OTP
          </button>
        )}

        <button className={Styles.cancel} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OtpPopUp;
