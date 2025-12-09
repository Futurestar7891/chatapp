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
