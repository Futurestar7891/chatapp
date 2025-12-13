/* eslint-disable react-refresh/only-export-components */
import toast from "react-hot-toast";
import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { checkAuth } from "../utils/auth";
import { fetchUserSettings } from "../utils/user";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const[userStatus,setUserStatus]=useState({
    show:false,
    isOnline:false,
    showAvatar:false,
    blockedByMe:false,
    blockedMe:false,
  })

  const [settings, setSettings] = useState({
    statusVisibility: "contacts",
    blockedUsers: [],
    blockedBy: [],
  });

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const authUser = await checkAuth();
        if (!isMounted) return;

        if (authUser) {
          setUser(authUser);
          setIsLoggedIn(true);
          const res = await fetchUserSettings();

          if (res.success && isMounted) {
            setSettings(res.settings);
          }
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }

        setLoading(false);
      } catch (error) {
        toast.error(error);
        setLoading(false);
      }
    };

    verifyAuth();
    return () => (isMounted = false);
  }, []);



  // ⭐ MASTER CALCULATION FUNCTION
  const computeRelationship = useCallback(
    (receiverId) => {

      const blockedByMe = settings.blockedUsers?.some(
        (u) => u._id === receiverId
      );

      const blockedMe = settings.blockedBy?.some((u) => u._id === receiverId);

      return {
        blockedByMe,
        blockedMe,
      };
    },
    [settings]
  );




  const value = useMemo(
    () => ({
      isLoggedIn,
      setIsLoggedIn,
      user,
      setUser,
      loading,
      setLoading,
      settings,
      setSettings,
      computeRelationship,
      userStatus,
      setUserStatus
      
    }),
    [isLoggedIn, user, loading, settings, computeRelationship,userStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
