import React, { useContext,memo, useEffect } from "react";
import ChatList from "../../Components/ChatList";
import ChatWindow from "../../Components/ChatWindow";
import { ChatContext } from "../../Context/ChatContext";
import Styles from "../../Modules/Home.module.css";
import { AuthContext } from "../../Context/AuthContext";


function Home() {
  const { receiverId } = useContext(ChatContext);
  const {loading}=useContext(AuthContext);

 

   if (loading) {
     return (
       <div className={Styles.HomeContainer}>
         <div className={Styles.skeletonChatList}></div>
         <div className={Styles.skeletonChatWindow}></div>
       </div>
     );
   }

  return (
    <div className={Styles.HomeContainer}>
      <div
        className={`${Styles.ChatListWrapper} ${
          receiverId ? Styles.hideMobile : ""
        }`}
      >
        <ChatList />
      </div>

      <div
        className={`${Styles.ChatWindowWrapper} ${
          receiverId ? Styles.showMobile : ""
        }`}
      >
        <ChatWindow />
      </div>
    </div>
  );
}

export default memo(Home);
