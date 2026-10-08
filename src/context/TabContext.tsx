import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type TabType = 'home' | 'jobs' | 'inventory' | 'finance' | 'settings';

type TabContextValue = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

const TabContext = createContext<TabContextValue | null>(null);

/**
 * Owns the bottom-tab selection for the whole app.
 *
 * It must wrap the navigation tree (see App.tsx) rather than living inside
 * `MainTabScreen`, because stack screens pushed on top of the tab container
 * (e.g. `RepairDetailScreen`) also read/switch the active tab.
 */
export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab]);

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTab must be used within TabProvider');
  return ctx;
}
