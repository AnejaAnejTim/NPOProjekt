import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, useEffect, useState } from 'react';

export interface User {
  _id: string;
  username: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  token: string | null;
  refreshUser: () => Promise<boolean>; // Make sure return type is explicit
}

export const UserContext = React.createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saveUserId = async () => {
      if (user?._id) {
        await AsyncStorage.setItem('userId', user._id);
      } else {
        await AsyncStorage.removeItem('userId');
      }
    };
    saveUserId();
  }, [user]);

  const refreshUser = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
      
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return false;
      }

      const response = await fetch('http://100.117.101.70:3001/users/appValidation', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        if (response.status === 304) {
          if (!user) {
            console.warn('Got 304 but no existing user data');
            await AsyncStorage.removeItem('token');
            setUser(null);
            setToken(null);
            setLoading(false);
            return false;
          }
          setLoading(false);
          return true;
        } else {
          const userData = await response.json();
          setUser(userData);
          setLoading(false);
          return true;
        }
      } else {
        await AsyncStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setLoading(false);
        return false;
      }
    } catch (e) {
      console.error('Error refreshing user:', e);
      await AsyncStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, token, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};