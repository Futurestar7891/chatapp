/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useMemo } from "react";
import { checkAuth } from "../utils/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 
   useEffect(() => {
     let isMounted = true; // 🚀 Prevent state update if component unmounted

     const verifyAuth = async () => {
       try {
         const authUser = await checkAuth();

         if (isMounted) {
           // 🚀 Only update state if component still mounted
           if (authUser) {
             setUser(authUser);
             setIsLoggedIn(true);
           } else {
             setUser(null);
             setIsLoggedIn(false);
           }
           setLoading(false);
         }
       } catch (error) {
         if (isMounted) {
           console.error("Auth check failed:", error);
           setUser(null);
           setIsLoggedIn(false);
           setLoading(false);
         }
       }
     };

     verifyAuth();

     return () => {
       isMounted = false; // 
     };
   }, []);

  const value = useMemo(
    () => ({
      isLoggedIn,
      setIsLoggedIn,
      user,
      setUser,
      loading,
      setLoading,
    }),
    [isLoggedIn, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
