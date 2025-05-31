import { useState, useEffect } from "react";
import { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Try to load user from localStorage on mount
    const savedUser = localStorage.getItem('borrowbee_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('borrowbee_user');
      }
    }
  }, []);

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('borrowbee_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('borrowbee_user');
    }
  };

  const logout = () => {
    updateUser(null);
    window.location.href = '/';
  };

  return {
    user,
    setUser: updateUser,
    logout,
  };
}
