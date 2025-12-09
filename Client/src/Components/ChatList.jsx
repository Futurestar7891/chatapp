import React, { useContext, useEffect, useMemo, useState } from "react";
import ChatCard from "../Cards/ChatCard";
import SearchCard from "../Cards/SearchCard";
import Styles from "../Modules/ChatList.module.css";
import { ChatContext } from "../Context/ChatContext";
import { getContactList } from "../utils/chat";

function ChatList() {
  const { chatList } = useContext(ChatContext);
  const [searchText, setSearchText] = useState("");
  const [contactList, setContactList] = useState([]);

  // 1️⃣ Filter chat list based on search
  const filteredChatList = useMemo(() => {
    if (!searchText.trim()) return chatList;

    const lower = searchText.toLowerCase();

    return chatList.filter((chat) => {
      const name = chat.user.name.toLowerCase();
      const mobile = chat.user.mobile || "";
      return name.includes(lower) || mobile.includes(searchText);
    });
  }, [chatList, searchText]);

  // 2️⃣ Fetch contact list when chatList search = 0
  useEffect(() => {
    const fetchContacts = async () => {
      if (searchText.trim() && filteredChatList.length === 0) {
        try {
          const contacts = await getContactList(searchText);
          setContactList(contacts);
        } catch (err) {
          console.error("Failed to fetch contacts:", err);
        }
      } else {
        setContactList([]); 
      }
    };

    fetchContacts();
  }, [searchText, filteredChatList]);

 

  return (
    <div className={Styles.ChatListContainer}>
      <SearchCard setSearchText={setSearchText} />

      <div className={Styles.ChatCardContainer}>
        {/* 1️⃣ Show Chats When Available */}
        {filteredChatList.length > 0 &&
          filteredChatList.map((chat) => (
            <ChatCard key={chat.chatId} data={chat} />
          ))}

        {/* 2️⃣ If no chats → show contact search results */}
        {filteredChatList.length === 0 &&
          contactList.length > 0 &&
          contactList.map((user) => (
          
              <ChatCard key={user._id}  data={user} />
        
          ))}

        {/* 3️⃣ If nothing found */}
        {filteredChatList.length === 0 && contactList.length === 0 && (
          <p>No results found</p>
        )}
      </div>
    </div>
  );
}

export default ChatList;
