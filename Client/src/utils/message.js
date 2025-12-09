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



// --------------------------------------------------
// 2) TEMPORARY MESSAGE + SEND MESSAGE
// --------------------------------------------------
export const sendMessage = async ({
  receiverId,
  text,
  mediaUrl,
  mediaType,
  userId,
  setMessages,
  filename,
}) => {
  const tempId = "temp-" + Date.now();

  const tempMessage = {
    _id: tempId,
    chatId: null,
    sender: userId,
    receiver: receiverId,
    text,
    filename: filename,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    status: "sending",
    createdAt: new Date(),
  };

  setMessages((prev) => [...prev, tempMessage]);

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/message/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, text, mediaUrl, mediaType ,filename}),
    });

    const data = await res.json();
    if (!data.success) throw new Error();

    const realMessage = data.message;

    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === tempId ? { ...realMessage, status: "sent" } : msg
      )
    );
  } catch (err) {
    console.error("Send failed:", err);

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
  userId,
  text,
  attachments,
  setMessages,
}) => {
  // Send text
  if (text?.trim()) {
    await sendMessage({ receiverId, text, userId, setMessages });
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
      userId,
      setMessages,
      filename:file.name
    });
  }
};
