'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CampaignRecord, ChatMessage, PlanState, ShopProfile, WeeklyReport } from './types';

type AppContextValue = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  shopProfile: ShopProfile | null;
  setShopProfile: (p: ShopProfile) => void;
  clearShopProfile: () => void;
  chatHistory: ChatMessage[];
  setChatHistory: (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  planState: PlanState;
  setPlanState: (p: PlanState) => void;
  weeklyReport: WeeklyReport;
  setWeeklyReport: (r: WeeklyReport) => void;
  campaigns: CampaignRecord[];
  setCampaigns: (c: CampaignRecord[] | ((prev: CampaignRecord[]) => CampaignRecord[])) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [shopProfile, setShopProfileState] = useState<ShopProfile | null>(null);
  const [chatHistory, setChatHistoryState] = useState<ChatMessage[]>([]);
  const [planState, setPlanStateRaw] = useState<PlanState>(null);
  const [weeklyReport, setWeeklyReportRaw] = useState<WeeklyReport>(null);
  const [campaigns, setCampaignsRaw] = useState<CampaignRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('isLoggedIn') === '1') setIsLoggedInState(true);
      const p = localStorage.getItem('shopProfile');
      if (p) setShopProfileState(JSON.parse(p));
      const c = localStorage.getItem('chatHistory');
      if (c) setChatHistoryState(JSON.parse(c));
      const pl = localStorage.getItem('planState');
      if (pl) setPlanStateRaw(JSON.parse(pl));
      const wr = localStorage.getItem('weeklyReport');
      if (wr) setWeeklyReportRaw(JSON.parse(wr));
      const cm = localStorage.getItem('campaigns');
      if (cm) setCampaignsRaw(JSON.parse(cm));
    } catch {}
    setHydrated(true);
  }, []);

  const setShopProfile = (p: ShopProfile) => {
    setShopProfileState(p);
    localStorage.setItem('shopProfile', JSON.stringify(p));
  };

  const login = () => {
    localStorage.setItem('isLoggedIn', '1');
    setIsLoggedInState(true);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedInState(false);
    setShopProfileState(null);
    setChatHistoryState([]);
    setPlanStateRaw(null);
    setWeeklyReportRaw(null);
    setCampaignsRaw([]);
    ['shopProfile', 'chatHistory', 'planState', 'weeklyReport', 'campaigns', 'isDemo'].forEach((k) =>
      localStorage.removeItem(k)
    );
  };

  const clearShopProfile = () => {
    setShopProfileState(null);
    setChatHistoryState([]);
    setPlanStateRaw(null);
    setWeeklyReportRaw(null);
    setCampaignsRaw([]);
    ['shopProfile', 'chatHistory', 'planState', 'weeklyReport', 'campaigns'].forEach((k) =>
      localStorage.removeItem(k)
    );
  };

  const setChatHistory = (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChatHistoryState((prev) => {
      const next = typeof msgs === 'function' ? msgs(prev) : msgs;
      localStorage.setItem('chatHistory', JSON.stringify(next.slice(-30)));
      return next;
    });
  };

  const setPlanState = (p: PlanState) => {
    setPlanStateRaw(p);
    if (p) localStorage.setItem('planState', JSON.stringify(p));
    else localStorage.removeItem('planState');
  };

  const setWeeklyReport = (r: WeeklyReport) => {
    setWeeklyReportRaw(r);
    if (r) localStorage.setItem('weeklyReport', JSON.stringify(r));
    else localStorage.removeItem('weeklyReport');
  };

  const setCampaigns = (c: CampaignRecord[] | ((prev: CampaignRecord[]) => CampaignRecord[])) => {
    setCampaignsRaw((prev) => {
      const next = typeof c === 'function' ? c(prev) : c;
      localStorage.setItem('campaigns', JSON.stringify(next));
      return next;
    });
  };

  if (!hydrated) return null;

  return (
    <AppContext.Provider
      value={{
        isLoggedIn, login, logout,
        shopProfile, setShopProfile, clearShopProfile,
        chatHistory, setChatHistory,
        planState, setPlanState,
        weeklyReport, setWeeklyReport,
        campaigns, setCampaigns,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
