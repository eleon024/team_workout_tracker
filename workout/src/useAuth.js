import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase'; // Firebase auth instance

const AuthContext = createContext(); // Create the context

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Store user in state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user); // Update currentUser when auth state changes
    });
    return unsubscribe; // Cleanup listener on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}> {/* Provide the current user to context */}
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access AuthContext
export const useAuth = () => {
  return useContext(AuthContext); // Return currentUser from context
};
