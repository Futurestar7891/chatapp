export const getChatList = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/chat/get-chat-list`,
      {
        method: "GET",
        credentials: "include", // VERY IMPORTANT
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch chat list");
    }

    return data.chats;
  } catch (error) {
    console.error("ChatList Fetch Error:", error);
    throw error;
  }
};
export const getContactList=async(keyword)=>{
   
   try {
     const response = await fetch(
       `${
         import.meta.env.VITE_API_URL
       }/chat/get-contact-list?keyword=${keyword}`,
       {
         method: "GET",
         credentials: "include", // VERY IMPORTANT
         headers: {
           "Content-Type": "application/json",
         },
       }
     );

     const data = await response.json();

     if (!response.ok) {
       throw new Error(data.message || "Failed to fetch chat list");
     }

     return data.contacts;
   } catch (error) {
     console.error("ChatList Fetch Error:", error);
     throw error;
   }
}
export const markChatSeen=async(receiverId)=>{
  try {
     const response= await fetch(`${import.meta.env.VITE_API_URL}/chat/seen/${receiverId}`, {
        method: "POST",
        credentials: "include",
      });

      return await response.json();
  } catch (error) {
     console.log("netword error",error);
  }
}