import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import "../../Css/EmojiPicker.css";
const EmojisPicker = ({ onEmojiSelect }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiObject) => {
    onEmojiSelect(emojiObject.emoji);
    setShowPicker(false);
  };

  return (
    <div style={{ position: "relative", zIndex: "2" }}>
      <button type="button" onClick={() => setShowPicker(!showPicker)}>
        😊
      </button>
      {showPicker && (
        <div style={{ position: "absolute", bottom: "40px", left: "0" }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default EmojisPicker;
