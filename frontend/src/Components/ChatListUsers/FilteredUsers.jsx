import { StateContext } from "../../main";
import { useContext } from "react";
import "../../Css/FilteredUsers.css";
import { useNavigate } from "react-router-dom";

const FilteredUsers = ({ user }) => {
  const { setShowPublicProfile, setSelectedUser, isMobile } =
    useContext(StateContext);
  const navigate = useNavigate();

  const lastMessageTime = user.lastMessageTime
    ? new Date(user.lastMessageTime)
    : null;
  const displayName =
    user.Name.length > 15 ? user.Name.substring(0, 15) + "..." : user.Name;

  const handleClick = () => {
    if (isMobile) {
      navigate("/fetchmessage");
      return;
    }
    setSelectedUser({});
    setSelectedUser(user);
    setShowPublicProfile(false);
  };

  return (
    <>
      <div onClick={handleClick} className="Filtereduserleftdiv">
        <div className="Filtereduserphoto">
          {user.Photo ? (
            <img
              style={{ cursor: "pointer" }}
              src={user.Photo}
              alt={user.Name}
            />
          ) : (
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: "#ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              {displayName[0]} {/* Show initial if no photo */}
            </div>
          )}
        </div>

        <div style={{ cursor: "pointer" }} className="Filteredusernamedetail">
          <h2>{displayName}</h2>
          <p>{user.recentmsg || "No recent messages"}</p>
        </div>
      </div>
      <div className="Filtereduserrightdiv">
        {lastMessageTime && !isNaN(lastMessageTime) ? (
          <>
            <p>{lastMessageTime.toLocaleDateString()}</p>
            <p>{lastMessageTime.toLocaleTimeString()}</p>
          </>
        ) : (
          <p>No time available</p>
        )}
      </div>
    </>
  );
};

export default FilteredUsers;
