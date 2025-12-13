export const getMessages = async ({ receiverId }) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/message/${receiverId}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await res.json();
    return data.success ? data.messages : [];
  } catch (err) {
    console.error("Message fetch error:", err);
    return [];
  }
};
// --------------------------------------------------
// 1) Upload file to Cloudinary
// --------------------------------------------------
export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET);

  // Cloudinary auto-detects file type if you use "auto"
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUD_NAME
    }/auto/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary Upload Error:", data);
    throw new Error(data.error?.message || "Upload failed");
  }

  return data.secure_url;
};

const buildReplyPayload = (msg) => {
  if (!msg) return null;

  const sender =
    typeof msg.sender === "object"
      ? msg.sender
      : msg.sender
      ? { _id: msg.sender }
      : null;

  return {
    _id: msg._id,
    text: msg.text || "",
    mediaType: msg.mediaType || null,
    mediaUrl: msg.mediaUrl || null,
    sender: sender
      ? {
          _id: sender._id,
          name: sender.name || "User",
        }
      : null,
  };
};


// --------------------------------------------------
// 2) TEMPORARY MESSAGE + SEND MESSAGE
// --------------------------------------------------
export const sendMessage = async ({
  receiverId,
  text,
  mediaUrl,
  mediaType,
  user,
  setMessages,
  setChatList,
  filename,
  replyToMessage
}) => {
  const tempId = "temp-" + Date.now();

  // 1️⃣ TEMP MESSAGE (Optimistic UI)
  const tempMessage = {
    _id: tempId,
    chatId: null,
    sender: {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
    },
    receiver: receiverId,
    text,
    filename: filename || "",
    mediaUrl: mediaUrl || "",
    mediaType: mediaType || null,
    status: "sending",
    createdAt: new Date(),
    replyTo: buildReplyPayload(replyToMessage),
  };
console.log(tempMessage);
  // Add temp message to UI immediately
  setMessages((prev) => [...prev, tempMessage]);

  try {
    // 2️⃣ SEND TO SERVER
    const res = await fetch(`${import.meta.env.VITE_API_URL}/message/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId,
        text,
        mediaUrl,
        mediaType,
        filename,
        replyTo: buildReplyPayload(replyToMessage),
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error();

    const realMessage = data.message;
    
    setChatList(data.chatlist);

    // 3️⃣ REPLACE TEMP MESSAGE WITH REAL ONE
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === tempId ? { ...realMessage, status: "sent" } : msg
      )
    );
    
  } catch (err) {
    console.error("Send failed:", err);

    // 5️⃣ SHOW FAILED STATUS
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === tempId ? { ...msg, status: "failed" } : msg
      )
    );
  }
};

// --------------------------------------------------
// 3) DETECT MEDIA TYPE
// --------------------------------------------------
const detectMediaType = (file) => {
  if (file.type.startsWith("image")) return "image";
  if (file.type.startsWith("video")) return "video";
  if (file.type.startsWith("audio")) return "audio";

  return "file"; // pdf, zip, doc, txt etc.
};


// --------------------------------------------------
// 4) Compose & send text + attachments
// --------------------------------------------------
export const composeMessage = async ({
  receiverId,
  user,
  text,
  attachments,
  setMessages,
  setChatList,
  replyToMessage,
}) => {
  // Send text
  if (text?.trim()) {
    await sendMessage({ receiverId, text, user, setMessages,setChatList,replyToMessage });
  }

  console.log(attachments);

  // Send each file
  for (let file of attachments) {
    const mediaUrl = await uploadFile(file);
    const mediaType = detectMediaType(file);

    

    await sendMessage({
      receiverId,
      text: "",
      mediaUrl,
      mediaType,
      user,
      setMessages,
      filename:file.name,
      setChatList,
      replyToMessage
    });
  }
};
