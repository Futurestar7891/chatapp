import { StateContext } from "../main";
import { useContext } from "react";

const FilteredUsers = ({ user }) => {
  const { setShowPublicProfile, setSelectedUser } = useContext(StateContext);

  const lastMessageTime = user.lastMessageTime
    ? new Date(user.lastMessageTime)
    : null;
  const displayName =
    user.Name.length > 15 ? user.Name.substring(0, 15) + "..." : user.Name;

  const handleClick = () => {
    setSelectedUser(user);
    setShowPublicProfile(false);
  };

  return (
    <>
      <div onClick={handleClick} className="Filtereduserleftdiv">
        <div className="Filtereduserphoto">
          {user.Photo && (
            <img
              style={{ cursor: "pointer" }}
              src={user.Photo}
              alt={user.Name}
            />
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
