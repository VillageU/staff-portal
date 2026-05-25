import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Staff } from '../lib/supabase';

interface AuthContextType {
  staff: Staff | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedStaff = localStorage.getItem('villageu_staff');
    if (savedStaff) {
      setStaff(JSON.parse(savedStaff));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Invalid email or password');
    }

    setStaff(data);
    localStorage.setItem('villageu_staff', JSON.stringify(data));
  };

  const logout = () => {
    setStaff(null);
    localStorage.removeItem('villageu_staff');
  };

  return (
    <AuthContext.Provider value={{ staff, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
