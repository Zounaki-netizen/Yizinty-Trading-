import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('yizinity_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Shorter delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // CRITICAL FIX: Trim inputs to handle mobile keyboard auto-spacing
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const storedProfile = localStorage.getItem(`yizinity_user_profile_${cleanEmail}`);
    
    if (!storedProfile) {
        return false; // Account does not exist
    }

    const profile = JSON.parse(storedProfile);
    
    // Check password (trimmed)
    if (profile.password !== cleanPass) {
        return false; // Wrong password
    }

    const userObj = { name: profile.name, email: cleanEmail };
    setUser(userObj);
    localStorage.setItem('yizinity_user', JSON.stringify(userObj));
    return true;
  };

  const signup = async (email: string, name: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPass = password.trim();

    const newUser = { email: cleanEmail, name: cleanName, password: cleanPass };
    
    // Save a permanent profile record with password
    localStorage.setItem(`yizinity_user_profile_${cleanEmail}`, JSON.stringify(newUser));
    
    // Log them in immediately
    const sessionUser = { name: cleanName, email: cleanEmail };
    setUser(sessionUser);
    localStorage.setItem('yizinity_user', JSON.stringify(sessionUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('yizinity_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}