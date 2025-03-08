import { useContext, useState } from "react";
import "../../Css/AddContact.css"; // Import the CSS file for styling
import { useNavigate } from "react-router-dom";
import { StateContext } from "../../main";

function AddContact() {
  const navigate = useNavigate(); // Use navigate to go back or to another route
  const { showuserpublicprofiledata } = useContext(StateContext);

  const [contactData, setContactData] = useState({
    contactname: showuserpublicprofiledata?.Name || "",
    contactemail: showuserpublicprofiledata?.Email || "",
    contactmobile: showuserpublicprofiledata?.Mobile || "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactData({ ...contactData, [name]: value });
  };

  // Handle adding a contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/add-contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contactData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setError(null);
        alert("Contact added successfully!");
        navigate(-1); // Navigate back to the previous route (PublicProfile)
      } else {
        setError(data.message || "Failed to add contact.");
        setSuccess(null);
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      setError("An error occurred. Please try again.");
      setSuccess(null);
    }
  };

  return (
    <div className="add-contact-container">
      <h2>Add Contact</h2>
      <div className="add-contact-form">
        <form onSubmit={handleAddContact}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="contactname"
              value={contactData.contactname}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="contactemail"
              value={contactData.contactemail}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Mobile:</label>
            <input
              type="text"
              name="contactmobile"
              value={contactData.contactmobile}
              onChange={handleInputChange}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <div className="form-buttons">
            <button type="submit" className="submit-contact-button">
              Save Contact
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(-1)} // Navigate back to the previous route
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddContact;
