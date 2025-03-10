import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import _ from "lodash";
import FilteredUsers from "./FilteredUsers";
import Options from "./Options";
import { StateContext } from "../../main";
import axios from "axios";
import "../../Css/Fetchchatlist.css";

const Fetchchatlist = ({socket}) => {
  const [search, setSearch] = useState("");
  const [chatusers, setChatUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const { showbar, setShowbar, setSelectedUser } =
    useContext(StateContext);

  const senderId = localStorage.getItem("id");

  const getCacheKey = useCallback(() => {
    return `chatList_${senderId}`;
  }, [senderId]);

  const fetchChatListFromApi = useCallback(async () => {
    if (!senderId || !socket) return null;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/search-chatlist`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      if (data.success) {
        return data.users || [];
      }
      throw new Error(data.message || "Failed to fetch chat list");
    } catch (error) {
      console.error("Error fetching chat list:", error);
      return null;
    }
  }, [senderId, socket]);

  const loadChatList = useCallback(async () => {
    if (!senderId || !socket) return;

    const cacheKey = getCacheKey();
    const cachedChatList = sessionStorage.getItem(cacheKey);

    if (cachedChatList) {
      const parsedChatList = JSON.parse(cachedChatList);
      setChatUsers(parsedChatList);
      setFilteredUsers(parsedChatList);
    }

    setLoading(true);
    const freshUsers = await fetchChatListFromApi();
    setLoading(false);
    setHasFetched(true);

    if (freshUsers) {
      setChatUsers(freshUsers);
      setFilteredUsers(freshUsers);
      sessionStorage.setItem(cacheKey, JSON.stringify(freshUsers));

      freshUsers.forEach((user) => {
        const roomId = [senderId, user._id].sort().join("-");
        socket.emit("joinRoom", roomId);
        console.log(`Proactively joined room: ${roomId}`);
      });
    }
  }, [senderId, socket, getCacheKey, fetchChatListFromApi]);

  useEffect(() => {
    loadChatList();
  }, [loadChatList]);

  // Add socket listener for new messages
  useEffect(() => {
    if (socket) {
      console.log("message is here");
      const handleReceiveMessage = (newMessage) => {
        console.log("Chatlist received message:", newMessage);
        // Refresh chat list when a message is sent or received
        loadChatList();
      };

      socket.on("receiveMessage", handleReceiveMessage);

      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
      };
    }
  }, [socket, loadChatList]);

  const fetchContacts = useCallback(async (keyword) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/api/filter-contact`,
        { keyword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  }, []);

  const handleSearch = useCallback(
    _.debounce((keyword) => {
      if (keyword.trim() === "") {
        setFilteredUsers(chatusers);
        setContacts([]);
      } else {
        const filtered = chatusers.filter((user) =>
          user.Name.toLowerCase().includes(keyword.toLowerCase())
        );
        setFilteredUsers(filtered);

        if (filtered.length <= 5) {
          fetchContacts(keyword);
        } else {
          setContacts([]);
        }
      }
    }, 300),
    [chatusers, fetchContacts]
  );

  const handleInputChange = useCallback(
    (e) => {
      const keyword = e.target.value;
      setSearch(keyword);
      handleSearch(keyword);
    },
    [handleSearch]
  );

  const renderedChatList = useMemo(() => {
    return filteredUsers.map((user, index) => (
      <div
        key={index}
        onClick={() => setSelectedUser(user)}
        className="Filteredusermaindiv"
      >
        <FilteredUsers user={user} />
      </div>
    ));
  }, [filteredUsers, setSelectedUser]);

  const renderedContacts = useMemo(() => {
    return contacts.map((contact, index) => (
      <div
        key={index}
        onClick={() => setSelectedUser(contact)}
        className="Filteredusermaindiv"
      >
        <FilteredUsers user={contact} />
      </div>
    ));
  }, [contacts, setSelectedUser]);

  if (!senderId) {
    return (
      <div className="Chatappleftdiv">
        <div style={{ padding: "20px", color: "red" }}>
          Please log in to use the chat.
        </div>
      </div>
    );
  }

  return (
    <div className="Chatappleftdiv">
      <div className="Searchuserinput">
        <div>
          <FontAwesomeIcon
            onClick={() => setShowbar(!showbar)}
            style={{ fontSize: "2vw", cursor: "pointer" }}
            icon={faBars}
          />
        </div>
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          placeholder="Search users..."
        />
      </div>

      {loading && chatusers.length === 0 ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : filteredUsers.length > 0 || contacts.length > 0 ? (
        <div className="Searchusers">
          {filteredUsers.length > 0 && <h2>Chats</h2>}
          {renderedChatList}

          {filteredUsers.length <= 5 && contacts.length > 0 && (
            <div className="Otherusers">
              <h2>Other Contacts</h2>
              {renderedContacts}
            </div>
          )}
        </div>
      ) : hasFetched && chatusers.length === 0 ? (
        <div className="Searchusers">Chat not found</div>
      ) : null}
      {showbar ? <Options /> : ""}
    </div>
  );
};

export default Fetchchatlist;
