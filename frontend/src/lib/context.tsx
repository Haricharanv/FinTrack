import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { get, send } from './api';
import type { User } from './types';
import { today } from './format';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  accept: (user: User) => void;
  logout: () => Promise<void>;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const auth = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        return (await get<{ user: User }>('/auth/me')).user;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return null;
        throw error;
      }
    },
    retry: 1,
    staleTime: 60_000,
  });
  const accept = (user: User) => {
    cache.removeQueries({ queryKey: ['finance'] });
    cache.setQueryData(['auth'], user);
  };
  const logout = async () => {
    await send('post', '/auth/logout');
    cache.clear();
    cache.setQueryData(['auth'], null);
  };
  return (
    <AuthContext.Provider
      value={{
        user: auth.data || null,
        loading: auth.isPending,
        error: auth.error,
        retry: () => {
          void auth.refetch();
        },
        accept,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider is missing');
  return ctx;
}
const MonthContext = createContext<{ month: string; setMonth: (month: string) => void } | null>(
  null,
);
export function MonthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => today(user?.timezone).slice(0, 7));
  return <MonthContext.Provider value={{ month, setMonth }}>{children}</MonthContext.Provider>;
}
export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('MonthProvider is missing');
  return ctx;
}
