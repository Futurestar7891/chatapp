import React, { useEffect, useRef } from "react";
import Styles from "../Modules/MessageActionsPopUp.module.css";

export default function MessageActionsPopup({
  isSender,
  actions,
  onSelect,
  onClose,
  ignoreRef
}) {
 const popupRef = useRef();

 useEffect(() => {
   const handler = (e) => {
     if (
       popupRef.current &&
       !popupRef.current.contains(e.target) &&
       !ignoreRef?.current?.contains(e.target)
     ) {
       onClose();
     }
   };

   document.addEventListener("mousedown", handler);
   return () => document.removeEventListener("mousedown", handler);
 }, [onClose, ignoreRef]);

  return (
    <div
      ref={popupRef}
      className={`${Styles.Popup} ${isSender ? Styles.Right : Styles.Left}`}
    >
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
