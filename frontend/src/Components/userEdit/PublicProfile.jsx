import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { StateContext } from "../../main";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPhone,
  faVideo,
  faFile,
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
  const navigate = useNavigate();

  // Timer for OTP popup
  useEffect(() => {
    let interval;
    if (showOtpPopup && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setShowOtpPopup(false);
    }
    return () => clearInterval(interval);
  }, [showOtpPopup, timer, setShowOtpPopup]);

  const handleEditClick = () => setIsEditing(!isEditing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const changeProfile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setSelectImage(reader.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSaveClick = async () => {
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
      if (response.ok) {
        localStorage.setItem("Mobile", data.updatedUser.Mobile);
        localStorage.setItem("Photo", data.updatedUser.Photo);
        localStorage.setItem("Name", data.updatedUser.Name);
        localStorage.setItem("Bio", data.updatedUser.Bio);

        if (data.Otpsent === false) {
          setShowPublicProfile(!showpublicprofile);
          alert("Profile updated successfully!");
        } else {
          alert(data.message);
          setShowOtpPopup(true);
          setTimer(300);
        }
      } else {
        setErrors(data.error || {});
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleOtpSubmit = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/validateprofileotp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setShowOtpPopup(false);
        setShowPublicProfile(!showpublicprofile);
        localStorage.setItem("Email", data.Email);
        alert(data.message);
      } else {
        alert(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error validating OTP:", error);
      alert("An error occurred. Please try again.");
    }
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
          />
        ) : (
          <p>{showuserpublicprofiledata.Name || "No Name"}</p>
        )}
        {/* Conditionally render Add Contact button */}
        {showuserpublicprofiledata._id !== localStorage.getItem("id") &&
          !isInContactList && (
            <button
              className="add-contact-button"
              onClick={() => navigate("/add-contact")}
            >
              Add Contact
            </button>
          )}
      </div>
      <div className="PublicProfilemiddiv">
        <button onClick={() => setShowPublicProfile(!showpublicprofile)}>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faMessage} />
        </button>
        <button>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faPhone} />
        </button>
        <button>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faVideo} />
        </button>
        <button>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faFile} />
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
          />
        ) : (
          <p>{showuserpublicprofiledata.Mobile || "No Mobile"}</p>
        )}
        {showuserpublicprofiledata._id === localStorage.getItem("id") ? (
          isEditing ? (
            <button className="editprofilesavebutton" onClick={handleSaveClick}>
              Save
            </button>
          ) : (
            <button className="editprofileeditbutton" onClick={handleEditClick}>
              Edit Profile
            </button>
          )
        ) : (
          <button className="blockuserbutton" onClick={handleBlockClick}>
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
            <h3>Enter OTP</h3>
            <p>A 4-digit OTP has been sent to your email.</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
            />
            <p>
              Time remaining: {Math.floor(timer / 60)}:
              {timer % 60 < 10 ? `0${timer % 60}` : timer % 60}
            </p>
            <button onClick={handleOtpSubmit}>Submit</button>
            <button onClick={() => setShowOtpPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
