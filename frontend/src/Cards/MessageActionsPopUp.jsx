import React from "react";
import Styles from "../Modules/MessageActionsPopUp.module.css";

export default function MessageActionsPopup({ isSender,actions, onSelect, onClose }) {
  return (
    <div className={`${Styles.Popup} ${
            isSender ? Styles.Right : Styles.Left
          }`}>
      {actions.map((a) => (
        <div
          key={a.key}
          className={Styles.Item}
          onClick={() => onSelect(a.key)}
        >
          {a.label}
        </div>
      ))}

      <div className={Styles.Cancel} onClick={onClose}>
        Cancel
      </div>
    </div>
  );
}
