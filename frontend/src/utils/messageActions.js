// Action list generator based on message type & sender status
export const getMessageActions = ({ message, isSender }) => {
  const type = message.mediaType || "text";

  const common = [
    { key: "info", label: "Message Info" },
    { key: "forward", label: "Forward" },
    { key: "reply", label: "Reply" },
  ];

  const deleteOptions = isSender
    ? [
        { key: "deleteForMe", label: "Delete for Me" },
        { key: "deleteForEveryone", label: "Delete for Everyone" },
      ]
    : [{ key: "deleteForMe", label: "Delete for Me" }];

  if (type === "text") {
    return [{ key: "copy", label: "Copy Text" }, ...common, ...deleteOptions];
  }

  if (
    type === "image" ||
    type === "video" ||
    type === "audio" ||
    type === "file"
  ) {
    return [
      ...common,
      { key: "save", label: "Save to Device" },
      ...deleteOptions,
    ];
  }

  return [...common, ...deleteOptions];
};

// 1️⃣ Copy text
export const copyText = async (message) => {
  try {
    await navigator.clipboard.writeText(message.text || "");
    console.log("Text copied:", message.text);
    return true;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
};

// 2️⃣ Save media (image, video, audio, file)
export const saveMedia = (mediaUrl) => {
  try {
    let url = mediaUrl;

    // Force download for Cloudinary
    if (url.includes("cloudinary")) {
      const parts = url.split("/upload/");
      if (parts.length === 2) {
        url = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
      }
    }

    const fileName = url.split("/").pop();

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    console.log("Saved:", fileName);
    return true;
  } catch (err) {
    console.error("Save failed:", err);
    return false;
  }
};


export const deleteForMe = async (messageId) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/message/deleteForMe/${messageId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();
    console.log("Deleted for me:", data);
    return data;
  } catch (err) {
    console.error("Delete for me failed:", err);
    return null;
  }
};
// 4️⃣ Delete for everyone
export const deleteForEveryone = async (messageId) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/message/deleteForEveryone/${messageId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();
    console.log("Deleted for everyone:", data);
    return data;
  } catch (err) {
    console.error("Delete for everyone failed:", err);
    return null;
  }
};

// 6️⃣ Forward message
export const openForwardUI = (message) => {
  console.log("Forward message:", message);

  // Later:
  // openModal(<ForwardMessage message={message} />)

  alert("Forward message feature coming soon!");
};
// 7️⃣ Reply to message
export const startReply = (message) => {
  console.log("Replying to:", message);

  // You will set reply message in context or state:
  // setReplyMessage(message)

  alert("Reply mode activated!");
};
