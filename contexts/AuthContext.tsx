
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/db';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedSession = localStorage.getItem('yizinity_session_v2');
      if (storedSession) {
        try {
          const sessionUser = JSON.parse(storedSession);
          // Validate with DB
          const dbUser = await db.findUserByEmail(sessionUser.email);
          if (dbUser) {
            setUser({ id: dbUser.id, name: dbUser.name, email: dbUser.email });
          } else {
            localStorage.removeItem('yizinity_session_v2');
          }
        } catch (e) {
          localStorage.removeItem('yizinity_session_v2');
        }
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    
    const dbUser = await db.findUserByEmail(cleanEmail);
    
    if (!dbUser) {
      throw new Error("Account not found. Please sign up first.");
    }
    
    if (dbUser.password !== cleanPass) {
      throw new Error("Incorrect password. Please try again.");
    }

    const sessionUser = { id: dbUser.id, name: dbUser.name, email: dbUser.email };
    setUser(sessionUser);
    localStorage.setItem('yizinity_session_v2', JSON.stringify(sessionUser));
  };

  const signup = async (email: string, name: string, password: string) => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanName = name.trim();

    try {
        const newUser = await db.createUser({
            email: cleanEmail,
            name: cleanName,
            password: cleanPass
        });
        
        const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
        setUser(sessionUser);
        localStorage.setItem('yizinity_session_v2', JSON.stringify(sessionUser));
    } catch (e: any) {
        if (e.message === "User already exists") {
            throw new Error("Account already exists with this email. Please log in.");
        }
        throw e;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('yizinity_session_v2');
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
