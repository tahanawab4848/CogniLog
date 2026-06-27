import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export type ViewType =
  | 'home'         // Main Landing Dashboard
  | 'hub'          // Intelligence Hub (global overview)
  | 'import'       // Ingest conversations
  | 'categories'   // Auto-discovered categories
  | 'timeline'     // Global chronological timeline
  | 'graph'        // Global knowledge graph
  | 'analyst'      // AI Analyst (ask anything)
  | 'decisions'    // All decisions extracted
  | 'progress'     // Personal growth & progress analytics
  | 'chats'        // Raw conversation list
  | 'coach'        // Prompt Coach
  | 'devlab';      // Developer Lab

interface GlobalStats {
  totalConversations: number;
  totalMessages: number;
  totalDecisions: number;
  totalInsights: number;
  totalQuestions: number;
  topicsDiscovered: number;
  analysisProgress: number; // 0–100
  lastAnalyzed: string | null;
}

interface AppContextProps {
  activeView: ViewType;
  isLoading: boolean;
  isLoggedIn: boolean;
  isBackendConnected: boolean | null;
  globalStats: GlobalStats;
  categories: any[];
  error: string | null;
  clearError: () => void;
  setActiveView: (view: ViewType) => void;
  refreshGlobalStats: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
}

const DEFAULT_STATS: GlobalStats = {
  totalConversations: 0,
  totalMessages: 0,
  totalDecisions: 0,
  totalInsights: 0,
  totalQuestions: 0,
  topicsDiscovered: 0,
  analysisProgress: 0,
  lastAnalyzed: null,
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const api = useApi();
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!api.token);
  const [globalStats, setGlobalStats] = useState<GlobalStats>(DEFAULT_STATS);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    setIsLoggedIn(!!api.token);
  }, [api.token]);

  const refreshGlobalStats = async () => {
    try {
      const [stats, cats] = await Promise.all([
        api.getGlobalStats(),
        api.getCategories(),
      ]);
      setGlobalStats(stats);
      setCategories(cats);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to communicate with backend. The server might be offline.');
    }
  };

  useEffect(() => {
    if (isLoggedIn) refreshGlobalStats();
  }, [isLoggedIn, api.isBackendConnected]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await api.loginUser(email, pass);
      setIsLoggedIn(true);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    try {
      await api.registerUser(email, pass, name);
      await api.loginUser(email, pass);
      setIsLoggedIn(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logoutUser();
    setIsLoggedIn(false);
    setGlobalStats(DEFAULT_STATS);
    setCategories([]);
    setActiveView('home');
  };

  return (
    <AppContext.Provider value={{
      activeView, isLoading, isLoggedIn,
      isBackendConnected: api.isBackendConnected,
      globalStats, categories, error, clearError,
      setActiveView, refreshGlobalStats,
      login, register, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
