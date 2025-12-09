import React, { useState, useRef, useContext,useCallback,useEffect } from "react";
import { Search, Menu, User, Shield, Lock, Info, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Styles from "../Modules/SearchCard.module.css";
import { AuthContext } from "../Context/AuthContext";
import { logout } from "../utils/user";
import { ChatContext } from "../Context/ChatContext";

function SearchCard({ setSearchText }) {
  const { setUser, setIsLoggedIn } = useContext(AuthContext);
  const { setReceiverData, setReceiverId } = useContext(ChatContext);
  const debounceRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchText, setShowSearchText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(
    (e) => {
      const text = e.target.value;
      setShowSearchText(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setSearchText(text);
      }, 300);
    },
    [setSearchText]
  ); // Add dependency

  // ----------------------------
  // MENU CLICK HANDLERS
  // ----------------------------
  const goToProfile = (tabName) => {
    sessionStorage.setItem("activeTab", tabName);
    navigate("/profile");
    setShowMenu(false);
  };

 const handleLogout = async () => {
   if (loggingOut) return; // Prevent double click

   setLoggingOut(true);
   sessionStorage.removeItem("activeTab");

   const response = await logout();

   if (response.success) {
     setUser(null);
     setIsLoggedIn(false);
     sessionStorage.removeItem("receiverData");
     sessionStorage.removeItem("receiverId");
     setReceiverId(null);
     setReceiverData(null);
   } else {
     alert(response.message);
   }

   setShowMenu(false);
   setLoggingOut(false);
 };

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);


  return (
    <div className={Styles.header}>
      {/* ---------- TOP SECTION: Messages + Menu ----------- */}
      <div className={Styles.topRow}>
        <h1 className={Styles.title}>Messages</h1>

        <div ref={menuRef} className={Styles.menuWrapper}>
          <button
            className={Styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
          >
            <Menu size={24} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className={Styles.overlay}
                onClick={() => setShowMenu(false)}
              ></div>

              <div className={Styles.dropdown}>
                {/* PROFILE */}
                <button
                  className={Styles.dropdownItem}
                  onClick={() => goToProfile("personalInfo")}
                >
                  <User size={18} /> Profile
                </button>

                {/* PRIVACY */}
                <button
                  className={Styles.dropdownItem}
                  onClick={() => goToProfile("privacy")}
                >
                  <Shield size={18} /> Privacy
                </button>

                {/* SECURITY */}
                <button
                  className={Styles.dropdownItem}
                  onClick={() => goToProfile("security")}
                >
                  <Lock size={18} /> Security
                </button>

                {/* ABOUT */}
                <button
                  className={Styles.dropdownItem}
                  onClick={() => goToProfile("about")}
                >
                  <Info size={18} /> About
                </button>

                <div className={Styles.divider}></div>

                {/* LOGOUT */}
                <button
                  className={`${Styles.dropdownItem} ${Styles.logout}`}
                  onClick={handleLogout}
                >
                  <LogOut size={18} />{" "}
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- SEARCH BAR ---------- */}
      <div className={Styles.searchBox}>
        <Search size={18} className={Styles.searchIcon} />
        <input
          type="text"
          placeholder="Search conversations..."
          className={Styles.searchInput}
          value={showSearchText}
          onChange={handleSearch}
        />
      </div>
    </div>
  );
}

export default SearchCard;
