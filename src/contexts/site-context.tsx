'use client';

import { createContext, useContext, ReactNode } from 'react';

interface SiteContextValue {
  siteId: string;
}

const SiteContext = createContext<SiteContextValue | null>(null);

interface SiteProviderProps {
  siteId: string;
  children: ReactNode;
}

/**
 * 어드민 사이트 컨텍스트 Provider
 * URL의 siteId를 하위 컴포넌트에 제공
 */
export function SiteProvider({ siteId, children }: SiteProviderProps) {
  return <SiteContext.Provider value={{ siteId }}>{children}</SiteContext.Provider>;
}

/**
 * 현재 사이트 컨텍스트를 가져오는 hook
 * SiteProvider 내부에서만 사용 가능
 */
export function useSiteContext() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSiteContext must be used within SiteProvider');
  }
  return context;
}

/**
 * 현재 사이트 ID를 가져오는 hook (편의용)
 */
export function useSiteId() {
  const { siteId } = useSiteContext();
  return siteId;
}
