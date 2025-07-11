import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StateContext } from "../../main";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPhone,
  faVideo,
  faFile,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import "../../Css/PublicProfile.css";

const PublicProfile = () => {
  const {
    showuserpublicprofiledata,
    showpublicprofile,
    setShowPublicProfile,
    showOtpPopup,
    setShowOtpPopup,
    isBlocked,
    setIsBlocked,
    isInContactList,
    setIsInContactList,
    isMobile,
  } = useContext(StateContext);

  const [isEditing, setIsEditing] = useState(false);
  const [selectImage, setSelectImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    Name: showuserpublicprofiledata.Name || "",
    Bio: showuserpublicprofiledata.Bio || "",
    Email: showuserpublicprofiledata.Email || "",
    Mobile: showuserpublicprofiledata.Mobile || "",
  });
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlockAndContactStatus = async () => {
      if (!showuserpublicprofiledata?._id) return;

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("id");
      const receiverId = showuserpublicprofiledata._id;

      try {
        const blockResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_API_URL}/api/fetch-messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              senderid: userId,
              receiverid: receiverId,
            }),
          }
        );
        const blockData = await blockResponse.json();
        if (blockData.success) {
          setIsBlocked(blockData.isBlocked);
        }

        const contactResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_API_URL}/api/search-contact`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ receiverId }),
          }
        );
        const contactData = await contactResponse.json();
        if (contactData.success) {
          setIsInContactList(contactData.isInContactList);
        }
      } catch (error) {
        console.error("Error fetching block and contact status:", error);
      }
    };

    fetchBlockAndContactStatus();
  }, [showuserpublicprofiledata, setIsBlocked, setIsInContactList]);

  useEffect(() => {
    let interval;
    if (showOtpPopup && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setShowOtpPopup(false);
      setOtpError("OTP expired. Please request a new update.");
    }
    return () => clearInterval(interval);
  }, [showOtpPopup, timer, setShowOtpPopup]);

  const handleEditClick = () => setIsEditing(!isEditing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const changeProfile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert("Image size should be less than 5MB");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => setSelectImage(reader.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveClick = async () => {
    setIsLoading(true);
    setErrors({});

    const token = localStorage.getItem("token");
    const formDataToSend = {
      Name: formData.Name,
      Bio: formData.Bio,
      Email: formData.Email,
      Mobile: formData.Mobile,
      Photo: selectImage || null,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/update-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formDataToSend),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          setErrors(data.error);
          if (data.message) {
            alert(data.message);
          }
        } else {
          throw new Error(data.message || "Failed to update profile");
        }
        return;
      }

      if (data.requiresOtp) {
        setShowOtpPopup(true);
        setTimer(300);
        setOtp("");
        setOtpError("");
      } else {
        updateLocalStorage(data.user);
        setShowPublicProfile(false);
        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp || otp.trim() === "") {
      setOtpError("Please enter the OTP");
      return;
    }
    if (otp.length !== 4) {
      setOtpError("Please enter a valid 4-digit OTP");
      return;
    }

    setIsLoading(true);
    setOtpError("");

    const token = localStorage.getItem("token");
    const formDataToSend = {
      Name: formData.Name,
      Bio: formData.Bio,
      Email: formData.Email,
      Mobile: formData.Mobile,
      Photo: selectImage || null,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/validateprofileotp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...formDataToSend, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOtpError(
          data.message ||
            "Failed to validate OTP. Please try again or request a new one."
        );
        return;
      }

      updateLocalStorage(data.user);
      setShowOtpPopup(false);
      setShowPublicProfile(false);
      setIsEditing(false);
      alert(data.message || "Profile updated successfully");
    } catch (error) {
      console.error("Error validating OTP:", error);
      setOtpError("A network error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocalStorage = (userData) => {
    if (userData.Name) localStorage.setItem("Name", userData.Name);
    if (userData.Email) localStorage.setItem("Email", userData.Email);
    if (userData.Mobile) localStorage.setItem("Mobile", userData.Mobile);
    if (userData.Bio) localStorage.setItem("Bio", userData.Bio);
    if (userData.Photo) localStorage.setItem("Photo", userData.Photo);
  };

  const handleBlockClick = async () => {
    const token = localStorage.getItem("token");
    const blockedUserId = showuserpublicprofiledata._id;
    const blockendpoint = isBlocked ? "unblock-user" : "block-user";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/${blockendpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ blockedUserId: blockedUserId }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setIsBlocked(data.isBlocked);
        setShowPublicProfile(false);
      } else {
        console.error("Failed to block/unblock user:", data.message);
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
    }
  };

  useEffect(() => {
    if (errors.Email) alert(errors.Email);
    if (errors.Name) alert(errors.Name);
    if (errors.Mobile) alert(errors.Mobile);
  }, [errors]);

  return (
    <div className="PublicProilemaindiv">
      {isLoading && (
        <div className="full-page-loader">
          <div className="loader-content">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Processing...</p>
          </div>
        </div>
      )}

      <div className="PublicProfiletopdiv">
        {(selectImage || showuserpublicprofiledata.Photo) && (
          <img
            src={selectImage || showuserpublicprofiledata.Photo}
            onClick={isEditing ? changeProfile : null}
            style={{ cursor: isEditing ? "pointer" : "default" }}
            alt="Profile"
          />
        )}
        {isEditing ? (
          <input
            className="editpublicprofilename"
            type="text"
            name="Name"
            value={formData.Name}
            onChange={handleInputChange}
            placeholder="Enter Your Name"
            required
            disabled={isLoading}
          />
        ) : (
          <p>{showuserpublicprofiledata.Name || "No Name"}</p>
        )}
        {showuserpublicprofiledata._id !== localStorage.getItem("id") &&
          !isInContactList && (
            <button
              className="add-contact-button"
              onClick={() => navigate("/add-contact")}
              disabled={isLoading}
            >
              Add Contact
            </button>
          )}
      </div>
      <div className="PublicProfilemiddiv">
        <button
          onClick={() => {
            if (isMobile) {
              navigate("/fetchmessage");
            } else {
              setShowPublicProfile(!showpublicprofile);
            }
          }}
          disabled={isLoading}
        >
          <FontAwesomeIcon className="publicprofileicon" icon={faMessage} />
        </button>
        <button disabled={isLoading}>
          <FontAwesomeIcon className="publicprofileicon" icon={faPhone} />
        </button>
        <button disabled={isLoading}>
          <FontAwesomeIcon className="publicprofileicon" icon={faVideo} />
        </button>
        <button disabled={isLoading}>
          <FontAwesomeIcon className="publicprofileicon" icon={faFile} />
        </button>
      </div>
      <div className="PublicProfilebiodiv">
        {isEditing ? (
          <textarea
            className="editpublicprofilebio"
            name="Bio"
            value={formData.Bio}
            onChange={handleInputChange}
            placeholder="Bio"
            disabled={isLoading}
          />
        ) : showuserpublicprofiledata.Bio ? (
          <p>{showuserpublicprofiledata.Bio}</p>
        ) : (
          ""
        )}
      </div>
      <div className="PublicProfiledowndiv">
        {isEditing ? (
          <textarea
            className="editpublicprofileemail"
            name="Email"
            value={formData.Email}
            onChange={handleInputChange}
            placeholder="Email"
            disabled={isLoading}
          />
        ) : (
          <p>{showuserpublicprofiledata.Email || "No Email"}</p>
        )}
        {isEditing ? (
          <textarea
            className="editpublicprofilemobile"
            name="Mobile"
            value={formData.Mobile}
            onChange={handleInputChange}
            placeholder="Mobile"
            disabled={isLoading}
          />
        ) : (
          <p>{showuserpublicprofiledata.Mobile || "No Mobile"}</p>
        )}
        {showuserpublicprofiledata._id === localStorage.getItem("id") ? (
          isEditing ? (
            <button
              className="editprofilesavebutton"
              onClick={handleSaveClick}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          ) : (
            <button
              className="editprofileeditbutton"
              onClick={handleEditClick}
              disabled={isLoading}
            >
              Edit Profile
            </button>
          )
        ) : (
          <button
            className="blockuserbutton"
            onClick={handleBlockClick}
            disabled={isLoading}
          >
            {isBlocked ? "Unblock" : "Block"}
          </button>
        )}
      </div>

      <div className="PublicProfilecommomgroup">
        <h2>Common Groups</h2>
      </div>

      {showOtpPopup && (
        <div className="otp-popup">
          <div className="otp-popup-content">
            <h3>Verify Email Change</h3>
            <p>A 4-digit OTP has been sent to your new email address.</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (otpError) setOtpError("");
              }}
              placeholder="Enter OTP"
              disabled={isLoading}
              maxLength={4}
            />
            {otpError && <div className="otp-error">{otpError}</div>}
            <p>
              Time remaining: {Math.floor(timer / 60)}:
              {timer % 60 < 10 ? `0${timer % 60}` : timer % 60}
            </p>
            <div className="otp-buttons">
              <button
                onClick={handleOtpSubmit}
                disabled={isLoading || otp.length !== 4}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Verifying...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
              <button
                onClick={() => {
                  setShowOtpPopup(false);
                  setOtpError("");
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
